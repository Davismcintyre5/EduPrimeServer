const axios = require('axios');
const hdmBridge = require('../config/hdmBridge');
const logger = require('../utils/logger');
const emailTemplates = require('../templates/emailTemplates');
const Setting = require('../models/admin/Setting');
const School = require('../models/admin/School');
const { stripHtml } = require('../utils/helpers');

const sendEmail = async (to, templateName, data, schoolId = null) => {
  if (!hdmBridge) {
    logger.warn('⚠️  Email service disabled. Skipping.');
    return false;
  }

  const template = emailTemplates[templateName];
  if (!template) {
    logger.error(`❌ Email template not found: ${templateName}`);
    return false;
  }

  let school = null;
  let settings = null;

  // Get support context based on template type
  if (schoolId) {
    school = await School.findById(schoolId).lean();
  } else {
    settings = await Setting.findOne().lean();
  }

  const { subject, html } = template(data, school || settings);

  try {
    await axios.post(
      `${hdmBridge.apiUrl}/emails/send`,
      {
        from: hdmBridge.fromEmail,
        fromName: hdmBridge.fromName,
        to,
        subject,
        htmlBody: html,
        textBody: stripHtml(html),
      },
      {
        headers: {
          Authorization: `Bearer ${hdmBridge.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    logger.info(`📧 Email sent to ${to}: ${subject}`);
    return true;
  } catch (err) {
    logger.error(`❌ Email failed: ${err.message}`);
    return false;
  }
};

module.exports = { sendEmail };