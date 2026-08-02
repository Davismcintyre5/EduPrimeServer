const cloudinary = require('../config/cloudinary');
const logger = require('../utils/logger');
const env = require('../config/env');

const uploadFile = async (filePath, folder) => {
  if (!env.cloudinaryEnabled) {
    logger.warn('Cloudinary disabled. Using local fallback.');
    return `/uploads/${filePath.split('\\').pop().split('/').pop()}`;
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, { folder });
    logger.info(`✅ File uploaded: ${result.secure_url}`);
    return result.secure_url;
  } catch (err) {
    logger.error(`Upload failed: ${err.message}`);
    return null;
  }
};

const deleteFile = async (publicId) => {
  if (!env.cloudinaryEnabled) return true;
  try {
    await cloudinary.uploader.destroy(publicId);
    logger.info(`🗑️ File deleted: ${publicId}`);
    return true;
  } catch (err) {
    logger.error(`Delete failed: ${err.message}`);
    return false;
  }
};

module.exports = { uploadFile, deleteFile };