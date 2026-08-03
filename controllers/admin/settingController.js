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

// GET /api/admin/settings/landing
const getLandingSettings = asyncHandler(async (req, res) => {
  const keys = [
    'landing_hero_title', 'landing_hero_subtitle', 'landing_hero_cta_text',
    'landing_hero_cta_link', 'landing_hero_image',
    'landing_stats_schools', 'landing_stats_students', 'landing_stats_staff',
    'landing_features', 'landing_downloads', 'landing_testimonials',
  ];

  const settings = await Setting.find({ key: { $in: keys } });
  const result = {};
  
  settings.forEach((s) => {
    if (['landing_features', 'landing_downloads', 'landing_testimonials'].includes(s.key)) {
      try {
        result[s.key] = typeof s.value === 'string' ? JSON.parse(s.value) : s.value;
      } catch {
        result[s.key] = s.value;
      }
    } else {
      result[s.key] = s.value;
    }
  });

  // Defaults
  if (!result.landing_features) result.landing_features = [];
  if (!result.landing_downloads) result.landing_downloads = [];
  if (!result.landing_testimonials) result.landing_testimonials = [];

  return success(res, result);
});

// PUT /api/admin/settings/landing
const updateLandingSettings = asyncHandler(async (req, res) => {
  const allowedKeys = [
    'landing_hero_title', 'landing_hero_subtitle', 'landing_hero_cta_text',
    'landing_hero_cta_link', 'landing_hero_image',
    'landing_stats_schools', 'landing_stats_students', 'landing_stats_staff',
    'landing_features', 'landing_downloads', 'landing_testimonials',
  ];

  for (const [key, value] of Object.entries(req.body)) {
    if (!allowedKeys.includes(key)) continue;
    
    const saveValue = ['landing_features', 'landing_downloads', 'landing_testimonials'].includes(key)
      ? JSON.stringify(value)
      : value;

    await Setting.findOneAndUpdate(
      { key },
      { value: saveValue, description: `Landing page: ${key.replace(/_/g, ' ')}` },
      { upsert: true, new: true }
    );
  }

  if (redisClient) await redisClient.del('admin_settings');

  await Log.create({
    adminId: req.admin.id,
    action: 'landing_settings_updated',
    details: `Updated: ${Object.keys(req.body).join(', ')}`,
    ip: req.ip,
  });

  logger.info('🛬 Landing page settings updated');
  return success(res, null, 'Landing settings updated');
});

// GET /api/admin/settings/chat
const getChatSettings = asyncHandler(async (req, res) => {
  const keys = [
    'chat_enabled', 'chat_api_url', 'chat_api_key', 'chat_model',
    'chat_bot_name', 'chat_greeting', 'chat_color', 'chat_position', 'chat_icon',
  ];

  const settings = await Setting.find({ key: { $in: keys } });
  const result = {};
  settings.forEach((s) => { result[s.key] = s.value; });

  // Defaults
  result.chat_enabled = result.chat_enabled ?? false;
  result.chat_api_url = result.chat_api_url || 'https://api.openai.com/v1/chat/completions';
  result.chat_model = result.chat_model || 'gpt-3.5-turbo';
  result.chat_bot_name = result.chat_bot_name || 'EduPrime Assistant';
  result.chat_greeting = result.chat_greeting || '👋 Hi! How can I help you with EduPrime today?';
  result.chat_color = result.chat_color || '#f0a500';
  result.chat_position = result.chat_position || 'bottom-right';
  result.chat_icon = result.chat_icon || '💬';

  return success(res, result);
});

// PUT /api/admin/settings/chat
const updateChatSettings = asyncHandler(async (req, res) => {
  const allowedKeys = [
    'chat_enabled', 'chat_api_url', 'chat_api_key', 'chat_model',
    'chat_bot_name', 'chat_greeting', 'chat_color', 'chat_position', 'chat_icon',
  ];

  for (const [key, value] of Object.entries(req.body)) {
    if (!allowedKeys.includes(key)) continue;
    await Setting.findOneAndUpdate(
      { key },
      { value, description: `Chat: ${key.replace(/_/g, ' ')}` },
      { upsert: true, new: true }
    );
  }

  if (redisClient) await redisClient.del('admin_settings');

  await Log.create({
    adminId: req.admin.id,
    action: 'chat_settings_updated',
    details: `Updated: ${Object.keys(req.body).join(', ')}`,
    ip: req.ip,
  });

  logger.info('💬 Chat settings updated');
  return success(res, null, 'Chat settings updated');
});


module.exports = { getSettings, updateSettings, getLandingSettings,
  updateLandingSettings,  getChatSettings,
  updateChatSettings, };