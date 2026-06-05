const prisma = require('../prisma/client');
const { getWorkflowExecutionQueue } = require('../queues/bull');
const { getRedis } = require('../queues/connection');

async function createWorkflowRun(workflowId, triggerPayload = {}) {
  const run = await prisma.workflowRun.create({ data: { workflowId, status: 'RUNNING', triggerPayload } });
  return run;
}

async function findStartNode(workflowId) {
  const nodes = await prisma.workflowNode.findMany({ where: { workflowId } });
  const edges = await prisma.workflowEdge.findMany({ where: { workflowId } });
  const targetIds = new Set(edges.map((e) => e.targetNodeId));
  const start = nodes.find((n) => !targetIds.has(n.id));
  return start || nodes[0] || null;
}

async function triggerWorkflowViaWebhook(workflowId, payload = {}) {
  // idempotency: if client provided Idempotency-Key, dedupe using Redis
  try {
    const idKey = (payload.headers && (payload.headers['idempotency-key'] || payload.headers['Idempotency-Key'])) || null;
    if (idKey) {
      const redisKey = `webhook:${workflowId}:idempotency:${idKey}`;
      const existing = await getRedis().get(redisKey);
      if (existing) {
        return { id: existing, deduped: true };
      }
    }
  } catch (err) {
    // log and continue
    console.error('Redis idempotency check failed', err);
  }

  // create run
  const run = await createWorkflowRun(workflowId, payload);
  try {
    const idKey = (payload.headers && (payload.headers['idempotency-key'] || payload.headers['Idempotency-Key'])) || null;
    if (idKey) {
      const redisKey = `webhook:${workflowId}:idempotency:${idKey}`;
      await getRedis().set(redisKey, run.id, 'EX', 60 * 60 * 24);
    }
  } catch (err) {
    console.error('Redis idempotency set failed', err);
  }
  const startNode = await findStartNode(workflowId);
  // enqueue job for execution; worker will process the workflow
  await getWorkflowExecutionQueue().add('execute-workflow', { workflowRunId: run.id, workflowId, startNodeId: startNode ? startNode.id : null, input: payload }, { attempts: 5, backoff: { type: 'exponential', delay: 1000 } });
  return run;
}

async function triggerWorkflowBySchedule(workflowId, scheduleId) {
  // include schedule metadata in payload
  return triggerWorkflowViaWebhook(workflowId, { scheduleId });
}

module.exports = { triggerWorkflowViaWebhook, triggerWorkflowBySchedule };
