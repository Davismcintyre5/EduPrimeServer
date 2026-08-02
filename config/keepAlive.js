const axios = require('axios');
const http = require('http');
const env = require('./env');
const logger = require('../utils/logger');

const startKeepAlive = () => {
  if (env.keepAlive !== true) {
    logger.info('💤 Keep-alive is disabled');
    return;
  }

  const url = `${env.appUrl}/health`;
  const agent = new http.Agent({ family: 4 });

  // First ping after 1 minute
  setTimeout(() => {
    ping(url, agent);
    // Then every 10 minutes
    setInterval(() => ping(url, agent), 10 * 60 * 1000);
    logger.info(`🔄 Keep-alive started — pinging ${url} every 10 minutes`);
  }, 1 * 60 * 1000);
};

const ping = async (url, agent) => {
  try {
    const res = await axios.get(url, { httpAgent: agent, timeout: 10000 });
    logger.info(`✅ Keep-alive ping: ${res.status}`);
  } catch (err) {
    logger.warn(`⚠️ Keep-alive ping failed: ${err.message}`);
  }
};

module.exports = { startKeepAlive };