const BaseNode = require('./base.node');
const nodemailer = require('nodemailer');
const axios = require('axios');
const { logger } = require('../utils/logger');

class NotifyNode extends BaseNode {
  async execute(ctx) {
    const cfg = this.config || {};
    const type = cfg.type || 'email';
    if (type === 'email') {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'localhost',
        port: Number(process.env.SMTP_PORT || 1025),
        secure: false
      });
      const info = await transporter.sendMail({ from: cfg.from || 'noreply@example.com', to: cfg.to, subject: cfg.subject || 'Notification', text: cfg.text || JSON.stringify(ctx.input || {}) });
      return { sent: true, info };
    }
    if (type === 'slack') {
      try {
        const res = await axios.post(cfg.webhookUrl, { text: cfg.text || JSON.stringify(ctx.input || {}) });
        return { sent: true, status: res.status };
      } catch (err) {
        logger.error({ err }, 'Slack notify failed');
        throw err;
      }
    }
    return { ok: false };
  }
}

module.exports = NotifyNode;
