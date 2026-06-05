const { Worker } = require('bullmq');
const { getRedis } = require('../queues/connection');
const { getDeadLetterQueue } = require('../queues/bull');
const nodemailer = require('nodemailer');
const axios = require('axios');
const { logger } = require('../utils/logger');

const worker = new Worker(
  'notification-queue',
  async (job) => {
    const { type, payload } = job.data || {};
    if (type === 'email') {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'localhost',
        port: Number(process.env.SMTP_PORT || 1025),
        secure: false
      });
      return transporter.sendMail({ from: payload.from, to: payload.to, subject: payload.subject, text: payload.text });
    }
    if (type === 'slack') {
      return axios.post(payload.webhookUrl, { text: payload.text });
    }
    return null;
  },
  { connection: getRedis() }
);

worker.on('completed', (job) => logger.info({ jobId: job.id }, 'notification completed'));
worker.on('failed', async (job, err) => {
  logger.error({ jobId: job.id, err }, 'notification failed');
  try {
    const attemptsMade = job.attemptsMade || 0;
    const maxAttempts = (job.opts && job.opts.attempts) || 0;
      if (maxAttempts && attemptsMade >= maxAttempts) {
      await getDeadLetterQueue().add('dead', { jobName: job.name, jobData: job.data, failedReason: err.message }, { removeOnComplete: false });
    }
  } catch (e) {
    logger.error({ e }, 'failed to move notification to dead-letter');
  }
});

module.exports = worker;
