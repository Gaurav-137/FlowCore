const express = require('express');
const ctrl = require('../controllers/variable.controller');
const { authenticate } = require('../middleware/auth.middleware');
const router = express.Router();

router.use(authenticate);

router.post('/', ctrl.createVariable);
router.get('/', ctrl.listVariables);
router.put('/:id', ctrl.updateVariable);
router.delete('/:id', ctrl.deleteVariable);

module.exports = router;
