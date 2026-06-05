const { z } = require('zod');

const nodeSchema = z.object({
  id: z.string().optional(),
  type: z.string(),
  config: z.record(z.any()).optional(),
  positionX: z.number().optional(),
  positionY: z.number().optional()
});

const edgeSchema = z.object({
  id: z.string().optional(),
  sourceNodeId: z.string(),
  targetNodeId: z.string(),
  branchType: z.string().optional()
});

const createWorkflowSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  nodes: z.array(nodeSchema).optional(),
  edges: z.array(edgeSchema).optional()
});

const updateWorkflowSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  nodes: z.array(nodeSchema).optional(),
  edges: z.array(edgeSchema).optional()
});

module.exports = { createWorkflowSchema, updateWorkflowSchema };
