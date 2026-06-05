const express = require('express');
const { handleWebhook } = require('../controllers/webhook.controller');

const router = express.Router();

// POST /webhooks/:workflowId/:secret
router.post('/:workflowId/:secret', handleWebhook);

module.exports = router;
