module.exports = {
  name: 'apiKey',
  displayName: 'API Key',
  properties: [
    { name: 'apiKey', displayName: 'API Key', type: 'string', required: true, typeOptions: { password: true }, default: '' },
    { name: 'headerName', displayName: 'Header Name', type: 'string', required: true, default: 'X-API-KEY' },
    { name: 'headerPrefix', displayName: 'Header Prefix', type: 'string', default: '' }
  ]
};
