const Health = require('../../models/admin/Health');
const mongoose = require('mongoose');
const redisClient = require('../../config/redis');
const env = require('../../config/env');
const { success } = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const os = require('os');

// GET /api/admin/health
const checkHealth = asyncHandler(async (req, res) => {
  // ─── Server Status ───
  const serverStatus = {
    status: 'running',
    nodeVersion: process.version,
    environment: env.nodeEnv,
    platform: os.platform(),
    arch: os.arch(),
    hostname: os.hostname(),
    uptime: process.uptime(),
    uptimeFormatted: formatUptime(process.uptime()),
    serverUrl: env.appUrl,
    cpuUsage: os.loadavg()[0].toFixed(2),
    cpuCores: os.cpus().length,
    totalMemory: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + ' GB',
    freeMemory: (os.freemem() / 1024 / 1024 / 1024).toFixed(2) + ' GB',
    memoryUsage: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + ' MB',
    pid: process.pid,
  };

  // ─── Database Status ───
  const dbState = mongoose.connection.readyState;
  const dbStatusMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

  let dbStatus = {
    status: dbState === 1 ? 'up' : 'down',
    state: dbStatusMap[dbState] || 'unknown',
    host: mongoose.connection.host || 'N/A',
    port: mongoose.connection.port || 'N/A',
    dbName: mongoose.connection.name || 'N/A',
    collections: 0,
  };

  if (dbState === 1) {
    try {
      const collections = await mongoose.connection.db.listCollections().toArray();
      dbStatus.collections = collections.length;
    } catch (err) {
      dbStatus.collections = 'error';
    }
  }

  // ─── Redis Status ───
  let redisStatus = { status: 'disabled' };
  if (redisClient) {
    redisStatus = {
      status: redisClient.isReady ? 'up' : 'down',
      host: env.redisUrl ? env.redisUrl.split('@').pop()?.split(':')[0] || env.redisUrl : 'N/A',
      connected: redisClient.isReady,
    };
  }

  // ─── Email (HDM Bridge) Status ───
  const emailStatus = {
    status: env.emailEnabled ? 'enabled' : 'disabled',
    provider: 'HDM Bridge',
    fromEmail: env.hdmFromEmail || 'N/A',
    fromName: env.hdmFromName || 'N/A',
    apiUrl: env.hdmApiUrl ? 'configured' : 'not configured',
  };

  // ─── SMS (Brevo) Status ───
  const smsStatus = {
    status: env.smsEnabled ? 'enabled' : 'disabled',
    provider: 'Brevo',
    sender: env.brevoSender || 'N/A',
    apiKey: env.brevoApiKey ? 'configured' : 'not configured',
  };

  // ─── Cloudinary Status ───
  const cloudinaryStatus = {
    status: env.cloudinaryEnabled ? 'enabled' : 'disabled',
    cloudName: env.cloudinaryCloudName || 'N/A',
  };

  // ─── Socket Status ───
  const socketStatus = {
    status: env.socketEnabled ? 'enabled' : 'disabled',
    corsOrigin: env.socketCorsOrigin || 'N/A',
  };

  // ─── Overall Status ───
  const allUp = dbStatus.status === 'up';
  const overallStatus = allUp ? 'healthy' : 'degraded';

  const health = {
    overallStatus,
    timestamp: new Date().toISOString(),
    server: serverStatus,
    database: dbStatus,
    redis: redisStatus,
    email: emailStatus,
    sms: smsStatus,
    cloudinary: cloudinaryStatus,
    socket: socketStatus,
  };

  // Save health check to DB
  await Health.create({
    dbStatus: dbStatus.status,
    redisStatus: redisStatus.status,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
    checkedAt: new Date(),
  });

  return success(res, health);
});

// GET /api/admin/health/history
const getHealthHistory = asyncHandler(async (req, res) => {
  const history = await Health.find()
    .sort({ checkedAt: -1 })
    .limit(30);

  return success(res, history);
});

// Helper
const formatUptime = (seconds) => {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${d}d ${h}h ${m}m ${s}s`;
};

module.exports = { checkHealth, getHealthHistory };