const cron = require('node-cron');
const prisma = require('../prisma/client');
const triggerService = require('../services/trigger.service');
const { logger } = require('../utils/logger');

const tasks = new Map();

async function registerSchedule(s) {
  deregisterSchedule(s.id);
  if (!s.enabled) return;

  try {
    const task = cron.schedule(s.cronExpression, async () => {
      logger.info({ scheduleId: s.id, workflowId: s.workflowId }, 'Cron trigger fired');
      try {
        await triggerService.triggerWorkflowBySchedule(s.workflowId, s.id);
      } catch (err) {
        logger.error({ err, scheduleId: s.id }, 'Failed to trigger scheduled workflow');
      }
    });
    tasks.set(s.id, task);
    logger.info({ scheduleId: s.id, expression: s.cronExpression }, 'Registered schedule');
  } catch (err) {
    logger.error({ err, scheduleId: s.id }, 'Invalid cron expression');
  }
}

function deregisterSchedule(scheduleId) {
  if (tasks.has(scheduleId)) {
    tasks.get(scheduleId).stop();
    tasks.delete(scheduleId);
    logger.info({ scheduleId }, 'Deregistered schedule');
  }
}

async function reloadSchedules() {
  const schedules = await prisma.workflowSchedule.findMany({
    where: {
      enabled: true,
      workflow: { status: 'ACTIVE' }
    }
  });

  const activeIds = new Set(schedules.map(s => s.id));

  // Deregister tasks that are no longer active
  for (const scheduleId of tasks.keys()) {
    if (!activeIds.has(scheduleId)) {
      deregisterSchedule(scheduleId);
    }
  }

  // Register or update schedules
  for (const s of schedules) {
    await registerSchedule(s);
  }
}

async function startSchedules() {
  await reloadSchedules();
}

module.exports = { startSchedules, registerSchedule, deregisterSchedule, reloadSchedules };
