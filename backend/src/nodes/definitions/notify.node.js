const nodemailer = require('nodemailer');
const axios = require('axios');

module.exports = {
  description: {
    displayName: 'Send Notification',
    name: 'notify',
    icon: 'bell',
    group: ['action'],
    category: 'Action',
    version: 1,
    description: 'Sends email or Slack notifications',
    defaults: { name: 'Notify', color: '#c8e6cd' },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [{ name: 'smtp', required: false }],
    properties: [
      { displayName: 'Type', name: 'type', type: 'options', default: 'email',
        options: [{ name: 'Email', value: 'email' }, { name: 'Slack', value: 'slack' }]
      },
      { displayName: 'From', name: 'from', type: 'string', default: 'noreply@example.com',
        displayOptions: { show: { type: ['email'] } }
      },
      { displayName: 'To', name: 'to', type: 'string', required: true,
        displayOptions: { show: { type: ['email'] } }
      },
      { displayName: 'Subject', name: 'subject', type: 'string', default: 'Notification',
        displayOptions: { show: { type: ['email'] } }
      },
      { displayName: 'Webhook URL', name: 'webhookUrl', type: 'string', required: true,
        displayOptions: { show: { type: ['slack'] } }
      },
      { displayName: 'Message', name: 'text', type: 'string', default: '', typeOptions: { rows: 4 } }
    ]
  },

  async execute(context, items) {
    const results = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const ctx = { ...context, currentItem: item, itemIndex: i };
      const type = context.getParameter('type', ctx) || 'email';
      const text = context.evaluateExpression(context.getParameter('text', ctx) || JSON.stringify(item.json), ctx);

      if (type === 'email') {
        const smtpCred = await context.getCredential('smtp');
        const transportOpts = smtpCred
          ? { host: smtpCred.host, port: Number(smtpCred.port || 587), secure: smtpCred.secure === true, auth: { user: smtpCred.username, pass: smtpCred.password } }
          : { host: process.env.SMTP_HOST || 'localhost', port: Number(process.env.SMTP_PORT || 1025), secure: false };
        const transporter = nodemailer.createTransport(transportOpts);
        const from = context.evaluateExpression(context.getParameter('from', ctx) || 'noreply@example.com', ctx);
        const to = context.evaluateExpression(context.getParameter('to', ctx) || '', ctx);
        const subject = context.evaluateExpression(context.getParameter('subject', ctx) || 'Notification', ctx);
        const info = await transporter.sendMail({ from, to, subject, text: String(text) });
        results.push({ json: { sent: true, messageId: info.messageId, type: 'email' }, pairedItem: { item: i } });
      } else if (type === 'slack') {
        const webhookUrl = context.evaluateExpression(context.getParameter('webhookUrl', ctx) || '', ctx);
        const res = await axios.post(webhookUrl, { text: String(text) });
        results.push({ json: { sent: true, status: res.status, type: 'slack' }, pairedItem: { item: i } });
      }
    }
    return results;
  }
};
