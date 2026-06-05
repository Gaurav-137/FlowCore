const express = require('express');
const ctrl = require('../controllers/credential.controller');
const { authenticate } = require('../middleware/auth.middleware');
const router = express.Router();

router.use(authenticate);

router.post('/', ctrl.createCredential);
router.get('/', ctrl.listCredentials);
router.get('/types', ctrl.listCredentialTypes);
router.get('/:id', ctrl.getCredential);
router.put('/:id', ctrl.updateCredential);
router.delete('/:id', ctrl.deleteCredential);
router.post('/:id/test', ctrl.testCredential);

module.exports = router;
