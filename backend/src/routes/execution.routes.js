const express = require('express');
const ctrl = require('../controllers/execution.controller');
const { authenticate } = require('../middleware/auth.middleware');
const router = express.Router();

router.use(authenticate);

router.get('/', ctrl.listExecutions);
router.get('/:runId', ctrl.getExecution);
router.get('/:runId/nodes/:nodeId', ctrl.getNodeExecutionData);
router.post('/:runId/retry', ctrl.retryExecution);
router.post('/:runId/cancel', ctrl.cancelExecution);
router.delete('/:runId', ctrl.deleteExecution);

module.exports = router;
