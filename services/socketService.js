const { getIO } = require('../config/socket');
const logger = require('../utils/logger');

const emitToSchool = (schoolId, event, data) => {
  const io = getIO();
  if (!io) return;
  io.to(`school:${schoolId}`).emit(event, data);
};

const emitToUser = (userId, event, data) => {
  const io = getIO();
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
};

const emitNotification = (userId, notification) => {
  emitToUser(userId, 'notification', notification);
};

module.exports = { emitToSchool, emitToUser, emitNotification };