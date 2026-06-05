module.exports = {
  name: 'smtp',
  displayName: 'SMTP',
  properties: [
    { name: 'host', displayName: 'SMTP Host', type: 'string', required: true, default: '' },
    { name: 'port', displayName: 'SMTP Port', type: 'number', required: true, default: 587 },
    { name: 'username', displayName: 'Username', type: 'string', required: true, default: '' },
    { name: 'password', displayName: 'Password', type: 'string', required: true, typeOptions: { password: true }, default: '' },
    { name: 'secure', displayName: 'SSL/TLS', type: 'boolean', default: false }
  ]
};
