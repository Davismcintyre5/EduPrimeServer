const rateLimit = require('express-rate-limit');
const env = require('../../config/env');

const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: env.nodeEnv === 'production' ? 500 : 10000,
  message: { success: false, message: 'Too many requests, try again later' },
});

const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: env.nodeEnv === 'production' ? 50 : 1000,
  message: { success: false, message: 'Too many login attempts, try again later' },
});

module.exports = { generalLimiter, authLimiter };