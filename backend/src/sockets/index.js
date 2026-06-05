const { Server } = require('socket.io');
const { verifyToken } = require('../utils/jwt');
const prisma = require('../prisma/client');
let io = null;

function init(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST']
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      if (!token) return next(); // allow anonymous but won't have user attached
      const payload = verifyToken(token);
      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) return next(new Error('Unauthorized'));
      socket.user = { id: user.id, email: user.email, role: user.role };
      return next();
    } catch (err) {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('join', (data) => {
      if (data && data.room) {
        // Only allow joining workflow rooms if authenticated
        if (data.room.startsWith('workflow:') && !socket.user) return;
        socket.join(data.room);
      }
    });
  });
  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

function emit(event, payload, room) {
  if (!io) return;
  if (room) io.to(room).emit(event, payload);
  else io.emit(event, payload);
}

module.exports = { init, getIO, emit };
