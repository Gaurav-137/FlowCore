module.exports = {
  description: {
    displayName: 'Switch',
    name: 'switch',
    icon: 'arrowLeftRight',
    group: ['logic'],
    category: 'Logic',
    version: 1,
    description: 'Routes items to different outputs based on rules',
    defaults: { name: 'Switch', color: '#f3c9b6' },
    inputs: ['main'],
    outputs: ['main', 'main', 'main', 'main'],
    outputNames: ['Output 0', 'Output 1', 'Output 2', 'Output 3'],
    properties: [
      { displayName: 'Mode', name: 'mode', type: 'options', default: 'rules',
        options: [{ name: 'Rules', value: 'rules' }, { name: 'Expression', value: 'expression' }]
      },
      { displayName: 'Output Index', name: 'outputIndex', type: 'string', default: '0',
        displayOptions: { show: { mode: ['expression'] } },
        description: 'Expression that returns the output index (0-3)'
      },
      { displayName: 'Routing Rules', name: 'rules', type: 'fixedCollection', default: {},
        displayOptions: { show: { mode: ['rules'] } },
        typeOptions: { multipleValues: true },
        options: [{ displayName: 'Rule', name: 'rule', values: [
          { displayName: 'Field', name: 'field', type: 'string', default: '' },
          { displayName: 'Operator', name: 'operator', type: 'options', default: 'equals',
            options: [
              { name: 'Equals', value: 'equals' }, { name: 'Not Equals', value: 'notEquals' },
              { name: 'Contains', value: 'contains' }, { name: 'Greater Than', value: 'greaterThan' },
              { name: 'Less Than', value: 'lessThan' }, { name: 'Regex', value: 'regex' }
            ]
          },
          { displayName: 'Value', name: 'value', type: 'string', default: '' },
          { displayName: 'Output', name: 'output', type: 'number', default: 0 }
        ]}]
      },
      { displayName: 'Fallback Output', name: 'fallbackOutput', type: 'number', default: 3 }
    ]
  },

  async execute(context, items) {
    const outputs = [[], [], [], []];
    const mode = context.getParameter('mode', context) || 'rules';
    const fallback = context.getParameter('fallbackOutput', context) || 3;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const ctx = { ...context, currentItem: item, itemIndex: i };
      let outputIdx = fallback;

      if (mode === 'expression') {
        const expr = context.evaluateExpression(context.getParameter('outputIndex', ctx) || '0', ctx);
        outputIdx = Math.min(3, Math.max(0, Number(expr) || 0));
      } else {
        const rulesDef = context.getParameter('rules', ctx) || {};
        const ruleList = rulesDef.rule || [];
        const rules = Array.isArray(ruleList) ? ruleList : [ruleList];
        for (const rule of rules) {
          const field = context.evaluateExpression(rule.field || '', ctx);
          const value = context.evaluateExpression(rule.value || '', ctx);
          let match = false;
          switch (rule.operator) {
            case 'equals': match = field == value; break;
            case 'notEquals': match = field != value; break;
            case 'contains': match = String(field).includes(String(value)); break;
            case 'greaterThan': match = Number(field) > Number(value); break;
            case 'lessThan': match = Number(field) < Number(value); break;
            case 'regex': match = new RegExp(value).test(String(field)); break;
          }
          if (match) { outputIdx = Math.min(3, rule.output || 0); break; }
        }
      }

      outputs[outputIdx].push({ json: item.json, pairedItem: { item: i } });
    }
    return outputs;
  }
};
