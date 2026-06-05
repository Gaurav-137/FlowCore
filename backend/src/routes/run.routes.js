const express = require('express');
const { getRun } = require('../controllers/run.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/:id', getRun);

module.exports = router;
