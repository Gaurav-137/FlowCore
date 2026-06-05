const prisma = require('../prisma/client');
const triggerService = require('../services/trigger.service');

async function handleWebhook(req, res, next) {
  try {
    const { workflowId, secret } = req.params;
    const webhook = await prisma.webhook.findFirst({ where: { workflowId, secret, enabled: true } });
    if (!webhook) return res.status(404).json({ error: 'Webhook not found or invalid secret' });
    const run = await triggerService.triggerWorkflowViaWebhook(workflowId, { headers: req.headers, body: req.body, query: req.query });
    res.status(202).json({ runId: run.id });
  } catch (err) {
    next(err);
  }
}

module.exports = { handleWebhook };
