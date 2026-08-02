require('./scripts/dnsSet');

const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./config/db');
const env = require('./config/env');
const { startKeepAlive } = require('./config/keepAlive');
const logger = require('./utils/logger');
const { success } = require('./utils/apiResponse');
const errorHandler = require('./middleware/global/errorHandler');
const { generalLimiter } = require('./middleware/global/rateLimiter');
const corsMiddleware = require('./middleware/global/cors');
const morganMiddleware = require('./middleware/global/morgan');
const { initSocket } = require('./config/socket');
const { startAllSchedulers } = require('./schedulers');
const maintenanceCheck = require('./middleware/global/maintenance');

// ─── Uncaught Exceptions ───
process.on('uncaughtException', (err) => {
  logger.error(`❌ Uncaught Exception: ${err.message}`);
  process.exit(1);
});

// ─── App Setup ───
const app = express();
const server = http.createServer(app);

// ─── Global Middleware ───
app.use(corsMiddleware);
app.use(morganMiddleware);
app.use(generalLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Maintenance check — skip for admin routes and public
app.use((req, res, next) => {
  if (req.path.startsWith('/api/admin')) return next();
  if (req.path.startsWith('/api/public')) return next();
  maintenanceCheck(req, res, next);
});

// ─── Static ───
app.use('/uploads', express.static('uploads'));

// ─── Base Routes ───
app.get('/', (req, res) => {
  return success(res, {
    name: env.appName,
    version: '1.0.0',
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
  }, `Welcome to ${env.appName} API`);
});

app.get('/api', (req, res) => {
  return success(res, {
    name: env.appName,
    version: '1.0.0',
    docs: `${env.appUrl}/api/docs`,
    health: `${env.appUrl}/health`,
  }, `${env.appName} API v1.0.0`);
});

app.get('/health', (req, res) => {
  const mongoose = require('mongoose');
  const redisClient = require('./config/redis');

  return success(res, {
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      database: mongoose.connection.readyState === 1 ? 'up' : 'down',
      redis: redisClient ? (redisClient.isReady ? 'up' : 'down') : 'disabled',
      email: env.emailEnabled ? 'enabled' : 'disabled',
      sms: env.smsEnabled ? 'enabled' : 'disabled',
    },
  });
});

// ─── API Routes ───
app.use('/api', require('./routes'));

// ─── 404 Handler ───
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ─── Error Handler ───
app.use(errorHandler);

// ─── Start Server ───
const PORT = env.port;

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  // Init Socket.io
  initSocket(server);

  // Start schedulers
  startAllSchedulers();

  server.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║                                              ║');
    console.log(`║   🏫  ${env.appName} Server Started`);
    console.log('║                                              ║');
    console.log(`║   🌍  Environment : ${env.nodeEnv}`);
    console.log(`║   📧  Email       : ${env.emailEnabled ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`║   📱  SMS         : ${env.smsEnabled ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`║   📦  Redis       : ${env.redisEnabled ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`║   ☁️   Cloudinary  : ${env.cloudinaryEnabled ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`║   🔌  WebSocket   : ${env.socketEnabled ? '✅ Enabled' : '❌ Disabled'}`);
    console.log('║                                              ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log('');

    logger.info(`🚀 ${env.appName} server running on port ${PORT}`);
  });
};

startKeepAlive();

startServer().catch((err) => {
  logger.error(`❌ Failed to start server: ${err.message}`);
  process.exit(1);
});

// ─── Graceful Shutdown ───
const gracefulShutdown = async (signal) => {
  console.log('');
  logger.warn(`\n⚠️  ${signal} received. Shutting down gracefully...`);

  server.close(async () => {
    logger.info('🛑 HTTP server closed');

    // Close MongoDB
    const mongoose = require('mongoose');
    await mongoose.connection.close();
    logger.info('📦 MongoDB disconnected');

    // Close Redis
    const redisClient = require('./config/redis');
    if (redisClient && redisClient.isOpen) {
      await redisClient.quit();
      logger.info('📦 Redis disconnected');
    }

    logger.info('👋 Goodbye!');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error('❌ Could not close connections in time, forcing shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ─── Unhandled Rejections ───
process.on('unhandledRejection', (err) => {
  logger.error(`❌ Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;