const env = require('./env');
const logger = require('../utils/logger');

let brevo = null;

if (env.smsEnabled) {
  brevo = {
    apiKey: env.brevoApiKey,
    sender: env.brevoSender,
  };
  logger.info('✅ SMS service ready (Brevo)');
} else {
  logger.warn('⚠️  SMS disabled');
}

module.exports = brevo;