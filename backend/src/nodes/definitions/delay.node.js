module.exports = {
  description: {
    displayName: 'Delay',
    name: 'delay',
    icon: 'hourglass',
    group: ['action'],
    category: 'Flow',
    version: 1,
    description: 'Pauses execution for a specified duration',
    defaults: { name: 'Delay', color: '#dceeb1' },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      { displayName: 'Unit', name: 'unit', type: 'options', default: 'seconds',
        options: [
          { name: 'Milliseconds', value: 'milliseconds' },
          { name: 'Seconds', value: 'seconds' },
          { name: 'Minutes', value: 'minutes' },
          { name: 'Hours', value: 'hours' }
        ]
      },
      { displayName: 'Value', name: 'value', type: 'number', default: 1 }
    ]
  },

  async execute(context, items) {
    const unit = context.getParameter('unit', context) || 'seconds';
    const value = Number(context.getParameter('value', context) || 1);
    const multipliers = { milliseconds: 1, seconds: 1000, minutes: 60000, hours: 3600000 };
    const delayMs = value * (multipliers[unit] || 1000);
    return { delayed: true, delayMs, items };
  }
};
