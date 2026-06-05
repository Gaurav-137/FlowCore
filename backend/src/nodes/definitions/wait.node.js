module.exports = {
  description: {
    displayName: 'Wait',
    name: 'wait',
    icon: 'pauseCircle',
    group: ['action'],
    category: 'Flow',
    version: 1,
    description: 'Pauses execution until resumed by time or webhook',
    defaults: { name: 'Wait', color: '#dceeb1' },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      { displayName: 'Resume Mode', name: 'resumeMode', type: 'options', default: 'timeInterval',
        options: [
          { name: 'After Time Interval', value: 'timeInterval' },
          { name: 'At Specific Time', value: 'specificTime' },
          { name: 'On Webhook Call', value: 'webhook' }
        ]
      },
      { displayName: 'Amount', name: 'intervalValue', type: 'number', default: 1,
        displayOptions: { show: { resumeMode: ['timeInterval'] } }
      },
      { displayName: 'Unit', name: 'intervalUnit', type: 'options', default: 'minutes',
        displayOptions: { show: { resumeMode: ['timeInterval'] } },
        options: [
          { name: 'Seconds', value: 'seconds' }, { name: 'Minutes', value: 'minutes' },
          { name: 'Hours', value: 'hours' }, { name: 'Days', value: 'days' }
        ]
      },
      { displayName: 'Date & Time', name: 'dateTime', type: 'string', default: '',
        displayOptions: { show: { resumeMode: ['specificTime'] } },
        placeholder: '2024-12-31T23:59:00Z'
      }
    ]
  },
  async execute(context, items) {
    const mode = context.getParameter('resumeMode', context) || 'timeInterval';
    if (mode === 'timeInterval') {
      const value = Number(context.getParameter('intervalValue', context) || 1);
      const unit = context.getParameter('intervalUnit', context) || 'minutes';
      const multipliers = { seconds: 1000, minutes: 60000, hours: 3600000, days: 86400000 };
      return { waiting: true, delayed: true, delayMs: value * (multipliers[unit] || 60000), items };
    }
    if (mode === 'specificTime') {
      const dt = context.getParameter('dateTime', context);
      const targetMs = new Date(dt).getTime() - Date.now();
      return { waiting: true, delayed: true, delayMs: Math.max(0, targetMs), items };
    }
    // webhook mode - engine should persist and wait
    return { waiting: true, waitMode: 'webhook', items };
  }
};
