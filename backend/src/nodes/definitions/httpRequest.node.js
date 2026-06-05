const axios = require('axios');

module.exports = {
  description: {
    displayName: 'HTTP Request',
    name: 'httpRequest',
    icon: 'globe',
    group: ['action'],
    category: 'Core',
    version: 1,
    description: 'Makes HTTP requests to any URL',
    defaults: { name: 'HTTP Request', color: '#7B68EE' },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      { name: 'httpBasicAuth', required: false },
      { name: 'httpHeaderAuth', required: false }
    ],
    properties: [
      { displayName: 'Method', name: 'method', type: 'options', default: 'GET',
        options: [
          { name: 'GET', value: 'GET' }, { name: 'POST', value: 'POST' },
          { name: 'PUT', value: 'PUT' }, { name: 'PATCH', value: 'PATCH' },
          { name: 'DELETE', value: 'DELETE' }, { name: 'HEAD', value: 'HEAD' }
        ]
      },
      { displayName: 'URL', name: 'url', type: 'string', required: true, placeholder: 'https://api.example.com/endpoint' },
      { displayName: 'Send Headers', name: 'sendHeaders', type: 'boolean', default: false },
      { displayName: 'Headers', name: 'headers', type: 'fixedCollection', default: {},
        displayOptions: { show: { sendHeaders: [true] } },
        typeOptions: { multipleValues: true },
        options: [{ displayName: 'Header', name: 'header', values: [
          { displayName: 'Name', name: 'name', type: 'string', default: '' },
          { displayName: 'Value', name: 'value', type: 'string', default: '' }
        ]}]
      },
      { displayName: 'Send Body', name: 'sendBody', type: 'boolean', default: false },
      { displayName: 'Body', name: 'body', type: 'json', default: '{}',
        displayOptions: { show: { sendBody: [true] } }
      },
      { displayName: 'Timeout', name: 'timeout', type: 'number', default: 10000, description: 'Timeout in milliseconds' },
      { displayName: 'Response Format', name: 'responseFormat', type: 'options', default: 'json',
        options: [
          { name: 'JSON', value: 'json' }, { name: 'Text', value: 'text' }, { name: 'Binary', value: 'binary' }
        ]
      }
    ]
  },

  async execute(context, items) {
    const results = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const ctx = { ...context, currentItem: item, itemIndex: i };
      const method = (context.getParameter('method', ctx) || 'GET').toUpperCase();
      const url = context.evaluateExpression(context.getParameter('url', ctx) || '', ctx);
      const timeout = Number(context.getParameter('timeout', ctx) || 10000);
      const responseFormat = context.getParameter('responseFormat', ctx) || 'json';

      const options = { method, url, timeout };

      if (responseFormat === 'text') options.responseType = 'text';
      else if (responseFormat === 'binary') options.responseType = 'arraybuffer';

      // Headers
      if (context.getParameter('sendHeaders', ctx)) {
        const headerDefs = context.getParameter('headers', ctx);
        if (headerDefs && headerDefs.header) {
          options.headers = {};
          const hdrs = Array.isArray(headerDefs.header) ? headerDefs.header : [headerDefs.header];
          for (const h of hdrs) {
            if (h.name) {
              options.headers[context.evaluateExpression(h.name, ctx)] = context.evaluateExpression(h.value || '', ctx);
            }
          }
        }
      }

      // Body
      if (context.getParameter('sendBody', ctx)) {
        const bodyStr = context.evaluateExpression(context.getParameter('body', ctx) || '{}', ctx);
        try {
          options.data = typeof bodyStr === 'string' ? JSON.parse(bodyStr) : bodyStr;
        } catch { options.data = bodyStr; }
      }

      // Credentials
      const cred = await context.getCredential('httpBasicAuth');
      if (cred) {
        options.auth = { username: cred.username, password: cred.password };
      }
      const headerAuth = await context.getCredential('httpHeaderAuth');
      if (headerAuth) {
        options.headers = options.headers || {};
        options.headers[headerAuth.headerName || 'Authorization'] = `${headerAuth.headerPrefix || 'Bearer'} ${headerAuth.value}`;
      }

      const response = await axios(options);
      results.push({
        json: { status: response.status, headers: response.headers, data: response.data },
        pairedItem: { item: i }
      });
    }
    return results;
  }
};
