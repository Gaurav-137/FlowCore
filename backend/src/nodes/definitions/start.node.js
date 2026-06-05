module.exports = {
  description: {
    displayName: 'Start',
    name: 'start',
    icon: 'play',
    group: ['trigger'],
    category: 'Triggers',
    version: 1,
    description: 'Starts the workflow execution',
    defaults: { name: 'Start', color: '#c5b0f4' },
    inputs: [],
    outputs: ['main'],
    properties: []
  },
  async execute(context, items) {
    // Passthrough trigger payload or empty item
    if (items && items.length > 0) return items;
    const payload = context.triggerPayload || {};
    return [{ json: payload }];
  }
};
