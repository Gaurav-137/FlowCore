const { Queue } = require('bullmq');
const { getRedis } = require('./connection');

const connection = () => ({ connection: getRedis() });
const queueCache = new Map();

function getQueue(name) {
  if (!queueCache.has(name)) {
    queueCache.set(name, new Queue(name, connection()));
  }
  return queueCache.get(name);
}

function getWorkflowExecutionQueue() {
  return getQueue('workflow-execution');
}

function getDelayQueue() {
  return getQueue('delay-queue');
}

function getNotificationQueue() {
  return getQueue('notification-queue');
}

function getRetryQueue() {
  return getQueue('retry-queue');
}

function getDeadLetterQueue() {
  return getQueue('dead-letter-queue');
}

module.exports = {
  getWorkflowExecutionQueue,
  getDelayQueue,
  getNotificationQueue,
  getRetryQueue,
  getDeadLetterQueue
};
