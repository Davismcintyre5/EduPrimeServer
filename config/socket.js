const { Server } = require('socket.io');
const env = require('./env');
const logger = require('../utils/logger');

let io = null;

const initSocket = (server) => {
  if (env.socketEnabled) {
    io = new Server(server, {
      cors: {
        origin: env.socketCorsOrigin.split(','),
        methods: ['GET', 'POST'],
      },
    });

    io.on('connection', (socket) => {
      logger.info(`🔌 Socket connected: ${socket.id}`);

      socket.on('disconnect', () => {
        logger.info(`🔌 Socket disconnected: ${socket.id}`);
      });
    });

    logger.info('✅ Socket.io initialized');
  } else {
    logger.warn('⚠️  WebSocket disabled');
  }
};

const getIO = () => io;

module.exports = { initSocket, getIO };