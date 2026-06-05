module.exports = {
  description: {
    displayName: 'Code',
    name: 'code',
    icon: 'code',
    group: ['action'],
    category: 'Core',
    version: 1,
    description: 'Run custom JavaScript code',
    defaults: { name: 'Code', color: '#c8e6cd' },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      { displayName: 'Mode', name: 'mode', type: 'options', default: 'runOnceForAllItems',
        options: [
          { name: 'Run Once for All Items', value: 'runOnceForAllItems' },
          { name: 'Run Once for Each Item', value: 'runOnceForEachItem' }
        ]
      },
      { displayName: 'JavaScript Code', name: 'jsCode', type: 'code', default: '// Access input items:\n// const items = $input.all();\n// Return array of items:\nreturn $input.all();',
        typeOptions: { language: 'javascript', rows: 15 }
      }
    ]
  },

  async execute(context, items) {
    const mode = context.getParameter('mode', context) || 'runOnceForAllItems';
    const code = context.getParameter('jsCode', context) || 'return $input.all();';

    if (mode === 'runOnceForAllItems') {
      const sandbox = {
        $input: {
          all: () => items,
          first: () => items[0],
          last: () => items[items.length - 1]
        },
        $json: items[0]?.json || {},
        $items: items,
        console: { log: () => {}, warn: () => {}, error: () => {} },
        JSON, Math, Object, Array, String, Number, Boolean, Date,
        parseInt, parseFloat, encodeURIComponent, decodeURIComponent
      };

      const keys = Object.keys(sandbox);
      const values = Object.values(sandbox);
      try {
        const fn = new Function(...keys, `"use strict";\n${code}`);
        let result = fn(...values);
        if (result && typeof result.then === 'function') result = await result;
        if (!Array.isArray(result)) result = [{ json: result || {} }];
        return result.map((r, i) => r.json ? r : { json: r, pairedItem: { item: i } });
      } catch (e) {
        throw new Error(`Code execution error: ${e.message}`);
      }
    } else {
      const results = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const sandbox = {
          $input: {
            item,
            all: () => items,
            first: () => items[0],
            last: () => items[items.length - 1]
          },
          $json: item.json || {},
          $itemIndex: i,
          console: { log: () => {}, warn: () => {}, error: () => {} },
          JSON, Math, Object, Array, String, Number, Boolean, Date,
          parseInt, parseFloat, encodeURIComponent, decodeURIComponent
        };

        const keys = Object.keys(sandbox);
        const values = Object.values(sandbox);
        try {
          const fn = new Function(...keys, `"use strict";\n${code}`);
          let result = fn(...values);
          if (result && typeof result.then === 'function') result = await result;
          if (Array.isArray(result)) {
            results.push(...result.map(r => r.json ? r : { json: r, pairedItem: { item: i } }));
          } else {
            results.push({ json: result || {}, pairedItem: { item: i } });
          }
        } catch (e) {
          throw new Error(`Code execution error at item ${i}: ${e.message}`);
        }
      }
      return results;
    }
  }
};
