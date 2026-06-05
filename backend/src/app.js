const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { logger } = require('./utils/logger');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '16mb' }));

// Rate limiting — BEFORE routes
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false
  })
);

// Health check (no auth)
app.get('/health', async (req, res) => {
  const prisma = require('./prisma/client');
  const checks = { database: 'unknown', redis: 'unknown' };
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'up';
  } catch { checks.database = 'down'; }
  try {
    const { getRedis } = require('./queues/connection');
    await getRedis().ping();
    checks.redis = 'up';
  } catch { checks.redis = 'down'; }
  res.json({ ok: true, uptime: process.uptime(), checks });
});

// Auth routes
app.use('/auth', require('./routes/auth.routes'));

// Webhook routes (no auth)
app.use('/webhooks', require('./routes/webhook.routes'));

// Authenticated routes
app.use('/workflows', require('./routes/workflow.routes'));
app.use('/executions', require('./routes/execution.routes'));
app.use('/credentials', require('./routes/credential.routes'));
app.use('/variables', require('./routes/variable.routes'));
app.use('/node-types', require('./routes/nodeType.routes'));
app.use('/tags', require('./routes/tag.routes'));

// Legacy run route compatibility
app.use('/runs', require('./routes/run.routes'));

// Error handler
app.use((err, req, res, _next) => {
  logger.error({ err }, 'Unhandled error');
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

module.exports = app;
