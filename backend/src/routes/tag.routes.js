const express = require('express');
const ctrl = require('../controllers/tag.controller');
const { authenticate } = require('../middleware/auth.middleware');
const router = express.Router();

router.use(authenticate);

router.get('/', ctrl.listTags);
router.post('/', ctrl.createTag);
router.delete('/:id', ctrl.deleteTag);
router.post('/workflows/:workflowId', ctrl.associateTag);
router.delete('/workflows/:workflowId/:tagId', ctrl.dissociateTag);

module.exports = router;
