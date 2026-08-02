const User = require('../../models/client/User');
const School = require('../../models/admin/School');
const AuditLog = require('../../models/client/Log');
const { comparePassword } = require('../../utils/hashPassword');
const { generateAccessToken, generateRefreshToken } = require('../../utils/generateToken');
const { success, error } = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const { sendEmail } = require('../../services/emailService');
const logger = require('../../utils/logger');

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) return error(res, 'Email and password are required', 400);

  // Check for pending registration first
  const PendingSchool = require('../../models/admin/PendingSchool');
  const pending = await PendingSchool.findOne({ adminEmail: email });

  if (pending) {
    if (pending.status === 'pending') {
      return error(res, 'Your school registration is still under review. You will be notified once approved.', 402);
    }
    if (pending.status === 'rejected') {
      return error(res, `Your registration was not approved. ${pending.notes || 'Please contact support for more information.'}`, 402);
    }
  }

  // Find user
  const user = await User.findOne({ email });
  if (!user) return error(res, 'Invalid credentials', 401);

  if (!user.isActive) {
    return error(res, 'Your account has been deactivated. Please contact your school administrator.', 403);
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) return error(res, 'Invalid credentials', 401);

  const school = await School.findById(user.schoolId).select('-adminPassword');
  if (!school) return error(res, 'School not found', 401);

  if (!school.isActive) {
    return error(res, 'This school has been suspended. Please contact support.', 403);
  }

  const token = generateAccessToken({ id: user._id, schoolId: school._id, role: user.role });
  const refreshToken = generateRefreshToken({ id: user._id, schoolId: school._id });

  await AuditLog.create({
    schoolId: school._id,
    userId: user._id,
    action: 'login',
    details: `${user.role} logged in`,
    ip: req.ip,
  });

  logger.info(`🔐 ${user.role} logged in: ${user.email} @ ${school.name}`);

  return success(res, {
    token,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      photo: user.photo,
    },
    school: {
      id: school._id,
      name: school.name,
      logo: school.logo,
      currency: school.currency,
      type: school.type,
      levels: school.levels,
    },
  }, 'Login successful');
});

// POST /api/school/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const schoolId = req.headers['x-school-id'];

  const user = await User.findOne({ email, schoolId, isActive: true });
  if (!user) {
    return success(res, null, 'If account exists, reset link sent');
  }

  const resetToken = generateAccessToken({ id: user._id }, '1h');
  const school = await School.findById(schoolId).lean();

  await sendEmail(email, 'passwordReset', {
    resetUrl: `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`,
  }, school);

  logger.info(`🔑 Password reset requested: ${email}`);

  return success(res, null, 'If account exists, reset link sent');
});

// POST /api/school/auth/reset-password
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
  const user = await User.findById(decoded.id);
  if (!user) {
    return error(res, 'User not found', 404);
  }

  user.password = await hashPassword(password);
  await user.save();

  return success(res, null, 'Password reset successful');
});

// GET /api/school/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) {
    return error(res, 'User not found', 404);
  }

  const school = await School.findById(req.user.schoolId).select('-adminPassword');

  return success(res, { user, school });
});

// POST /api/school/auth/refresh
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

  const accessToken = generateAccessToken({ id: decoded.id, schoolId: decoded.schoolId, role: decoded.role });
  const newRefreshToken = generateRefreshToken({ id: decoded.id, schoolId: decoded.schoolId });

  return success(res, { token: accessToken, refreshToken: newRefreshToken });
});

module.exports = { login, forgotPassword, resetPassword, getMe, refreshToken };