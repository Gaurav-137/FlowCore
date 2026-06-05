module.exports = {
  description: {
    displayName: 'Set',
    name: 'set',
    icon: 'pen',
    group: ['action'],
    category: 'Core',
    version: 1,
    description: 'Sets or modifies data fields on items',
    defaults: { name: 'Set', color: '#c8e6cd' },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      { displayName: 'Mode', name: 'mode', type: 'options', default: 'manual',
        options: [
          { name: 'Manual Mapping', value: 'manual' },
          { name: 'JSON', value: 'raw' }
        ]
      },
      { displayName: 'Fields', name: 'fields', type: 'fixedCollection', default: {},
        displayOptions: { show: { mode: ['manual'] } },
        typeOptions: { multipleValues: true },
        options: [{ displayName: 'Field', name: 'field', values: [
          { displayName: 'Name', name: 'name', type: 'string', default: '' },
          { displayName: 'Value', name: 'value', type: 'string', default: '' }
        ]}]
      },
      { displayName: 'JSON Output', name: 'jsonOutput', type: 'json', default: '{}',
        displayOptions: { show: { mode: ['raw'] } }
      },
      { displayName: 'Keep Only Set Fields', name: 'keepOnlySet', type: 'boolean', default: false }
    ]
  },

  async execute(context, items) {
    const results = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const ctx = { ...context, currentItem: item, itemIndex: i };
      const mode = context.getParameter('mode', ctx) || 'manual';
      const keepOnlySet = context.getParameter('keepOnlySet', ctx) || false;

      let newJson = keepOnlySet ? {} : { ...item.json };

      if (mode === 'manual') {
        const fieldsDef = context.getParameter('fields', ctx) || {};
        const fieldList = fieldsDef.field || [];
        const fields = Array.isArray(fieldList) ? fieldList : [fieldList];
        for (const f of fields) {
          if (f.name) {
            newJson[f.name] = context.evaluateExpression(f.value || '', ctx);
          }
        }
      } else {
        const jsonStr = context.evaluateExpression(context.getParameter('jsonOutput', ctx) || '{}', ctx);
        try {
          const parsed = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
          newJson = keepOnlySet ? parsed : { ...newJson, ...parsed };
        } catch { /* keep existing */ }
      }

      results.push({ json: newJson, pairedItem: { item: i } });
    }
    return results;
  }
};
