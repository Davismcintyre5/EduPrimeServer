const School = require('../../models/admin/School');
const PendingSchool = require('../../models/admin/PendingSchool');
const Setting = require('../../models/admin/Setting');
const Legal = require('../../models/admin/Legal');
const User = require('../../models/client/User');
const { success, error } = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const { sendEmail } = require('../../services/emailService');
const { sendSMS } = require('../../services/smsService');
const { generateAccessToken } = require('../../utils/generateToken');
const { hashPassword } = require('../../utils/hashPassword');
const logger = require('../../utils/logger');

const countries = require('../../utils/countries');
const counties = require('../../utils/counties');
const constituencies = require('../../utils/constituencies');
const wards = require('../../utils/wards');

// ═══════════ PUBLIC INFO ═══════════

const getPublicSettings = asyncHandler(async (req, res) => {
  const settings = await Setting.find({
    key: { $in: ['app_name', 'support_email', 'support_phone', 'logo_url', 'favicon_url', 'primary_color', 'accent_color', 'allow_self_registration'] }
  });
  const result = {};
  settings.forEach((s) => { result[s.key] = s.value; });
  return success(res, result);
});

const getPublicLegals = asyncHandler(async (req, res) => {
  const { type } = req.query;
  const filter = { isPublished: true };
  if (type) filter.type = type;
  const legals = await Legal.find(filter).select('type title content version updatedAt');
  return success(res, legals);
});

const getSupportInfo = asyncHandler(async (req, res) => {
  const settings = await Setting.find({
    key: { $in: ['support_email', 'support_phone', 'app_name'] }
  });
  const result = {};
  settings.forEach((s) => { result[s.key] = s.value; });
  return success(res, result);
});

// ═══════════ REFERENCE DATA ═══════════

const getCountries = asyncHandler(async (req, res) => {
  return success(res, countries);
});

const getCounties = asyncHandler(async (req, res) => {
  const { country } = req.query;
  if (country && country !== 'KE') return success(res, []);
  return success(res, counties);
});

const getConstituencies = asyncHandler(async (req, res) => {
  const { county } = req.query;
  if (!county) return error(res, 'County code is required', 400);
  return success(res, constituencies[county] || []);
});

const getWards = asyncHandler(async (req, res) => {
  const { constituency } = req.query;
  if (!constituency) return error(res, 'Constituency code is required', 400);
  return success(res, wards[constituency] || []);
});

// ═══════════ SELF REGISTRATION ═══════════

const registerSchool = asyncHandler(async (req, res) => {
  const regSetting = await Setting.findOne({ key: 'allow_self_registration' });
  if (!regSetting || regSetting.value !== true) {
    return error(res, 'Self-registration is currently disabled', 403);
  }

  const {
    name, country, county, constituency, ward, town, location,
    currency, type, levels,
    adminName, adminEmail, adminPhone, adminPassword,
  } = req.body;

  if (!name || !country || !adminEmail || !adminName || !adminPassword) {
    return error(res, 'School name, country, admin name, email and password are required', 400);
  }

  const existingSchool = await School.findOne({ name });
  if (existingSchool) return error(res, 'School name already exists', 400);

  const existingPending = await PendingSchool.findOne({ name, status: 'pending' });
  if (existingPending) return error(res, 'A registration with this school name is already pending', 400);

  const existingEmail = await PendingSchool.findOne({ adminEmail, status: 'pending' });
  if (existingEmail) return error(res, 'This email already has a pending registration', 400);

  const pending = await PendingSchool.create({
    name,
    country,
    county: county || '',
    constituency: constituency || '',
    ward: ward || '',
    town: town || '',
    location: location || '',
    currency: currency || 'KES',
    type: type || 'private',
    levels: levels || [],
    adminName,
    adminEmail,
    adminPhone: adminPhone || '',
    adminPassword,
    status: 'pending',
  });

  const settings = await Setting.findOne().lean();
  await sendEmail(adminEmail, 'registrationReceived', {
    schoolName: name,
    adminName: adminName,
  }, settings);

  if (adminPhone) {
    await sendSMS(adminPhone, 'registrationReceived', { schoolName: name });
  }

  logger.info(`📝 Self-registration received: ${name} (${adminEmail})`);
  return success(res, { id: pending._id }, 'Registration submitted for review.', 201);
});

const checkRegistrationStatus = asyncHandler(async (req, res) => {
  const pending = await PendingSchool.findById(req.params.id).select('name status notes createdAt');
  if (!pending) return error(res, 'Registration not found', 404);

  const statusMessages = {
    pending: 'Your registration is under review.',
    approved: 'Your registration has been approved! Check your email for login details.',
    rejected: `Your registration was not approved. ${pending.notes || 'Contact support for details.'}`,
  };

  return success(res, {
    ...pending.toObject(),
    statusMessage: statusMessages[pending.status] || '',
  });
});

// ═══════════ AUTH ═══════════

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return error(res, 'Email is required', 400);

  const user = await User.findOne({ email, isActive: true });
  if (!user) return success(res, null, 'If an account exists, a reset link has been sent.');

  const school = await School.findById(user.schoolId);
  if (!school || !school.isActive) return success(res, null, 'If an account exists, a reset link has been sent.');

  const resetToken = generateAccessToken({ id: user._id }, '1h');
  await sendEmail(email, 'passwordReset', {
    resetUrl: `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`,
  }, school);

  logger.info(`🔑 Password reset requested: ${email}`);
  return success(res, null, 'If an account exists, a reset link has been sent.');
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return error(res, 'Token and password are required', 400);

  const jwt = require('jsonwebtoken');
  const env = require('../../config/env');

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch (err) {
    return error(res, 'Invalid or expired reset link', 400);
  }

  const user = await User.findById(decoded.id);
  if (!user) return error(res, 'User not found', 404);

  user.password = await hashPassword(password);
  await user.save();

  logger.info(`🔐 Password reset completed: ${user.email}`);
  return success(res, null, 'Password reset successful');
});

module.exports = {
  getPublicSettings,
  getPublicLegals,
  getSupportInfo,
  getCountries,
  getCounties,
  getConstituencies,
  getWards,
  registerSchool,
  checkRegistrationStatus,
  forgotPassword,
  resetPassword,
};