const axios = require('axios');
const hdmBridge = require('../config/hdmBridge');
const logger = require('../utils/logger');
const emailTemplates = require('../templates/emailTemplates');
const Setting = require('../models/admin/Setting');
const School = require('../models/admin/School');
const { stripHtml } = require('../utils/helpers');

const sendEmail = async (to, templateName, data, schoolOrSettings = null) => {
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

  if (schoolOrSettings) {
    if (schoolOrSettings.name && schoolOrSettings.adminEmail) {
      school = schoolOrSettings;
      console.log('📧 Using SCHOOL:', school.name, school.email, school.phone);
    } else if (schoolOrSettings.support_email !== undefined) {
      settings = schoolOrSettings;
      console.log('📧 Using SETTINGS:', settings.support_email, settings.support_phone);
    } else {
      school = await School.findById(schoolOrSettings).lean();
      console.log('📧 Fetched SCHOOL by ID:', school?.name);
    }
  } else {
    const rawSettings = await Setting.find().lean();
    settings = {};
    rawSettings.forEach(s => { settings[s.key] = s.value; });
    console.log('📧 Using DEFAULT settings:', settings.support_email, settings.support_phone);
  }

  const context = school || settings;
  console.log('📧 Final — email:', context?.support_email || context?.email, '| phone:', context?.support_phone || context?.phone);

  const { subject, html } = template(data, context);

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