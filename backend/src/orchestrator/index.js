const prisma = require('../prisma/client');
const nodeRegistry = require('../nodes/registry');
const expressionEngine = require('../services/expression.service');
const { getDecryptedCredential } = require('../services/credential.service');
const { getDecryptedVariablesMap } = require('../services/variable.service');
const { emit } = require('../sockets/emitter');
const { getDelayQueue } = require('../queues/bull');
const { logger } = require('../utils/logger');

// ── Execution Context ─────────────────────────────────

class ExecutionContext {
  constructor({ workflowRunId, workflow, credentials, variables, mode, triggerPayload, userId }) {
    this.runId = workflowRunId;
    this.workflow = workflow;
    this.runData = {};        // nodeId → { items, status, error, startTime, endTime }
    this.credentials = credentials || {};
    this.variables = variables || {};
    this.mode = mode || 'manual';
    this.triggerPayload = triggerPayload || {};
    this.userId = userId;
    this.cancelledAt = null;
  }

  getNodeOutput(nodeId) {
    return this.runData[nodeId]?.items || [];
  }

  getNodeOutputsByName() {
    const map = {};
    for (const node of this.workflow.nodes) {
      const label = node.label || node.type;
      if (this.runData[node.id]) {
        map[label] = {
          json: this.runData[node.id].items?.[0]?.json || {},
          items: this.runData[node.id].items || []
        };
      }
    }
    return map;
  }

  buildExpressionContext(currentItem, inputItems, itemIndex) {
    return {
      currentItem,
      inputItems,
      itemIndex,
      nodeOutputs: this.getNodeOutputsByName(),
      variables: this.variables,
      env: this.getAllowedEnv(),
      runId: this.runId,
      mode: this.mode,
      workflowId: this.workflow.id,
      workflowName: this.workflow.name
    };
  }

  getAllowedEnv() {
    const allowed = ['NODE_ENV', 'TZ'];
    const env = {};
    for (const key of allowed) {
      if (process.env[key]) env[key] = process.env[key];
    }
    return env;
  }
}

// ── Node Execution Wrapper ────────────────────────────

function createNodeContext(execCtx, node, inputItems) {
  const nodeConfig = node.config || {};
  return {
    ...execCtx,
    triggerPayload: execCtx.triggerPayload,
    getParameter(name, ctxOverride) {
      return nodeConfig[name];
    },
    evaluateExpression(template, ctxOverride) {
      const exprCtx = ctxOverride?.currentItem
        ? ctxOverride
        : execCtx.buildExpressionContext(inputItems[0], inputItems, 0);
      return expressionEngine.evaluate(template, exprCtx);
    },
    async getCredential(credTypeName) {
      const credId = nodeConfig.credentialId || nodeConfig[`${credTypeName}Id`];
      if (!credId) return null;
      try {
        const cred = await getDecryptedCredential(credId, execCtx.userId);
        return cred.data;
      } catch { return null; }
    },
    setWebhookResponse: null,
    executeSubWorkflow: null,
    batchIndex: 0
  };
}

// ── Graph Builder ─────────────────────────────────────

function buildGraph(workflow) {
  const nodes = new Map();
  const edges = [];
  const incomingEdges = new Map();  // nodeId → [edges]
  const outgoingEdges = new Map();  // nodeId → [edges]

  for (const node of workflow.nodes) {
    nodes.set(node.id, node);
    incomingEdges.set(node.id, []);
    outgoingEdges.set(node.id, []);
  }

  for (const edge of workflow.edges) {
    edges.push(edge);
    const incoming = incomingEdges.get(edge.targetNodeId) || [];
    incoming.push(edge);
    incomingEdges.set(edge.targetNodeId, incoming);
    const outgoing = outgoingEdges.get(edge.sourceNodeId) || [];
    outgoing.push(edge);
    outgoingEdges.set(edge.sourceNodeId, outgoing);
  }

  const roots = [];
  for (const [nodeId, incoming] of incomingEdges) {
    if (incoming.length === 0) roots.push(nodeId);
  }

  return { nodes, edges, incomingEdges, outgoingEdges, roots };
}

