const { sendEmail } = require('./emailService');
const { sendSMS } = require('./smsService');
const { emitNotification } = require('./socketService');
const logger = require('../utils/logger');

const notify = async ({ userId, email, phone, templateName, data, channels = [] }) => {
  const results = { email: false, sms: false, push: false };

  if (channels.includes('email') && email) {
    results.email = await sendEmail(email, templateName, data);
  }

  if (channels.includes('sms') && phone) {
    results.sms = await sendSMS(phone, templateName, data);
  }

  if (channels.includes('push') && userId) {
    emitNotification(userId, { templateName, ...data });
    results.push = true;
  }

  logger.info(`Notifications sent: ${JSON.stringify(results)}`);
  return results;
};

module.exports = { notify };