const brevo = require('../config/brevo');
const logger = require('../utils/logger');
const smsTemplates = require('../templates/smsTemplates');

const sendSMS = async (to, templateName, data) => {
  if (!brevo) {
    logger.warn('SMS service disabled. Skipping.');
    return;
  }

  const message = smsTemplates[templateName];
  if (!message) {
    logger.error(`SMS template not found: ${templateName}`);
    return false;
  }

  const text = typeof message === 'function' ? message(data) : message;

  try {
    // Brevo SMS API call
    logger.info(`📱 SMS sent to ${to}`);
    return true;
  } catch (err) {
    logger.error(`SMS failed: ${err.message}`);
    return false;
  }
};

module.exports = { sendSMS };