// ── Core Engine ───────────────────────────────────────

async function executeNode(execCtx, node, inputItems) {
  const start = Date.now();
  const nodeId = node.id;
  const nodeName = node.label || node.type;

  // Check if disabled
  if (node.disabled) {
    emit('node.skipped', { workflowRunId: execCtx.runId, nodeId, nodeName, reason: 'disabled' }, `workflow:${execCtx.runId}`);
    await prisma.nodeExecution.upsert({
      where: { workflowRunId_nodeId: { workflowRunId: execCtx.runId, nodeId } },
      create: { workflowRunId: execCtx.runId, nodeId, nodeName, status: 'SKIPPED', startedAt: new Date(), completedAt: new Date() },
      update: { status: 'SKIPPED', completedAt: new Date() }
    });
    return { items: inputItems, skipped: true };
  }

  // Check pin data
  const pinData = await prisma.nodePinData.findUnique({
    where: { workflowId_nodeId: { workflowId: execCtx.workflow.id, nodeId } }
  });
  if (pinData && execCtx.mode !== 'production') {
    const pinnedItems = Array.isArray(pinData.data) ? pinData.data : [{ json: pinData.data }];
    await prisma.nodeExecution.upsert({
      where: { workflowRunId_nodeId: { workflowRunId: execCtx.runId, nodeId } },
      create: { workflowRunId: execCtx.runId, nodeId, nodeName, status: 'SUCCESS', inputData: inputItems, outputData: pinnedItems, durationMs: 0, startedAt: new Date(), completedAt: new Date() },
      update: { status: 'SUCCESS', outputData: pinnedItems, durationMs: 0, completedAt: new Date() }
    });
    emit('node.completed', { workflowRunId: execCtx.runId, nodeId, nodeName, itemCount: pinnedItems.length, pinned: true }, `workflow:${execCtx.runId}`);
    return { items: pinnedItems };
  }

  // Idempotency check
  const existing = await prisma.nodeExecution.findUnique({
    where: { workflowRunId_nodeId: { workflowRunId: execCtx.runId, nodeId } }
  });
  if (existing && existing.status === 'SUCCESS') {
    return { items: existing.outputData || inputItems };
  }

  // Create/update execution record
  await prisma.nodeExecution.upsert({
    where: { workflowRunId_nodeId: { workflowRunId: execCtx.runId, nodeId } },
    create: { workflowRunId: execCtx.runId, nodeId, nodeName, status: 'RUNNING', inputData: inputItems, startedAt: new Date() },
    update: { status: 'RUNNING', inputData: inputItems, startedAt: new Date(), errorMessage: null }
  });
  emit('node.started', { workflowRunId: execCtx.runId, nodeId, nodeName }, `workflow:${execCtx.runId}`);

  // Resolve node type
  const nodeType = node.type;
  // Map legacy names
  const typeMap = { 'http_request': 'httpRequest', 'condition': 'if', 'sticky_note': null };
  const resolvedType = typeMap[nodeType] !== undefined ? typeMap[nodeType] : nodeType;

  if (!resolvedType) {
    // Skip non-executable nodes like sticky_note
    return { items: inputItems, skipped: true };
  }

  const nodeDef = nodeRegistry.get(resolvedType);
  if (!nodeDef) {
    throw new Error(`Unknown node type: ${resolvedType}`);
  }

  // Execute
  const nodeContext = createNodeContext(execCtx, node, inputItems);
  const output = await nodeDef.execute(nodeContext, inputItems);
  const duration = Date.now() - start;

  // Handle delay/wait response
  if (output && output.delayed) {
    await prisma.nodeExecution.update({
      where: { workflowRunId_nodeId: { workflowRunId: execCtx.runId, nodeId } },
      data: { status: 'SUCCESS', outputData: output.items || inputItems, durationMs: duration, completedAt: new Date() }
    });
    emit('node.completed', { workflowRunId: execCtx.runId, nodeId, nodeName, delayed: true }, `workflow:${execCtx.runId}`);
    return { items: output.items || inputItems, delayed: true, delayMs: output.delayMs };
  }

  // Normalize output — multi-output nodes return array of arrays
  let outputItems;
  let isMultiOutput = false;
  if (Array.isArray(output) && output.length > 0 && Array.isArray(output[0])) {
    isMultiOutput = true;
    outputItems = output;
  } else if (Array.isArray(output)) {
    outputItems = output;
  } else {
    outputItems = [{ json: output || {} }];
  }

  // Store in execution context
  const flatItems = isMultiOutput ? output.flat() : outputItems;
  execCtx.runData[nodeId] = { items: flatItems, status: 'success' };

  await prisma.nodeExecution.update({
    where: { workflowRunId_nodeId: { workflowRunId: execCtx.runId, nodeId } },
    data: { status: 'SUCCESS', outputData: flatItems, durationMs: duration, completedAt: new Date() }
  });
  await prisma.workflowRun.update({
    where: { id: execCtx.runId },
    data: { lastExecutedNodeId: nodeId }
  }).catch(() => {});

  emit('node.completed', {
    workflowRunId: execCtx.runId, nodeId, nodeName,
    itemCount: flatItems.length, durationMs: duration
  }, `workflow:${execCtx.runId}`);

  return { items: outputItems, isMultiOutput };
}

