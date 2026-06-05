module.exports = {
  description: {
    displayName: 'Date & Time',
    name: 'dateTime',
    icon: 'calendar',
    group: ['action'],
    category: 'Core',
    version: 1,
    description: 'Manipulate date and time values',
    defaults: { name: 'Date & Time', color: '#c8e6cd' },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      { displayName: 'Operation', name: 'operation', type: 'options', default: 'format',
        options: [
          { name: 'Format Date', value: 'format' },
          { name: 'Add Time', value: 'add' },
          { name: 'Subtract Time', value: 'subtract' },
          { name: 'Get Current', value: 'now' },
          { name: 'Difference', value: 'diff' }
        ]
      },
      { displayName: 'Date', name: 'date', type: 'string', default: '{{ $now }}',
        displayOptions: { hide: { operation: ['now'] } }
      },
      { displayName: 'Amount', name: 'amount', type: 'number', default: 1,
        displayOptions: { show: { operation: ['add', 'subtract'] } }
      },
      { displayName: 'Unit', name: 'unit', type: 'options', default: 'days',
        displayOptions: { show: { operation: ['add', 'subtract'] } },
        options: [
          { name: 'Seconds', value: 'seconds' }, { name: 'Minutes', value: 'minutes' },
          { name: 'Hours', value: 'hours' }, { name: 'Days', value: 'days' },
          { name: 'Months', value: 'months' }, { name: 'Years', value: 'years' }
        ]
      },
      { displayName: 'End Date', name: 'endDate', type: 'string', default: '',
        displayOptions: { show: { operation: ['diff'] } }
      },
      { displayName: 'Output Field', name: 'outputField', type: 'string', default: 'date' }
    ]
  },
  async execute(context, items) {
    const op = context.getParameter('operation', context) || 'format';
    const outputField = context.getParameter('outputField', context) || 'date';
    const unitMs = { seconds: 1000, minutes: 60000, hours: 3600000, days: 86400000, months: 2592000000, years: 31536000000 };

    return items.map((item, i) => {
      const ctx = { ...context, currentItem: item, itemIndex: i };
      const json = { ...item.json };
      let result;

      if (op === 'now') {
        result = new Date().toISOString();
      } else if (op === 'format') {
        const dateStr = context.evaluateExpression(context.getParameter('date', ctx) || '', ctx);
        result = new Date(dateStr).toISOString();
      } else if (op === 'add' || op === 'subtract') {
        const dateStr = context.evaluateExpression(context.getParameter('date', ctx) || '', ctx);
        const amount = Number(context.getParameter('amount', ctx) || 1);
        const unit = context.getParameter('unit', ctx) || 'days';
        const ms = amount * (unitMs[unit] || 86400000);
        const d = new Date(dateStr);
        result = new Date(d.getTime() + (op === 'add' ? ms : -ms)).toISOString();
      } else if (op === 'diff') {
        const d1 = new Date(context.evaluateExpression(context.getParameter('date', ctx) || '', ctx));
        const d2 = new Date(context.evaluateExpression(context.getParameter('endDate', ctx) || '', ctx));
        result = { milliseconds: d2 - d1, seconds: (d2 - d1) / 1000, minutes: (d2 - d1) / 60000, hours: (d2 - d1) / 3600000, days: (d2 - d1) / 86400000 };
      }

      json[outputField] = result;
      return { json, pairedItem: { item: i } };
    });
  }
};
