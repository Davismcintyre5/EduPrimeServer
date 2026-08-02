const SuperAdmin = require('../../models/admin/SuperAdmin');
const Setting = require('../../models/admin/Setting');
const Log = require('../../models/admin/Log');
const { comparePassword } = require('../../utils/hashPassword');
const { generateAccessToken, generateRefreshToken } = require('../../utils/generateToken');
const { success, error } = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const { sendEmail } = require('../../services/emailService');
const logger = require('../../utils/logger');

// POST /api/admin/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const admin = await SuperAdmin.findOne({ email, isActive: true });
  if (!admin) {
    return error(res, 'Invalid credentials', 401);
  }

  const isMatch = await comparePassword(password, admin.password);
  if (!isMatch) {
    return error(res, 'Invalid credentials', 401);
  }

  const token = generateAccessToken({ id: admin._id, role: 'super_admin' });
  const refreshToken = generateRefreshToken({ id: admin._id });

  await Log.create({
    adminId: admin._id,
    action: 'login',
    details: 'Super admin logged in',
    ip: req.ip,
  });

  logger.info(`🔐 Super admin logged in: ${admin.email}`);

  return success(res, {
    token,
    refreshToken,
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
  }, 'Login successful');
});

// POST /api/admin/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const admin = await SuperAdmin.findOne({ email, isActive: true });
  if (!admin) {
    return success(res, null, 'If account exists, reset link sent');
  }

  const resetToken = generateAccessToken({ id: admin._id }, '1h');
  const settings = await Setting.findOne().lean();

  await sendEmail(email, 'passwordReset', {
    resetUrl: `${process.env.ADMIN_URL}/reset-password?token=${resetToken}`,
  }, null, settings);

  logger.info(`🔑 Password reset requested for: ${email}`);

  return success(res, null, 'If account exists, reset link sent');
});

// POST /api/admin/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  const jwt = require('jsonwebtoken');
  const env = require('../../config/env');

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch (err) {
    return error(res, 'Invalid or expired token', 400);
  }

  const { hashPassword } = require('../../utils/hashPassword');
  const admin = await SuperAdmin.findById(decoded.id);
  if (!admin) {
    return error(res, 'Admin not found', 404);
  }

  admin.password = await hashPassword(password);
  await admin.save();

  await Log.create({
    adminId: admin._id,
    action: 'password_reset',
    details: 'Password reset completed',
    ip: req.ip,
  });

  return success(res, null, 'Password reset successful');
});

// GET /api/admin/auth/me
const getMe = asyncHandler(async (req, res) => {
  const admin = await SuperAdmin.findById(req.admin.id).select('-password');
  if (!admin) {
    return error(res, 'Admin not found', 404);
  }
  return success(res, admin);
});

// POST /api/admin/auth/refresh
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;
  const jwt = require('jsonwebtoken');
  const env = require('../../config/env');

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtRefreshSecret);
  } catch (err) {
    return error(res, 'Invalid refresh token', 401);
  }

  const accessToken = generateAccessToken({ id: decoded.id, role: 'super_admin' });
  const newRefreshToken = generateRefreshToken({ id: decoded.id });

  return success(res, { token: accessToken, refreshToken: newRefreshToken });
});

module.exports = { login, forgotPassword, resetPassword, getMe, refreshToken };