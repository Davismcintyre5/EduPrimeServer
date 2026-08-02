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
  const interval = 10 * 60 * 1000; // 10 minutes

  // Force IPv4 and set custom agent
  const agent = new http.Agent({ family: 4 });

  // Wait 5 seconds before first ping (server startup)
  setTimeout(() => {
    ping(url, agent);
    setInterval(() => ping(url, agent), interval);
    logger.info(`🔄 Keep-alive started — pinging ${url} every 10 minutes`);
  }, 5000);
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