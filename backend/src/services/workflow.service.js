const prisma = require('../prisma/client');

async function createWorkflow(userId, data) {
  return prisma.workflow.create({
    data: {
      userId,
      name: data.name,
      description: data.description,
      nodes: data.nodes ? {
        create: data.nodes.map(n => ({
          type: n.type, label: n.label || null,
          config: n.config || {}, positionX: n.positionX || 0, positionY: n.positionY || 0,
          disabled: n.disabled || false, settings: n.settings || null
        }))
      } : undefined,
      edges: data.edges ? {
        create: data.edges.map(e => ({
          sourceNodeId: e.sourceNodeId, targetNodeId: e.targetNodeId,
          sourceOutput: e.sourceOutput || 0, targetInput: e.targetInput || 0,
          branchType: e.branchType || null
        }))
      } : undefined
    },
    include: { nodes: true, edges: true }
  });
}

async function getWorkflows(userId, { status, page = 1, limit = 50 } = {}) {
  const where = { userId };
  if (status) where.status = status;
  const [workflows, total] = await Promise.all([
    prisma.workflow.findMany({
      where, orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit, take: limit,
      include: { tags: { include: { tag: true } }, _count: { select: { runs: true } } }
    }),
    prisma.workflow.count({ where })
  ]);
  return { workflows, total, page, limit };
}

async function getWorkflowById(userId, workflowId) {
  return prisma.workflow.findFirst({
    where: { id: workflowId, userId },
    include: {
      nodes: true, edges: true,
      tags: { include: { tag: true } },
      schedules: true, webhooks: true
    }
  });
}

async function updateWorkflow(userId, workflowId, data) {
  const workflow = await prisma.workflow.findFirst({ where: { id: workflowId, userId } });
  if (!workflow) throw new Error('Workflow not found');

  // Use transaction for atomicity
  return prisma.$transaction(async (tx) => {
    await tx.workflow.update({
      where: { id: workflowId },
      data: {
        name: data.name || workflow.name,
        description: data.description !== undefined ? data.description : workflow.description,
        settings: data.settings !== undefined ? data.settings : workflow.settings
      }
    });

    if (data.nodes) {
      await tx.workflowNode.deleteMany({ where: { workflowId } });
      if (data.nodes.length > 0) {
        await tx.workflowNode.createMany({
          data: data.nodes.map(n => ({
            id: n.id || undefined, workflowId, type: n.type,
            label: n.label || null, config: n.config || {},
            positionX: n.positionX || 0, positionY: n.positionY || 0,
            disabled: n.disabled || false, settings: n.settings || null
          }))
        });
      }
    }

    if (data.edges) {
      await tx.workflowEdge.deleteMany({ where: { workflowId } });
      if (data.edges.length > 0) {
        await tx.workflowEdge.createMany({
          data: data.edges.map(e => ({
            workflowId, sourceNodeId: e.sourceNodeId, targetNodeId: e.targetNodeId,
            sourceOutput: e.sourceOutput || 0, targetInput: e.targetInput || 0,
            branchType: e.branchType || null
          }))
        });
      }
    }

    return tx.workflow.findUnique({
      where: { id: workflowId },
      include: { nodes: true, edges: true }
    });
  });
}

async function deleteWorkflow(userId, workflowId) {
  const wf = await prisma.workflow.findFirst({ where: { id: workflowId, userId } });
  if (!wf) throw new Error('Workflow not found');
  // Cascade deletes handled by Prisma schema onDelete: Cascade
  await prisma.workflow.delete({ where: { id: workflowId } });
  return true;
}

async function publishWorkflow(userId, workflowId, comment) {
  const wf = await prisma.workflow.findFirst({
    where: { id: workflowId, userId },
    include: { nodes: true, edges: true }
  });
  if (!wf) throw new Error('Workflow not found');

  return prisma.$transaction(async (tx) => {
    // Create version snapshot
    await tx.workflowVersion.create({
      data: {
        workflowId,
        version: wf.version + 1,
        snapshot: { nodes: wf.nodes, edges: wf.edges, settings: wf.settings },
        comment: comment || `Published version ${wf.version + 1}`,
        createdBy: userId
      }
    });

    return tx.workflow.update({
      where: { id: workflowId },
      data: { status: 'ACTIVE', version: { increment: 1 } }
    });
  });
}

const crypto = require('crypto');

async function deactivateWorkflow(userId, workflowId) {
  const wf = await prisma.workflow.findFirst({ where: { id: workflowId, userId } });
  if (!wf) throw new Error('Workflow not found');
  
  const updated = await prisma.$transaction(async (tx) => {
    await tx.webhook.updateMany({ where: { workflowId }, data: { enabled: false } });
    await tx.workflowSchedule.updateMany({ where: { workflowId }, data: { enabled: false } });
    return tx.workflow.update({ where: { id: workflowId }, data: { status: 'INACTIVE' } });
  });

  try {
    const { reloadSchedules } = require('../triggers/cron');
    await reloadSchedules();
  } catch (err) {
    console.error('Failed to reload cron schedules after deactivation:', err);
  }

  return updated;
}

