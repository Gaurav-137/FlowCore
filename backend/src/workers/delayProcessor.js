const { Worker } = require('bullmq');
const { getRedis } = require('../queues/connection');
const { getWorkflowExecutionQueue } = require('../queues/bull');
const { logger } = require('../utils/logger');

const worker = new Worker(
  'delay-queue',
  async (job) => {
    if (job.name === 'delay-finish') {
      const { workflowRunId, workflowId, nextNodeId, input } = job.data;
      logger.info({ workflowRunId, nextNodeId }, 'delay finished, re-enqueueing workflow execution');
      // enqueue workflow execution starting at nextNodeId with provided input
      await getWorkflowExecutionQueue().add('execute-workflow', { workflowRunId, workflowId, startNodeId: nextNodeId, input }, { attempts: 3 });
    }
  },
  { connection: getRedis() }
);

worker.on('completed', (job) => logger.info({ jobId: job.id }, 'delay job completed'));
worker.on('failed', (job, err) => logger.error({ jobId: job.id, err }, 'delay job failed'));

module.exports = worker;
