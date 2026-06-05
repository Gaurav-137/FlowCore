module.exports = {
  name: 'imap',
  displayName: 'IMAP',
  properties: [
    { name: 'host', displayName: 'Host', type: 'string', required: true, default: '' },
    { name: 'port', displayName: 'Port', type: 'number', required: true, default: 993 },
    { name: 'username', displayName: 'Username', type: 'string', required: true, default: '' },
    { name: 'password', displayName: 'Password', type: 'string', required: true, typeOptions: { password: true }, default: '' },
    { name: 'secure', displayName: 'SSL/TLS', type: 'boolean', default: true }
  ]
};
