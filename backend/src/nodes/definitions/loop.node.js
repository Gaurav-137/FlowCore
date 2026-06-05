module.exports = {
  description: {
    displayName: 'Loop Over Items',
    name: 'loop',
    icon: 'repeat',
    group: ['logic'],
    category: 'Flow',
    version: 1,
    description: 'Loops over incoming items one by one',
    defaults: { name: 'Loop', color: '#ff6666' },
    inputs: ['main'],
    outputs: ['main', 'main'], // Output 1: Loop body, Output 2: Done
    properties: []
  },
  async execute(context, inputItems) {
    // If there are no items to process, immediately send empty to loop body and input items to Done
    if (!inputItems || inputItems.length === 0) {
      return [[], []];
    }

    // To implement loop behavior in a single run:
    // Typically the orchestrator iterates, but to match the description:
    // "sends items one at a time to first output, all items to second output when done"
    // Let's implement batching or single-item pass.
    // If context.batchIndex is tracked, we can return the current item.
    // Let's check if the orchestrator supports passing a batch index.
    const index = context.batchIndex || 0;
    if (index < inputItems.length) {
      const currentItem = inputItems[index];
      // Increment batchIndex for next run if tracked
      context.batchIndex = index + 1;
      return [[currentItem], []];
    } else {
      // Done - send all items to the second output
      return [[], inputItems];
    }
  }
};
