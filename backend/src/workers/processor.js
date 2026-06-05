const { Worker } = require('bullmq');
const { executeWorkflow } = require('../orchestrator');
const { logger } = require('../utils/logger');
const { getRedis } = require('../queues/connection');

const { getDeadLetterQueue } = require('../queues/bull');

const worker = new Worker(
  'workflow-execution',
  async (job) => {
    logger.info({ jobId: job.id, name: job.name }, 'worker processing');
    if (job.name === 'execute-workflow') {
      return executeWorkflow(job.data);
    }
    return null;
  },
  { connection: getRedis(), concurrency: 5 }
);

worker.on('completed', (job) => logger.info({ jobId: job.id }, 'job completed'));
worker.on('failed', async (job, err) => {
  logger.error({ jobId: job.id, err }, 'job failed');
  try {
    const attemptsMade = job.attemptsMade || 0;
    const maxAttempts = (job.opts && job.opts.attempts) || 0;
    if (maxAttempts && attemptsMade >= maxAttempts) {
      // move to dead-letter queue
      await getDeadLetterQueue().add('dead', { jobName: job.name, jobData: job.data, failedReason: err.message }, { removeOnComplete: false });
      logger.info({ jobId: job.id }, 'moved job to dead-letter queue');
    }
  } catch (e) {
    logger.error({ err: e }, 'failed to move job to dead-letter queue');
  }
});

module.exports = worker;
