module.exports = {
  name: 'redis',
  displayName: 'Redis',
  properties: [
    { name: 'host', displayName: 'Host', type: 'string', required: true, default: '127.0.0.1' },
    { name: 'port', displayName: 'Port', type: 'number', required: true, default: 6379 },
    { name: 'password', displayName: 'Password', type: 'string', required: false, typeOptions: { password: true }, default: '' },
    { name: 'database', displayName: 'Database Index', type: 'number', default: 0 }
  ]
};
