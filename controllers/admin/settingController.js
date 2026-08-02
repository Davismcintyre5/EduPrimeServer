const Setting = require('../../models/admin/Setting');
const Log = require('../../models/admin/Log');
const { success, error } = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const redisClient = require('../../config/redis');
const logger = require('../../utils/logger');

// GET /api/admin/settings
const getSettings = asyncHandler(async (req, res) => {
  const settings = await Setting.find();
  const result = {};
  settings.forEach((s) => { result[s.key] = s.value; });
  return success(res, result);
});

// PUT /api/admin/settings
const updateSettings = asyncHandler(async (req, res) => {
  const updates = req.body;

  for (const [key, value] of Object.entries(updates)) {
    await Setting.findOneAndUpdate(
      { key },
      { value },
      { upsert: true, new: true }
    );
  }

  // Clear settings cache
  if (redisClient) {
    await redisClient.del('admin_settings');
  }

  await Log.create({
    adminId: req.admin.id,
    action: 'settings_updated',
    details: `Settings updated: ${Object.keys(updates).join(', ')}`,
    ip: req.ip,
  });

  logger.info('⚙️  Settings updated');

  return success(res, null, 'Settings updated');
});

module.exports = { getSettings, updateSettings };