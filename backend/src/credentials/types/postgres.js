module.exports = {
  name: 'postgres',
  displayName: 'PostgreSQL',
  properties: [
    { name: 'host', displayName: 'Host', type: 'string', required: true, default: 'localhost' },
    { name: 'port', displayName: 'Port', type: 'number', required: true, default: 5432 },
    { name: 'database', displayName: 'Database', type: 'string', required: true, default: 'postgres' },
    { name: 'username', displayName: 'User', type: 'string', required: true, default: 'postgres' },
    { name: 'password', displayName: 'Password', type: 'string', required: true, typeOptions: { password: true }, default: '' },
    { name: 'ssl', displayName: 'SSL', type: 'boolean', default: false }
  ]
};
