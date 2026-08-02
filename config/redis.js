const { createClient } = require('redis');
const env = require('./env');
const logger = require('../utils/logger');

let redisClient = null;

if (env.redisEnabled) {
  redisClient = createClient({ url: env.redisUrl });

  redisClient.on('connect', () => logger.info('✅ Redis connected'));
  redisClient.on('error', (err) => logger.warn(`⚠️  Redis error: ${err.message}`));

  redisClient.connect();
} else {
  logger.warn('⚠️  Redis disabled');
}

module.exports = redisClient;