async function executeNodeWithRetry(execCtx, node, inputItems) {
  const settings = node.settings || {};
  const maxRetries = settings.retryOnFail ? (settings.maxRetries || 1) : 0;
  const retryDelay = settings.retryDelayMs || 1000;
  const continueOnFail = settings.continueOnFail || false;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await executeNode(execCtx, node, inputItems);
    } catch (error) {
      const duration = 0;
      if (attempt < maxRetries) {
        emit('node.retrying', {
          workflowRunId: execCtx.runId, nodeId: node.id,
          attempt: attempt + 1, error: error.message
        }, `workflow:${execCtx.runId}`);
        await new Promise(r => setTimeout(r, retryDelay * Math.pow(2, attempt)));
        await prisma.nodeExecution.update({
          where: { workflowRunId_nodeId: { workflowRunId: execCtx.runId, nodeId: node.id } },
          data: { attempt: attempt + 2, status: 'RUNNING' }
        }).catch(() => {});
      } else {
        await prisma.nodeExecution.update({
          where: { workflowRunId_nodeId: { workflowRunId: execCtx.runId, nodeId: node.id } },
          data: { status: 'FAILED', errorMessage: error.message, completedAt: new Date() }
        }).catch(() => {});
        emit('node.failed', {
          workflowRunId: execCtx.runId, nodeId: node.id,
          nodeName: node.label || node.type, error: error.message
        }, `workflow:${execCtx.runId}`);

        if (continueOnFail) {
          execCtx.runData[node.id] = { items: [{ json: { error: error.message } }], status: 'failed' };
          return { items: [{ json: { error: error.message, _errorNode: node.id } }], continuedOnFail: true };
        }
        throw error;
      }
    }
  }
}

// ── Main Workflow Execution ───────────────────────────

