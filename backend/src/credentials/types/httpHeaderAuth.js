module.exports = {
  name: 'httpHeaderAuth',
  displayName: 'HTTP Header Auth',
  properties: [
    { name: 'name', displayName: 'Header Name', type: 'string', required: true, default: 'Authorization' },
    { name: 'value', displayName: 'Header Value', type: 'string', required: true, typeOptions: { password: true }, default: '' }
  ]
};
