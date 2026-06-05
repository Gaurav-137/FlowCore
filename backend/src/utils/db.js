const { execSync } = require('child_process');
const { logger } = require('./logger');

async function ensureDatabaseSchema() {
  const maxAttempts = 10;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      logger.info({ attempt }, 'Ensuring Prisma schema is pushed to database');
      execSync('npx prisma db push --schema=src/prisma/schema.prisma', {
        stdio: 'inherit',
      });
      logger.info('Database schema push completed');
      return;
    } catch (err) {
      logger.error({ err, attempt }, 'Prisma db push failed');
      if (attempt === maxAttempts) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

module.exports = { ensureDatabaseSchema };
