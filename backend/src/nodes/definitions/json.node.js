module.exports = {
  description: {
    displayName: 'JSON',
    name: 'json',
    icon: 'braces',
    group: ['action'],
    category: 'Core',
    version: 1,
    description: 'Parse or stringify JSON data',
    defaults: { name: 'JSON', color: '#c8e6cd' },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      { displayName: 'Operation', name: 'operation', type: 'options', default: 'parse',
        options: [{ name: 'Parse', value: 'parse' }, { name: 'Stringify', value: 'stringify' }]
      },
      { displayName: 'Source Field', name: 'fieldName', type: 'string', default: 'data', description: 'Field containing JSON string (parse) or object (stringify)' },
      { displayName: 'Destination Field', name: 'destinationField', type: 'string', default: 'parsed' }
    ]
  },
  async execute(context, items) {
    const op = context.getParameter('operation', context) || 'parse';
    const field = context.getParameter('fieldName', context) || 'data';
    const dest = context.getParameter('destinationField', context) || 'parsed';
    return items.map((item, i) => {
      const json = { ...item.json };
      if (op === 'parse') {
        try { json[dest] = JSON.parse(json[field]); } catch { json[dest] = null; }
      } else {
        try { json[dest] = JSON.stringify(json[field]); } catch { json[dest] = ''; }
      }
      return { json, pairedItem: { item: i } };
    });
  }
};
