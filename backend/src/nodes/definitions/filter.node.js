module.exports = {
  description: {
    displayName: 'Filter',
    name: 'filter',
    icon: 'filter',
    group: ['action'],
    category: 'Core',
    version: 1,
    description: 'Filters items based on conditions',
    defaults: { name: 'Filter', color: '#c8e6cd' },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      { displayName: 'Field', name: 'field', type: 'string', required: true, placeholder: '{{ $json.status }}' },
      { displayName: 'Operator', name: 'operator', type: 'options', default: 'equals',
        options: [
          { name: 'Equals', value: 'equals' },
          { name: 'Not Equals', value: 'notEquals' },
          { name: 'Contains', value: 'contains' },
          { name: 'Greater Than', value: 'greaterThan' },
          { name: 'Less Than', value: 'lessThan' },
          { name: 'Is Empty', value: 'isEmpty' },
          { name: 'Is Not Empty', value: 'isNotEmpty' },
          { name: 'Regex', value: 'regex' }
        ]
      },
      { displayName: 'Value', name: 'value', type: 'string', default: '',
        displayOptions: { hide: { operator: ['isEmpty', 'isNotEmpty'] } }
      }
    ]
  },

  async execute(context, items) {
    const results = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const ctx = { ...context, currentItem: item, itemIndex: i };
      const field = context.evaluateExpression(context.getParameter('field', ctx) || '', ctx);
      const op = context.getParameter('operator', ctx) || 'equals';
      const value = context.evaluateExpression(context.getParameter('value', ctx) || '', ctx);

      let match = false;
      switch (op) {
        case 'equals': match = field == value; break;
        case 'notEquals': match = field != value; break;
        case 'contains': match = String(field).includes(String(value)); break;
        case 'greaterThan': match = Number(field) > Number(value); break;
        case 'lessThan': match = Number(field) < Number(value); break;
        case 'isEmpty': match = !field || (typeof field === 'string' && !field.trim()); break;
        case 'isNotEmpty': match = !!field && !(typeof field === 'string' && !field.trim()); break;
        case 'regex': match = new RegExp(value).test(String(field)); break;
      }
      if (match) results.push({ json: item.json, pairedItem: { item: i } });
    }
    return results;
  }
};
