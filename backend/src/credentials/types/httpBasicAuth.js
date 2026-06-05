module.exports = {
  name: 'httpBasicAuth',
  displayName: 'HTTP Basic Auth',
  properties: [
    { name: 'username', displayName: 'Username', type: 'string', required: true, default: '' },
    { name: 'password', displayName: 'Password', type: 'string', required: true, typeOptions: { password: true }, default: '' }
  ]
};
