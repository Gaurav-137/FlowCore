require('dotenv').config();
const app = require('./app');
const { logger } = require('./utils/logger');
const { ensureDatabaseSchema } = require('./utils/db');
const { init } = require('./sockets');
const http = require('http');
const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await ensureDatabaseSchema();
  } catch (err) {
    logger.error({ err }, 'Database initialization failed');
    process.exit(1);
  }

  const server = http.createServer(app);
  // initialize sockets
  try {
    init(server);
  } catch (e) {
    logger.error({ e }, 'Socket initialization failed');
  }

  server.listen(PORT, () => {
    logger.info({ port: PORT }, 'Server started');
  });

  // graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down');
    server.close(() => process.exit(0));
  });
  // start cron schedules loader
  try {
    const { startSchedules } = require('./triggers/cron');
    startSchedules().catch((err) => logger.error({ err }, 'Failed to start schedules'));
  } catch (err) {
    logger.error({ err }, 'Cron module failed to load');
  }
}

start().catch((err) => {
  logger.error(err, 'Failed to start server');
  process.exit(1);
});
