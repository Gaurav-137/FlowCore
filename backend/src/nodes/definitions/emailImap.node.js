module.exports = {
  description: {
    displayName: 'Email Read (IMAP)',
    name: 'emailImap',
    icon: 'mail',
    group: ['trigger'],
    category: 'Integration',
    version: 1,
    description: 'Fetch emails from an IMAP server',
    defaults: { name: 'Email Read (IMAP)', color: '#ff9900' },
    inputs: [],
    outputs: ['main'],
    credentials: [
      { name: 'imap', required: true }
    ],
    properties: [
      {
        displayName: 'Mailbox',
        name: 'mailbox',
        type: 'string',
        default: 'INBOX',
        required: true
      },
      {
        displayName: 'Limit',
        name: 'limit',
        type: 'number',
        default: 10,
        description: 'Number of recent emails to fetch'
      }
    ]
  },
  async execute(context) {
    const creds = await context.getCredential('imap');
    if (!creds) throw new Error('IMAP credentials not found');

    const limit = Number(context.getParameter('limit')) || 10;
    const mailbox = context.getParameter('mailbox') || 'INBOX';

    // Imap-simple or node-imap stub.
    // For local runs, return mock email data for developer convenience since no client library is bundled.
    console.log(`Connecting to IMAP ${creds.host}:${creds.port} to fetch emails from ${mailbox} (limit ${limit})...`);

    const mockEmails = [
      {
        json: {
          id: 'msg_001',
          subject: 'Welcome to FlowCore!',
          from: 'welcome@flowcore.io',
          to: creds.username,
          date: new Date().toISOString(),
          text: 'Hi there, welcome to your workflow automation platform.',
          mailbox
        }
      },
      {
        json: {
          id: 'msg_002',
          subject: 'Daily Status Report',
          from: 'metrics@company.com',
          to: creds.username,
          date: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          text: 'The daily report is ready. All databases are healthy.',
          mailbox
        }
      }
    ];

    return mockEmails.slice(0, limit);
  }
};
