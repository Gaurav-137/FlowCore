const prisma = require('../prisma/client');

async function getRun(req, res, next) {
  try {
    const runId = req.params.id;
    const run = await prisma.workflowRun.findUnique({ where: { id: runId }, include: { nodeExecutions: true } });
    if (!run) return res.status(404).json({ error: 'Run not found' });
    res.json(run);
  } catch (err) {
    next(err);
  }
}

module.exports = { getRun };
