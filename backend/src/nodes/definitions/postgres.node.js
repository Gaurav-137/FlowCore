module.exports = {
  description: {
    displayName: 'PostgreSQL',
    name: 'postgres',
    icon: 'database',
    group: ['action'],
    category: 'Integration',
    version: 1,
    description: 'Execute PostgreSQL queries',
    defaults: { name: 'Postgres', color: '#336791' },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      { name: 'postgres', required: true }
    ],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        options: [
          { name: 'Execute Query', value: 'executeQuery' },
          { name: 'Insert', value: 'insert' },
          { name: 'Select', value: 'select' }
        ],
        default: 'executeQuery'
      },
      {
        displayName: 'Table',
        name: 'table',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['insert', 'select']
          }
        },
        default: ''
      },
      {
        displayName: 'Query',
        name: 'query',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['executeQuery']
          }
        },
        default: 'SELECT * FROM users LIMIT 10;'
      },
      {
        displayName: 'Columns',
        name: 'columns',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['select']
          }
        },
        placeholder: 'id, name, email',
        default: '*'
      },
      {
        displayName: 'Where Clause',
        name: 'where',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['select']
          }
        },
        placeholder: 'id = 1',
        default: ''
      }
    ]
  },
  async execute(context, inputItems) {
    let Client;
    try {
      Client = require('pg').Client;
    } catch {
      throw new Error("The 'pg' package is required to run PostgreSQL queries. Please run 'npm install pg' in the backend directory.");
    }

    const creds = await context.getCredential('postgres');
    if (!creds) throw new Error('Postgres credentials not found');

    const client = new Client({
      host: creds.host || 'localhost',
      port: Number(creds.port) || 5432,
      database: creds.database || 'postgres',
      user: creds.username || 'postgres',
      password: creds.password || '',
      ssl: creds.ssl ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 5000
    });

    await client.connect();
    const operation = context.getParameter('operation');
    const results = [];

    try {
      for (let i = 0; i < inputItems.length; i++) {
        const item = inputItems[i];
        let queryStr = '';

        if (operation === 'executeQuery') {
          queryStr = context.evaluateExpression(context.getParameter('query'), { currentItem: item, itemIndex: i });
        } else if (operation === 'select') {
          const table = context.evaluateExpression(context.getParameter('table'), { currentItem: item, itemIndex: i });
          const columns = context.evaluateExpression(context.getParameter('columns') || '*', { currentItem: item, itemIndex: i });
          const where = context.evaluateExpression(context.getParameter('where') || '', { currentItem: item, itemIndex: i });
          queryStr = `SELECT ${columns} FROM ${table}${where ? ` WHERE ${where}` : ''};`;
        } else if (operation === 'insert') {
          const table = context.evaluateExpression(context.getParameter('table'), { currentItem: item, itemIndex: i });
          const keys = Object.keys(item.json);
          const values = Object.values(item.json);
          if (keys.length === 0) {
            throw new Error('No fields found in item JSON to insert');
          }
          const columnsStr = keys.join(', ');
          const valuesStr = values.map((_, idx) => `$${idx + 1}`).join(', ');
          queryStr = {
            text: `INSERT INTO ${table} (${columnsStr}) VALUES (${valuesStr}) RETURNING *;`,
            values
          };
        }

        const res = await client.query(queryStr);
        if (operation === 'insert') {
          results.push({
            json: res.rows[0] || { success: true },
            pairedItem: { item: i }
          });
        } else {
          results.push({
            json: { rows: res.rows, rowCount: res.rowCount },
            pairedItem: { item: i }
          });
        }
      }
    } finally {
      await client.end();
    }

    return results;
  }
};
