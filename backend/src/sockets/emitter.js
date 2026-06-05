const { logger } = require('../utils/logger');

// Use late binding to avoid circular dependency with sockets/index.js
function emit(event, payload, room) {
  logger.info({ event, room }, 'socket.emit');
  try {
    // Late-require to avoid circular dependency
    const { getIO } = require('./index');
    const io = getIO();
    if (room) {
      io.to(room).emit(event, payload);
    } else {
      io.emit(event, payload);
    }
  } catch (err) {
    // Socket not initialized yet (worker process) — silently skip
    if (err.message !== 'Socket.IO not initialized') {
      logger.error({ err }, 'socket emit failed');
    }
  }
}

module.exports = { emit };
