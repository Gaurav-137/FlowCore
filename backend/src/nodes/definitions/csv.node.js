module.exports = {
  description: {
    displayName: 'CSV',
    name: 'csv',
    icon: 'fileSpreadsheet',
    group: ['action'],
    category: 'Core',
    version: 1,
    description: 'Parse CSV to items or generate CSV from items',
    defaults: { name: 'CSV', color: '#c8e6cd' },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      { displayName: 'Operation', name: 'operation', type: 'options', default: 'parse',
        options: [{ name: 'Parse CSV', value: 'parse' }, { name: 'Generate CSV', value: 'generate' }]
      },
      { displayName: 'CSV Data', name: 'csvData', type: 'string', default: '',
        displayOptions: { show: { operation: ['parse'] } }, typeOptions: { rows: 6 }
      },
      { displayName: 'Delimiter', name: 'delimiter', type: 'string', default: ',' },
      { displayName: 'Include Headers', name: 'includeHeaders', type: 'boolean', default: true }
    ]
  },
  async execute(context, items) {
    const op = context.getParameter('operation', context) || 'parse';
    const delimiter = context.getParameter('delimiter', context) || ',';

    if (op === 'parse') {
      const csvStr = context.evaluateExpression(context.getParameter('csvData', context) || '', context);
      const csv = typeof csvStr === 'string' ? csvStr : String(csvStr);
      const lines = csv.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) return [];
      const includeHeaders = context.getParameter('includeHeaders', context);
      if (includeHeaders && lines.length > 1) {
        const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
        return lines.slice(1).map((line, i) => {
          const vals = line.split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));
          const json = {};
          headers.forEach((h, j) => { json[h] = vals[j] || ''; });
          return { json, pairedItem: { item: i } };
        });
      }
      return lines.map((line, i) => ({
        json: { values: line.split(delimiter).map(v => v.trim().replace(/^"|"$/g, '')) },
        pairedItem: { item: i }
      }));
    } else {
      // Generate CSV from items
      if (items.length === 0) return [{ json: { csv: '' } }];
      const includeHeaders = context.getParameter('includeHeaders', context);
      const headers = Object.keys(items[0].json || {});
      const lines = [];
      if (includeHeaders) lines.push(headers.join(delimiter));
      for (const item of items) {
        lines.push(headers.map(h => {
          const v = (item.json || {})[h];
          const s = v === null || v === undefined ? '' : String(v);
          return s.includes(delimiter) || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
        }).join(delimiter));
      }
      return [{ json: { csv: lines.join('\n') } }];
    }
  }
};
