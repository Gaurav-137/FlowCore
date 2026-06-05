const prisma = require('../prisma/client');
const triggerService = require('../services/trigger.service');

async function listExecutions(req, res, next) {
  try {
    const { page = 1, limit = 20, status, workflowId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (workflowId) where.workflowId = workflowId;
    // Only show user's workflow runs
    where.workflow = { userId: req.user.id };
    const [runs, total] = await Promise.all([
      prisma.workflowRun.findMany({
        where, orderBy: { startedAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit), take: Number(limit),
        include: { workflow: { select: { id: true, name: true } } }
      }),
      prisma.workflowRun.count({ where })
    ]);
    res.json({ runs, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
}

async function getExecution(req, res, next) {
  try {
    const run = await prisma.workflowRun.findFirst({
      where: { id: req.params.runId, workflow: { userId: req.user.id } },
      include: { nodeExecutions: { orderBy: { startedAt: 'asc' } }, workflow: { select: { id: true, name: true } } }
    });
    if (!run) return res.status(404).json({ error: 'Not found' });
    res.json(run);
  } catch (err) { next(err); }
}

async function getNodeExecutionData(req, res, next) {
  try {
    const exec = await prisma.nodeExecution.findFirst({
      where: { workflowRunId: req.params.runId, nodeId: req.params.nodeId,
        workflowRun: { workflow: { userId: req.user.id } } }
    });
    if (!exec) return res.status(404).json({ error: 'Not found' });
    res.json(exec);
  } catch (err) { next(err); }
}

async function retryExecution(req, res, next) {
  try {
    const run = await prisma.workflowRun.findFirst({
      where: { id: req.params.runId, workflow: { userId: req.user.id } },
      include: { nodeExecutions: true }
    });
    if (!run) return res.status(404).json({ error: 'Not found' });
    const failedNode = run.nodeExecutions.find(n => n.status === 'FAILED');
    const startNodeId = failedNode ? failedNode.nodeId : null;
    const newRun = await triggerService.triggerWorkflowViaWebhook(run.workflowId, {
      retryOf: run.id, ...(run.triggerPayload || {})
    });
    res.status(202).json(newRun);
  } catch (err) { next(err); }
}

async function cancelExecution(req, res, next) {
  try {
    const run = await prisma.workflowRun.findFirst({
      where: { id: req.params.runId, status: 'RUNNING', workflow: { userId: req.user.id } }
    });
    if (!run) return res.status(404).json({ error: 'Not found or not running' });
    await prisma.workflowRun.update({
      where: { id: req.params.runId },
      data: { status: 'CANCELLED', completedAt: new Date(), errorMessage: 'Cancelled by user' }
    });
    res.json({ cancelled: true });
  } catch (err) { next(err); }
}

async function deleteExecution(req, res, next) {
  try {
    const run = await prisma.workflowRun.findFirst({
      where: { id: req.params.runId, workflow: { userId: req.user.id } }
    });
    if (!run) return res.status(404).json({ error: 'Not found' });
    await prisma.workflowRun.delete({ where: { id: req.params.runId } });
    res.status(204).end();
  } catch (err) { next(err); }
}

module.exports = { listExecutions, getExecution, getNodeExecutionData, retryExecution, cancelExecution, deleteExecution };
