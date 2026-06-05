const express = require('express');
const ctrl = require('../controllers/nodeType.controller');
const { authenticate } = require('../middleware/auth.middleware');
const router = express.Router();

router.use(authenticate);

router.get('/', ctrl.listNodeTypes);

module.exports = router;
