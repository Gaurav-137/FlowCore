module.exports = {
  description: {
    displayName: 'Respond to Webhook',
    name: 'respondToWebhook',
    icon: 'reply',
    group: ['action'],
    category: 'Flow',
    version: 1,
    description: 'Send a response back to the webhook caller',
    defaults: { name: 'Respond to Webhook', color: '#dceeb1' },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      { displayName: 'Response Code', name: 'responseCode', type: 'number', default: 200 },
      { displayName: 'Response Body', name: 'responseBody', type: 'json', default: '{}' },
      { displayName: 'Send Headers', name: 'sendHeaders', type: 'boolean', default: false },
      { displayName: 'Response Headers', name: 'responseHeaders', type: 'fixedCollection', default: {},
        displayOptions: { show: { sendHeaders: [true] } },
        typeOptions: { multipleValues: true },
        options: [{ displayName: 'Header', name: 'header', values: [
          { displayName: 'Name', name: 'name', type: 'string', default: '' },
          { displayName: 'Value', name: 'value', type: 'string', default: '' }
        ]}]
      }
    ]
  },
  async execute(context, items) {
    const code = context.getParameter('responseCode', context) || 200;
    const bodyStr = context.evaluateExpression(context.getParameter('responseBody', context) || '{}', context);
    let body;
    try { body = typeof bodyStr === 'string' ? JSON.parse(bodyStr) : bodyStr; } catch { body = bodyStr; }
    if (context.setWebhookResponse) {
      context.setWebhookResponse({ statusCode: code, body });
    }
    return items.map((item, i) => ({ json: { ...item.json, _webhookResponse: { statusCode: code, body } }, pairedItem: { item: i } }));
  }
};
