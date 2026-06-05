const prisma = require('../prisma/client');

async function listTags(req, res, next) {
  try {
    const tags = await prisma.workflowTag.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(tags);
  } catch (err) { next(err); }
}

async function createTag(req, res, next) {
  try {
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ error: 'Tag name is required' });
    const tag = await prisma.workflowTag.upsert({
      where: { name },
      update: { color: color || undefined },
      create: { name, color: color || '#6366f1' }
    });
    res.status(201).json(tag);
  } catch (err) { next(err); }
}

async function deleteTag(req, res, next) {
  try {
    await prisma.workflowTag.delete({
      where: { id: req.params.id }
    });
    res.status(204).end();
  } catch (err) { next(err); }
}

async function associateTag(req, res, next) {
  try {
    const { tagId } = req.body;
    const { workflowId } = req.params;
    
    // Verify workflow belongs to user
    const wf = await prisma.workflow.findFirst({
      where: { id: workflowId, userId: req.user.id }
    });
    if (!wf) return res.status(404).json({ error: 'Workflow not found' });

    const binding = await prisma.workflowTagBinding.upsert({
      where: { workflowId_tagId: { workflowId, tagId } },
      update: {},
      create: { workflowId, tagId }
    });
    res.status(201).json(binding);
  } catch (err) { next(err); }
}

async function dissociateTag(req, res, next) {
  try {
    const { workflowId, tagId } = req.params;
    
    // Verify workflow belongs to user
    const wf = await prisma.workflow.findFirst({
      where: { id: workflowId, userId: req.user.id }
    });
    if (!wf) return res.status(404).json({ error: 'Workflow not found' });

    await prisma.workflowTagBinding.delete({
      where: { workflowId_tagId: { workflowId, tagId } }
    });
    res.status(204).end();
  } catch (err) { next(err); }
}

module.exports = { listTags, createTag, deleteTag, associateTag, dissociateTag };
