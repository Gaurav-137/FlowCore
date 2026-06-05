const Redis = require('ioredis');

module.exports = {
  description: {
    displayName: 'Redis',
    name: 'redis',
    icon: 'database',
    group: ['action'],
    category: 'Integration',
    version: 1,
    description: 'Execute Redis commands',
    defaults: { name: 'Redis', color: '#d82c20' },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      { name: 'redis', required: true }
    ],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        options: [
          { name: 'Get', value: 'get' },
          { name: 'Set', value: 'set' },
          { name: 'Delete', value: 'delete' },
          { name: 'Push to List', value: 'push' },
          { name: 'Pop from List', value: 'pop' },
          { name: 'Publish', value: 'publish' }
        ],
        default: 'get'
      },
      {
        displayName: 'Key',
        name: 'key',
        type: 'string',
        required: true,
        default: ''
      },
      {
        displayName: 'Value',
        name: 'value',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['set', 'push', 'publish']
          }
        },
        default: ''
      },
      {
        displayName: 'Channel',
        name: 'channel',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['publish']
          }
        },
        default: ''
      }
    ]
  },
  async execute(context, inputItems) {
    const creds = await context.getCredential('redis');
    if (!creds) throw new Error('Redis credentials not found');

    const redis = new Redis({
      host: creds.host || '127.0.0.1',
      port: Number(creds.port) || 6379,
      password: creds.password || undefined,
      db: Number(creds.database) || 0,
      retryStrategy: () => null // don't reconnect forever on error
    });

    const operation = context.getParameter('operation');
    const results = [];

    try {
      for (let i = 0; i < inputItems.length; i++) {
        const item = inputItems[i];
        const key = context.evaluateExpression(context.getParameter('key'), { currentItem: item, itemIndex: i });
        
        let val = '';
        if (['set', 'push', 'publish'].includes(operation)) {
          val = context.evaluateExpression(context.getParameter('value') || '', { currentItem: item, itemIndex: i });
        }

        let resVal;
        if (operation === 'get') {
          resVal = await redis.get(key);
        } else if (operation === 'set') {
          resVal = await redis.set(key, typeof val === 'object' ? JSON.stringify(val) : String(val));
        } else if (operation === 'delete') {
          resVal = await redis.del(key);
        } else if (operation === 'push') {
          resVal = await redis.rpush(key, typeof val === 'object' ? JSON.stringify(val) : String(val));
        } else if (operation === 'pop') {
          resVal = await redis.lpop(key);
        } else if (operation === 'publish') {
          const channel = context.evaluateExpression(context.getParameter('channel') || '', { currentItem: item, itemIndex: i });
          resVal = await redis.publish(channel, typeof val === 'object' ? JSON.stringify(val) : String(val));
        }

        results.push({
          json: {
            key,
            operation,
            result: resVal
          },
          pairedItem: { item: i }
        });
      }
    } finally {
      await redis.disconnect();
    }

    return results;
  }
};
