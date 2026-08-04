const SchoolSetting = require('../../models/client/Setting');
const School = require('../../models/admin/School');
const User = require('../../models/client/User');
const AuditLog = require('../../models/client/Log');
const { success, error } = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const { hashPassword, comparePassword } = require('../../utils/hashPassword');
const logger = require('../../utils/logger');

const isAdmin = (role) => role === 'school_admin';

// ═══════════ PROFILE (Current User) ═══════════
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  return success(res, user);
});

const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['name', 'email', 'phone', 'photo'];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
  await AuditLog.create({ schoolId: req.schoolId, userId: req.user.id, action: 'profile_updated', details: 'User profile updated', ip: req.ip });
  return success(res, user, 'Profile updated');
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id);
  const isMatch = await comparePassword(currentPassword, user.password);
  if (!isMatch) return error(res, 'Current password is incorrect', 400);
  user.password = await hashPassword(newPassword);
  await user.save();
  await AuditLog.create({ schoolId: req.schoolId, userId: req.user.id, action: 'password_changed', details: 'Password changed', ip: req.ip });
  return success(res, null, 'Password changed');
});

// ═══════════ SCHOOL INFO ═══════════
const getSchoolInfo = asyncHandler(async (req, res) => {
  const school = await School.findById(req.schoolId).select('-adminPassword');
  return success(res, school);
});

const updateSchoolInfo = asyncHandler(async (req, res) => {
  if (!isAdmin(req.user.role)) return error(res, 'Access denied', 403);
  const allowed = ['name', 'type', 'levels', 'email', 'phone', 'website', 'motto', 'vision', 'mission', 'town', 'location', 'address', 'logo', 'code'];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  const school = await School.findByIdAndUpdate(req.schoolId, updates, { new: true }).select('-adminPassword');
  await AuditLog.create({ schoolId: req.schoolId, userId: req.user.id, action: 'school_updated', details: 'School info updated', ip: req.ip });
  return success(res, school, 'School updated');
});

// ═══════════ SETTINGS ═══════════
const getSettings = asyncHandler(async (req, res) => {
  const settings = await SchoolSetting.find({ schoolId: req.schoolId });
  const result = {};
  settings.forEach(s => { result[s.key] = s.value; });
  return success(res, result);
});

const updateSettings = asyncHandler(async (req, res) => {
  if (!isAdmin(req.user.role)) return error(res, 'Access denied', 403);
  for (const [key, value] of Object.entries(req.body)) {
    await SchoolSetting.findOneAndUpdate({ schoolId: req.schoolId, key }, { value }, { upsert: true, new: true });
  }
  await AuditLog.create({ schoolId: req.schoolId, userId: req.user.id, action: 'settings_updated', details: Object.keys(req.body).join(', '), ip: req.ip });
  return success(res, null, 'Settings updated');
});

module.exports = { getProfile, updateProfile, changePassword, getSchoolInfo, updateSchoolInfo, getSettings, updateSettings };