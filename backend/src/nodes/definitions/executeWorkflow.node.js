module.exports = {
  description: {
    displayName: 'Execute Workflow',
    name: 'executeWorkflow',
    icon: 'workflow',
    group: ['action'],
    category: 'Flow',
    version: 1,
    description: 'Executes another workflow as a sub-workflow',
    defaults: { name: 'Execute Workflow', color: '#dceeb1' },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      { displayName: 'Workflow ID', name: 'workflowId', type: 'string', required: true, placeholder: 'Target workflow ID' },
      { displayName: 'Mode', name: 'mode', type: 'options', default: 'sync',
        options: [{ name: 'Wait for Completion', value: 'sync' }, { name: 'Fire and Forget', value: 'async' }]
      }
    ]
  },
  async execute(context, items) {
    const workflowId = context.evaluateExpression(context.getParameter('workflowId', context) || '', context);
    const mode = context.getParameter('mode', context) || 'sync';
    if (context.executeSubWorkflow) {
      const result = await context.executeSubWorkflow(workflowId, items, mode);
      return Array.isArray(result) ? result : [{ json: result || {} }];
    }
    return items.map((item, i) => ({
      json: { ...item.json, _subWorkflow: { workflowId, mode, status: 'stub' } },
      pairedItem: { item: i }
    }));
  }
};