async function executeWorkflow(jobData) {
  const { workflowRunId, workflowId, startNodeId, input } = jobData;
  logger.info({ workflowRunId, workflowId }, 'executeWorkflow start');

  // Load workflow with nodes and edges
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    include: { nodes: true, edges: true }
  });

  if (!workflow) {
    throw new Error(`Workflow ${workflowId} not found`);
  }

  // Get user for credential access
  const run = await prisma.workflowRun.findUnique({ where: { id: workflowRunId } });
  const userId = workflow.userId;

  // Load variables
  let variables = {};
  try {
    variables = await getDecryptedVariablesMap(userId);
  } catch (e) {
    logger.warn({ error: e.message }, 'Failed to load variables');
  }

  const execCtx = new ExecutionContext({
    workflowRunId, workflow, variables,
    mode: run?.mode || 'manual',
    triggerPayload: run?.triggerPayload || input || {},
    userId
  });

  emit('workflow.started', { workflowRunId }, `workflow:${workflowRunId}`);

  try {
    await prisma.workflowRun.update({
      where: { id: workflowRunId },
      data: { status: 'RUNNING', startedAt: new Date() }
    }).catch(() => {});

    const graph = buildGraph(workflow);

    // Determine start nodes
    let startNodes;
    if (startNodeId) {
      startNodes = [startNodeId];
    } else {
      startNodes = graph.roots.length > 0 ? graph.roots : [workflow.nodes[0]?.id].filter(Boolean);
    }

    if (startNodes.length === 0) {
      throw new Error('No start node found');
    }

    // BFS-style execution with parallel branch support
    const nodeStates = new Map();       // nodeId → 'pending' | 'running' | 'done' | 'failed'
    const pendingInputs = new Map();    // nodeId → Map<inputIndex, items[]>

    for (const node of workflow.nodes) {
      nodeStates.set(node.id, 'pending');
      pendingInputs.set(node.id, new Map());
    }

    // Seed start nodes with trigger payload
    const initialItems = [{ json: execCtx.triggerPayload }];
    const runQueue = [];

    for (const startId of startNodes) {
      pendingInputs.get(startId)?.set(0, initialItems);
      runQueue.push(startId);
    }

    while (runQueue.length > 0) {
      // Check cancellation
      if (execCtx.cancelledAt) {
        await prisma.workflowRun.update({
          where: { id: workflowRunId },
          data: { status: 'CANCELLED', completedAt: new Date() }
        });
        emit('workflow.cancelled', { workflowRunId }, `workflow:${workflowRunId}`);
        return;
      }

      const currentNodeId = runQueue.shift();
      if (nodeStates.get(currentNodeId) === 'done' || nodeStates.get(currentNodeId) === 'failed') continue;

      const node = graph.nodes.get(currentNodeId);
      if (!node) continue;

      nodeStates.set(currentNodeId, 'running');

      // Gather input items from all incoming edges
      const nodeInputs = pendingInputs.get(currentNodeId);
      let inputItems;
      if (nodeInputs.size > 0) {
        // For merge nodes with multiple inputs, pass inputData map
        if (nodeInputs.size > 1) {
          inputItems = [];
          for (const [, items] of nodeInputs) {
            inputItems.push(...items);
          }
        } else {
          inputItems = [...nodeInputs.values()][0] || initialItems;
        }
      } else {
        inputItems = initialItems;
      }

      try {
        const result = await executeNodeWithRetry(execCtx, node, inputItems);

        if (result.skipped) {
          nodeStates.set(currentNodeId, 'done');
          // Pass items through to downstream
          const outEdges = graph.outgoingEdges.get(currentNodeId) || [];
          for (const edge of outEdges) {
            const targetInputs = pendingInputs.get(edge.targetNodeId);
            if (targetInputs) {
              const inputIdx = edge.targetInput || 0;
              targetInputs.set(inputIdx, inputItems);
              // Check if all required inputs are ready
              const reqCount = (graph.incomingEdges.get(edge.targetNodeId) || []).length;
              if (targetInputs.size >= reqCount && nodeStates.get(edge.targetNodeId) === 'pending') {
                runQueue.push(edge.targetNodeId);
              }
            }
          }
          continue;
        }

        if (result.delayed) {
          nodeStates.set(currentNodeId, 'done');
          const outEdges = graph.outgoingEdges.get(currentNodeId) || [];
          if (outEdges.length > 0) {
            const nextNodeId = outEdges[0].targetNodeId;
            await getDelayQueue().add('delay-finish', {
              workflowRunId, workflowId,
              nextNodeId,
              input: result.items
            }, { delay: result.delayMs || 1000, attempts: 3 });
          }
          return; // Stop execution, will resume after delay
        }

        nodeStates.set(currentNodeId, 'done');

        // Route output to downstream nodes
        const outEdges = graph.outgoingEdges.get(currentNodeId) || [];

        if (result.isMultiOutput) {
          // Multi-output node (IF, Switch): route by output index
          for (const edge of outEdges) {
            const outputIdx = edge.sourceOutput || 0;
            // Also support legacy branchType
            let edgeOutputIdx = outputIdx;
            if (edge.branchType === 'true') edgeOutputIdx = 0;
            else if (edge.branchType === 'false') edgeOutputIdx = 1;

            const outputForEdge = result.items[edgeOutputIdx] || [];
            if (outputForEdge.length > 0) {
              const targetInputs = pendingInputs.get(edge.targetNodeId);
              if (targetInputs) {
                const inputIdx = edge.targetInput || 0;
                targetInputs.set(inputIdx, outputForEdge);
                const reqCount = (graph.incomingEdges.get(edge.targetNodeId) || []).length;
                if (targetInputs.size >= reqCount && nodeStates.get(edge.targetNodeId) === 'pending') {
                  runQueue.push(edge.targetNodeId);
                }
              }
            }
          }
        } else {
          // Single output: send to all downstream
          for (const edge of outEdges) {
            // Legacy condition branching support
            if (edge.branchType) {
              const firstItem = result.items[0];
              const condResult = firstItem?.json?.result;
              if (edge.branchType === 'true' && condResult !== true) continue;
              if (edge.branchType === 'false' && condResult !== false) continue;
            }

            const targetInputs = pendingInputs.get(edge.targetNodeId);
            if (targetInputs) {
              const inputIdx = edge.targetInput || 0;
              targetInputs.set(inputIdx, result.items);
              const reqCount = (graph.incomingEdges.get(edge.targetNodeId) || []).length;
              if (targetInputs.size >= reqCount && nodeStates.get(edge.targetNodeId) === 'pending') {
                runQueue.push(edge.targetNodeId);
              }
            }
          }
        }
      } catch (err) {
        nodeStates.set(currentNodeId, 'failed');
        logger.error({ nodeId: currentNodeId, error: err.message }, 'Node execution failed');

        await prisma.workflowRun.update({
          where: { id: workflowRunId },
          data: { status: 'FAILED', completedAt: new Date(), errorMessage: `Node "${node.label || node.type}" failed: ${err.message}` }
        });
        emit('workflow.failed', { workflowRunId, error: err.message, nodeId: currentNodeId }, `workflow:${workflowRunId}`);
        throw err;
      }
    }

    // Check if all executed nodes succeeded
    const hasFailure = [...nodeStates.values()].some(s => s === 'failed');
    const finalStatus = hasFailure ? 'FAILED' : 'SUCCESS';

    await prisma.workflowRun.update({
      where: { id: workflowRunId },
      data: { status: finalStatus, completedAt: new Date() }
    });
    emit(hasFailure ? 'workflow.failed' : 'workflow.completed', { workflowRunId }, `workflow:${workflowRunId}`);

  } catch (err) {
    logger.error({ err, workflowRunId }, 'Workflow execution failed');
    await prisma.workflowRun.update({
      where: { id: workflowRunId },
      data: { status: 'FAILED', completedAt: new Date(), errorMessage: err.message }
    }).catch(() => {});
    emit('workflow.failed', { workflowRunId, error: err.message }, `workflow:${workflowRunId}`);
    throw err;
  }
}

module.exports = { executeWorkflow, ExecutionContext };
