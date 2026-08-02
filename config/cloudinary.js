const cloudinary = require('cloudinary').v2;
const env = require('./env');
const logger = require('../utils/logger');

if (env.cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
  });
  logger.info('✅ Cloudinary configured');
} else {
  logger.warn('⚠️  Cloudinary disabled — file uploads unavailable');
}

module.exports = cloudinary;