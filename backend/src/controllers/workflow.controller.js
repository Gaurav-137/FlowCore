const { createWorkflowSchema, updateWorkflowSchema } = require('../validators/workflow.validator');
const workflowService = require('../services/workflow.service');
const triggerService = require('../services/trigger.service');

async function createWorkflow(req, res, next) {
  try {
    const body = createWorkflowSchema.parse(req.body);
    const wf = await workflowService.createWorkflow(req.user.id, body);
    res.status(201).json(wf);
  } catch (err) {
    next(err);
  }
}

async function listWorkflows(req, res, next) {
  try {
    const list = await workflowService.getWorkflows(req.user.id);
    res.json(list);
  } catch (err) {
    next(err);
  }
}

async function getWorkflow(req, res, next) {
  try {
    const wf = await workflowService.getWorkflowById(req.user.id, req.params.id);
    if (!wf) return res.status(404).json({ error: 'Not found' });
    res.json(wf);
  } catch (err) {
    next(err);
  }
}

async function updateWorkflow(req, res, next) {
  try {
    const body = updateWorkflowSchema.parse(req.body);
    const wf = await workflowService.updateWorkflow(req.user.id, req.params.id, body);
    res.json(wf);
  } catch (err) {
    next(err);
  }
}

async function removeWorkflow(req, res, next) {
  try {
    await workflowService.deleteWorkflow(req.user.id, req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

async function publishWorkflow(req, res, next) {
  try {
    const wf = await workflowService.publishWorkflow(req.user.id, req.params.id, req.body?.comment);
    res.json(wf);
  } catch (err) {
    next(err);
  }
}

async function pauseWorkflow(req, res, next) {
  try {
    const wf = await workflowService.deactivateWorkflow(req.user.id, req.params.id);
    res.json(wf);
  } catch (err) {
    next(err);
  }
}

async function resumeWorkflow(req, res, next) {
  try {
    const wf = await workflowService.activateWorkflow(req.user.id, req.params.id);
    res.json(wf);
  } catch (err) {
    next(err);
  }
}

async function cloneWorkflow(req, res, next) {
  try {
    const wf = await workflowService.cloneWorkflow(req.user.id, req.params.id);
    res.status(201).json(wf);
  } catch (err) {
    next(err);
  }
}

async function executionHistory(req, res, next) {
  try {
    const list = await workflowService.getExecutionHistory(req.user.id, req.params.id);
    res.json(list);
  } catch (err) {
    next(err);
  }
}

async function triggerWorkflow(req, res, next) {
  try {
    const run = await triggerService.triggerWorkflowViaWebhook(req.params.id, { manual: true, ...(req.body || {}) });
    res.status(202).json(run);
  } catch (err) {
    next(err);
  }
}

async function getVersionHistory(req, res, next) {
  try {
    const history = await workflowService.getVersionHistory(req.user.id, req.params.id);
    res.json(history);
  } catch (err) {
    next(err);
  }
}

async function restoreVersion(req, res, next) {
  try {
    const wf = await workflowService.restoreVersion(req.user.id, req.params.id, Number(req.params.version));
    res.json(wf);
  } catch (err) {
    next(err);
  }
}

async function exportWorkflow(req, res, next) {
  try {
    const data = await workflowService.exportWorkflow(req.user.id, req.params.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function importWorkflow(req, res, next) {
  try {
    const wf = await workflowService.importWorkflow(req.user.id, req.body);
    res.status(201).json(wf);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createWorkflow,
  listWorkflows,
  getWorkflow,
  updateWorkflow,
  removeWorkflow,
  publishWorkflow,
  pauseWorkflow,
  resumeWorkflow,
  cloneWorkflow,
  executionHistory,
  triggerWorkflow,
  getVersionHistory,
  restoreVersion,
  exportWorkflow,
  importWorkflow
};
