module.exports = {
  description: {
    displayName: 'IF',
    name: 'if',
    icon: 'gitFork',
    group: ['logic'],
    category: 'Logic',
    version: 1,
    description: 'Routes items based on a condition',
    defaults: { name: 'IF', color: '#f3c9b6' },
    inputs: ['main'],
    outputs: ['main', 'main'],
    outputNames: ['true', 'false'],
    properties: [
      { displayName: 'Value 1', name: 'leftValue', type: 'string', default: '', placeholder: '{{ $json.field }}' },
      { displayName: 'Operator', name: 'operator', type: 'options', default: 'equals',
        options: [
          { name: 'Equals', value: 'equals' },
          { name: 'Not Equals', value: 'notEquals' },
          { name: 'Contains', value: 'contains' },
          { name: 'Not Contains', value: 'notContains' },
          { name: 'Greater Than', value: 'greaterThan' },
          { name: 'Less Than', value: 'lessThan' },
          { name: 'Greater or Equal', value: 'greaterThanOrEqual' },
          { name: 'Less or Equal', value: 'lessThanOrEqual' },
          { name: 'Is Empty', value: 'isEmpty' },
          { name: 'Is Not Empty', value: 'isNotEmpty' },
          { name: 'Regex Match', value: 'regex' }
        ]
      },
      { displayName: 'Value 2', name: 'rightValue', type: 'string', default: '',
        displayOptions: { hide: { operator: ['isEmpty', 'isNotEmpty'] } }
      }
    ]
  },

  async execute(context, items) {
    const trueItems = [];
    const falseItems = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const ctx = { ...context, currentItem: item, itemIndex: i };
      let left = context.evaluateExpression(context.getParameter('leftValue', ctx) || '', ctx);
      const op = context.getParameter('operator', ctx) || 'equals';
      let right = context.evaluateExpression(context.getParameter('rightValue', ctx) || '', ctx);

      let result = false;
      switch (op) {
        case 'equals': result = left == right; break;
        case 'notEquals': result = left != right; break;
        case 'contains': result = String(left).includes(String(right)); break;
        case 'notContains': result = !String(left).includes(String(right)); break;
        case 'greaterThan': result = Number(left) > Number(right); break;
        case 'lessThan': result = Number(left) < Number(right); break;
        case 'greaterThanOrEqual': result = Number(left) >= Number(right); break;
        case 'lessThanOrEqual': result = Number(left) <= Number(right); break;
        case 'isEmpty': result = !left || (typeof left === 'string' && left.trim() === ''); break;
        case 'isNotEmpty': result = !!left && !(typeof left === 'string' && left.trim() === ''); break;
        case 'regex': result = new RegExp(right).test(String(left)); break;
      }

      const outputItem = { json: item.json, pairedItem: { item: i } };
      if (result) trueItems.push(outputItem);
      else falseItems.push(outputItem);
    }

    return [trueItems, falseItems];
  }
};
