const redisClient = require('../config/redis');
const logger = require('../utils/logger');

const getCache = async (key) => {
  if (!redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    logger.error(`Cache get failed: ${err.message}`);
    return null;
  }
};

const setCache = async (key, value, ttl = 3600) => {
  if (!redisClient) return;
  try {
    await redisClient.set(key, JSON.stringify(value), { EX: ttl });
  } catch (err) {
    logger.error(`Cache set failed: ${err.message}`);
  }
};

const deleteCache = async (key) => {
  if (!redisClient) return;
  try {
    await redisClient.del(key);
  } catch (err) {
    logger.error(`Cache delete failed: ${err.message}`);
  }
};

module.exports = { getCache, setCache, deleteCache };