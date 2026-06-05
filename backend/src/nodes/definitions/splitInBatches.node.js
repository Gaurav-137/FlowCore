module.exports = {
  description: {
    displayName: 'Split In Batches',
    name: 'splitInBatches',
    icon: 'layers',
    group: ['action'],
    category: 'Flow',
    version: 1,
    description: 'Processes items in configurable batch sizes',
    defaults: { name: 'Split In Batches', color: '#dceeb1' },
    inputs: ['main'],
    outputs: ['main', 'main'],
    outputNames: ['Batch', 'Done'],
    properties: [
      { displayName: 'Batch Size', name: 'batchSize', type: 'number', default: 10, description: 'Number of items per batch' }
    ]
  },
  async execute(context, items) {
    const batchSize = Number(context.getParameter('batchSize', context) || 10);
    const batchIndex = context.batchIndex || 0;
    const start = batchIndex * batchSize;
    const batch = items.slice(start, start + batchSize);
    const hasMore = start + batchSize < items.length;
    if (hasMore) {
      return [batch.map((item, i) => ({ json: item.json, pairedItem: { item: start + i } })), []];
    }
    return [batch.map((item, i) => ({ json: item.json, pairedItem: { item: start + i } })),
            items.map((item, i) => ({ json: item.json, pairedItem: { item: i } }))];
  }
};
