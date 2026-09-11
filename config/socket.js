const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('./env');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: env.clientUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, env.jwtSecret);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    socket.on('driver:join', (data) => {
      socket.join(`user:${socket.userId}`);
      if (data.sessionId) {
        socket.join(`session:${data.sessionId}`);
      }
      console.log(`User ${socket.userId} joined room`);
    });

    socket.on('driver:leave', (data) => {
      if (data.sessionId) {
        socket.leave(`session:${data.sessionId}`);
      }
      socket.leave(`user:${socket.userId}`);
      console.log(`User ${socket.userId} left room`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`User disconnected: ${socket.userId}, Reason: ${reason}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

const emitToSession = (sessionId, event, data) => {
  if (io) {
    io.to(`session:${sessionId}`).emit(event, data);
  }
};

const broadcast = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

module.exports = {
  initializeSocket,
  getIO,
  emitToUser,
  emitToSession,
  broadcast,
};