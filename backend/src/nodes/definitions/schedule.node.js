module.exports = {
  description: {
    displayName: 'Schedule',
    name: 'schedule',
    icon: 'clock',
    group: ['trigger'],
    category: 'Triggers',
    version: 1,
    description: 'Triggers workflow on a cron schedule',
    defaults: { name: 'Schedule', color: '#c5b0f4' },
    inputs: [],
    outputs: ['main'],
    properties: [
      { displayName: 'Cron Expression', name: 'cronExpression', type: 'string', default: '0 * * * *', required: true, placeholder: '*/5 * * * *' },
      { displayName: 'Timezone', name: 'timezone', type: 'string', default: 'UTC' }
    ]
  },
  async execute(context, items) {
    if (items && items.length > 0) return items;
    return [{ json: { timestamp: new Date().toISOString(), ...(context.triggerPayload || {}) } }];
  }
};
