const { createWorkflowSchema, updateWorkflowSchema } = require('../src/validators/workflow.validator');

describe('Workflow validator', () => {
  it('accepts a valid create workflow payload', () => {
    const payload = {
      name: 'My Workflow',
      description: 'Test workflow',
      nodes: [{ type: 'condition', config: { left: 1, right: 1, operator: 'equals' } }],
      edges: [{ sourceNodeId: 'a', targetNodeId: 'b' }]
    };
    expect(() => createWorkflowSchema.parse(payload)).not.toThrow();
  });

  it('rejects invalid workflow names', () => {
    const payload = { name: '' };
    expect(() => createWorkflowSchema.parse(payload)).toThrow();
  });

  it('accepts update schema with partial fields', () => {
    const payload = { description: 'Updated description' };
    expect(() => updateWorkflowSchema.parse(payload)).not.toThrow();
  });
});
