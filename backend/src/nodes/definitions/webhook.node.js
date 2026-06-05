module.exports = {
  description: {
    displayName: 'Webhook',
    name: 'webhook',
    icon: 'webhook',
    group: ['trigger'],
    category: 'Triggers',
    version: 1,
    description: 'Receives data via webhook URL',
    defaults: { name: 'Webhook', color: '#c5b0f4' },
    inputs: [],
    outputs: ['main'],
    properties: [
      { displayName: 'Path', name: 'path', type: 'string', default: '', placeholder: '/my-webhook' },
      { displayName: 'Response Code', name: 'responseCode', type: 'number', default: 200 },
      { displayName: 'Response Mode', name: 'responseMode', type: 'options', default: 'onReceived',
        options: [
          { name: 'When Received', value: 'onReceived' },
          { name: 'When Last Node Finishes', value: 'lastNode' }
        ]
      }
    ]
  },
  async execute(context, items) {
    if (items && items.length > 0) return items;
    const payload = context.triggerPayload || {};
    return [{ json: payload }];
  }
};
