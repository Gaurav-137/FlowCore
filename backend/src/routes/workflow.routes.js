const express = require('express');
const ctrl = require('../controllers/workflow.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.post('/import', ctrl.importWorkflow);
router.post('/', ctrl.createWorkflow);
router.get('/', ctrl.listWorkflows);
router.get('/:id', ctrl.getWorkflow);
router.put('/:id', ctrl.updateWorkflow);
router.delete('/:id', ctrl.removeWorkflow);
router.post('/:id/publish', ctrl.publishWorkflow);
router.post('/:id/pause', ctrl.pauseWorkflow);
router.post('/:id/resume', ctrl.resumeWorkflow);
router.post('/:id/clone', ctrl.cloneWorkflow);
router.get('/:id/runs', ctrl.executionHistory);
router.post('/:id/trigger', ctrl.triggerWorkflow);
router.get('/:id/versions', ctrl.getVersionHistory);
router.post('/:id/versions/:version/restore', ctrl.restoreVersion);
router.get('/:id/export', ctrl.exportWorkflow);

module.exports = router;
