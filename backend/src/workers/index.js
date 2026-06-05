require('dotenv').config();
const { logger } = require('../utils/logger');
const { ensureDatabaseSchema } = require('../utils/db');

async function start() {
  try {
    await ensureDatabaseSchema();
  } catch (err) {
    logger.error({ err }, 'Database initialization failed for worker');
    process.exit(1);
  }

  logger.info('Starting worker processes');
  require('./processor');
  require('./delayProcessor');
  require('./notificationProcessor');
}

start().catch((err) => {
  logger.error({ err }, 'Worker startup failed');
  process.exit(1);
});