async function activateWorkflow(userId, workflowId) {
  const wf = await prisma.workflow.findFirst({
    where: { id: workflowId, userId },
    include: { nodes: true }
  });
  if (!wf) throw new Error('Workflow not found');

  const updated = await prisma.$transaction(async (tx) => {
    // 1. Webhook provision
    const webhookNodes = wf.nodes.filter(n => n.type === 'webhook' && !n.disabled);
    if (webhookNodes.length > 0) {
      const existing = await tx.webhook.findFirst({ where: { workflowId } });
      if (!existing) {
        await tx.webhook.create({
          data: {
            workflowId,
            secret: crypto.randomBytes(16).toString('hex'),
            enabled: true
          }
        });
      } else {
        await tx.webhook.updateMany({ where: { workflowId }, data: { enabled: true } });
      }
    }

    // 2. Schedule provision
    await tx.workflowSchedule.deleteMany({ where: { workflowId } });
    const scheduleNodes = wf.nodes.filter(n => n.type === 'schedule' && !n.disabled);
    for (const node of scheduleNodes) {
      const config = node.config || {};
      const cronExpr = config.cronExpression || '0 * * * *';
      const tz = config.timezone || 'UTC';
      await tx.workflowSchedule.create({
        data: {
          workflowId,
          cronExpression: cronExpr,
          timezone: tz,
          enabled: true
        }
      });
    }

    return tx.workflow.update({ where: { id: workflowId }, data: { status: 'ACTIVE' } });
  });

  try {
    const { reloadSchedules } = require('../triggers/cron');
    await reloadSchedules();
  } catch (err) {
    console.error('Failed to reload cron schedules after activation:', err);
  }

  return updated;
}

// FIXED: Clone now properly remaps node IDs in edges
async function cloneWorkflow(userId, workflowId) {
  const wf = await prisma.workflow.findFirst({
    where: { id: workflowId, userId },
    include: { nodes: true, edges: true }
  });
  if (!wf) throw new Error('Workflow not found');

  // Create the workflow first without edges
  const cloned = await prisma.workflow.create({
    data: {
      userId,
      name: wf.name + ' (copy)',
      description: wf.description,
      status: 'DRAFT',
      settings: wf.settings,
      nodes: {
        create: wf.nodes.map(n => ({
          type: n.type, label: n.label, config: n.config,
          positionX: n.positionX, positionY: n.positionY,
          disabled: n.disabled, settings: n.settings
        }))
      }
    },
    include: { nodes: true }
  });

  // Build ID mapping: old node ID → new node ID (by position match)
  const idMap = new Map();
  for (let i = 0; i < wf.nodes.length; i++) {
    idMap.set(wf.nodes[i].id, cloned.nodes[i].id);
  }

  // Create edges with remapped IDs
  if (wf.edges.length > 0) {
    await prisma.workflowEdge.createMany({
      data: wf.edges.map(e => ({
        workflowId: cloned.id,
        sourceNodeId: idMap.get(e.sourceNodeId) || e.sourceNodeId,
        targetNodeId: idMap.get(e.targetNodeId) || e.targetNodeId,
        sourceOutput: e.sourceOutput, targetInput: e.targetInput,
        branchType: e.branchType
      }))
    });
  }

  return prisma.workflow.findUnique({
    where: { id: cloned.id },
    include: { nodes: true, edges: true }
  });
}

async function getExecutionHistory(userId, workflowId, { page = 1, limit = 20 } = {}) {
  const wf = await prisma.workflow.findFirst({ where: { id: workflowId, userId } });
  if (!wf) throw new Error('Workflow not found');
  const [runs, total] = await Promise.all([
    prisma.workflowRun.findMany({
      where: { workflowId },
      orderBy: { startedAt: 'desc' },
      skip: (page - 1) * limit, take: limit
    }),
    prisma.workflowRun.count({ where: { workflowId } })
  ]);
  return { runs, total, page, limit };
}

async function getVersionHistory(userId, workflowId) {
  const wf = await prisma.workflow.findFirst({ where: { id: workflowId, userId } });
  if (!wf) throw new Error('Workflow not found');
  return prisma.workflowVersion.findMany({
    where: { workflowId },
    orderBy: { version: 'desc' }
  });
}

async function restoreVersion(userId, workflowId, version) {
  const wf = await prisma.workflow.findFirst({ where: { id: workflowId, userId } });
  if (!wf) throw new Error('Workflow not found');
  const ver = await prisma.workflowVersion.findUnique({
    where: { workflowId_version: { workflowId, version } }
  });
  if (!ver) throw new Error('Version not found');

  const snapshot = ver.snapshot;
  return updateWorkflow(userId, workflowId, {
    nodes: snapshot.nodes || [],
    edges: snapshot.edges || [],
    settings: snapshot.settings
  });
}

async function exportWorkflow(userId, workflowId) {
  const wf = await prisma.workflow.findFirst({
    where: { id: workflowId, userId },
    include: { nodes: true, edges: true }
  });
  if (!wf) throw new Error('Workflow not found');
  return {
    name: wf.name,
    description: wf.description,
    settings: wf.settings,
    nodes: wf.nodes.map(n => ({
      type: n.type, label: n.label, config: n.config,
      positionX: n.positionX, positionY: n.positionY,
      disabled: n.disabled, settings: n.settings
    })),
    edges: wf.edges.map(e => ({
      sourceNodeId: e.sourceNodeId, targetNodeId: e.targetNodeId,
      sourceOutput: e.sourceOutput, targetInput: e.targetInput,
      branchType: e.branchType
    })),
    exportedAt: new Date().toISOString(),
    version: wf.version
  };
}

async function importWorkflow(userId, data) {
  return createWorkflow(userId, {
    name: data.name || 'Imported Workflow',
    description: data.description,
    nodes: data.nodes || [],
    edges: data.edges || []
  });
}

module.exports = {
  createWorkflow, getWorkflows, getWorkflowById, updateWorkflow,
  deleteWorkflow, publishWorkflow, deactivateWorkflow, activateWorkflow,
  cloneWorkflow, getExecutionHistory, getVersionHistory, restoreVersion,
  exportWorkflow, importWorkflow
};
