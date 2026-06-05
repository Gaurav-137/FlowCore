module.exports = {
  description: {
    displayName: 'Merge',
    name: 'merge',
    icon: 'merge',
    group: ['logic'],
    category: 'Logic',
    version: 1,
    description: 'Merges items from two input branches',
    defaults: { name: 'Merge', color: '#f3c9b6' },
    inputs: ['main', 'main'],
    inputNames: ['Input 1', 'Input 2'],
    outputs: ['main'],
    properties: [
      { displayName: 'Mode', name: 'mode', type: 'options', default: 'append',
        options: [
          { name: 'Append', value: 'append' },
          { name: 'Combine by Position', value: 'mergeByPosition' },
          { name: 'Combine by Key', value: 'mergeByKey' },
          { name: 'Keep Input 1', value: 'keepInput1' },
          { name: 'Keep Input 2', value: 'keepInput2' }
        ]
      },
      { displayName: 'Join Field', name: 'joinField', type: 'string', default: 'id',
        displayOptions: { show: { mode: ['mergeByKey'] } }
      }
    ]
  },

  async execute(context, items, inputData) {
    const mode = context.getParameter('mode', context) || 'append';
    const input1 = (inputData && inputData[0]) || items || [];
    const input2 = (inputData && inputData[1]) || [];

    switch (mode) {
      case 'append':
        return [...input1, ...input2].map((item, i) => ({ json: item.json || item, pairedItem: { item: i } }));

      case 'mergeByPosition': {
        const maxLen = Math.max(input1.length, input2.length);
        const results = [];
        for (let i = 0; i < maxLen; i++) {
          const json1 = (input1[i] && input1[i].json) || {};
          const json2 = (input2[i] && input2[i].json) || {};
          results.push({ json: { ...json1, ...json2 }, pairedItem: { item: i } });
        }
        return results;
      }

      case 'mergeByKey': {
        const joinField = context.getParameter('joinField', context) || 'id';
        const map2 = new Map();
        for (const item of input2) {
          const key = (item.json || item)[joinField];
          if (key !== undefined) map2.set(String(key), item.json || item);
        }
        return input1.map((item, i) => {
          const json1 = item.json || item;
          const key = json1[joinField];
          const json2 = key !== undefined ? map2.get(String(key)) || {} : {};
          return { json: { ...json1, ...json2 }, pairedItem: { item: i } };
        });
      }

      case 'keepInput1':
        return input1.map((item, i) => ({ json: item.json || item, pairedItem: { item: i } }));

      case 'keepInput2':
        return input2.map((item, i) => ({ json: item.json || item, pairedItem: { item: i } }));

      default:
        return [...input1, ...input2];
    }
  }
};
