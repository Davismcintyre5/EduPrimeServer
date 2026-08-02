const env = require('./env');
const logger = require('../utils/logger');

let hdmBridge = null;

if (env.emailEnabled) {
  hdmBridge = {
    apiKey: env.hdmApiKey,
    apiUrl: env.hdmApiUrl,
    fromEmail: env.hdmFromEmail,
    fromName: env.hdmFromName,
  };
  logger.info('✅ Email service ready (HDM Bridge)');
} else {
  logger.warn('⚠️  Email disabled');
}

module.exports = hdmBridge;