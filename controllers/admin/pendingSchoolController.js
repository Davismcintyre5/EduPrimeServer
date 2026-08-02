const PendingSchool = require('../../models/admin/PendingSchool');
const School = require('../../models/admin/School');
const User = require('../../models/client/User');
const Log = require('../../models/admin/Log');
const Setting = require('../../models/admin/Setting');
const { success, error, paginated } = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const paginate = require('../../utils/pagination');
const { hashPassword } = require('../../utils/hashPassword');
const { sendEmail } = require('../../services/emailService');
const { sendSMS } = require('../../services/smsService');
const logger = require('../../utils/logger');

// GET /api/admin/pending-schools
const getPendingSchools = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const schools = await PendingSchool.find({ status: 'pending' })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  const total = await PendingSchool.countDocuments({ status: 'pending' });
  return paginated(res, schools, total, page, limit, 'Pending schools fetched');
});

// GET /api/admin/pending-schools/:id
const getPendingSchool = asyncHandler(async (req, res) => {
  const school = await PendingSchool.findById(req.params.id);
  if (!school) return error(res, 'Pending school not found', 404);
  return success(res, school);
});

// PATCH /api/admin/pending-schools/:id/approve
const approveSchool = asyncHandler(async (req, res) => {
  const pending = await PendingSchool.findById(req.params.id);
  if (!pending) return error(res, 'Pending school not found', 404);

  // Hash password
  const adminPass = pending.adminPassword || 'ChangeMe123';
  const hashed = await hashPassword(adminPass);

  // Create actual school
  const school = await School.create({
    name: pending.name,
    country: pending.country,
    county: pending.county,
    constituency: pending.constituency,
    town: pending.town,
    location: pending.location,
    currency: pending.currency,
    type: pending.type,
    levels: pending.levels,
    email: pending.adminEmail,
    phone: pending.adminPhone,
    adminName: pending.adminName || pending.adminEmail?.split('@')[0] || 'Admin',
    adminEmail: pending.adminEmail,
    adminPhone: pending.adminPhone,
    adminPassword: hashed,
  });

  // Create school admin user
  await User.create({
    schoolId: school._id,
    name: pending.adminName || pending.adminEmail?.split('@')[0] || 'Admin',
    email: pending.adminEmail,
    password: hashed,
    phone: pending.adminPhone,
    role: 'school_admin',
    isActive: true,
  });

  // Update pending record
  pending.status = 'approved';
  pending.reviewedBy = req.admin.id;
  pending.reviewedAt = new Date();
  await pending.save();

  // Send notifications
  const settings = await Setting.findOne().lean();
  await sendEmail(pending.adminEmail, 'registrationApproved', {
    schoolName: pending.name,
    adminName: pending.adminName || 'Admin',
    email: pending.adminEmail,
    loginUrl: `${process.env.CLIENT_URL}/login`,
  }, settings);

  if (pending.adminPhone) {
    await sendSMS(pending.adminPhone, 'registrationApproved', {
      schoolName: pending.name,
      loginUrl: `${process.env.CLIENT_URL}/login`,
    });
  }

  await Log.create({
    adminId: req.admin.id,
    action: 'school_approved',
    details: `Self-registered school approved: ${pending.name}`,
    ip: req.ip,
  });

  logger.info(`✅ School approved: ${pending.name}`);
  return success(res, school, 'School approved');
});

// PATCH /api/admin/pending-schools/:id/reject
const rejectSchool = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const pending = await PendingSchool.findById(req.params.id);
  if (!pending) return error(res, 'Pending school not found', 404);

  pending.status = 'rejected';
  pending.reviewedBy = req.admin.id;
  pending.reviewedAt = new Date();
  pending.notes = reason;
  await pending.save();

  const settings = await Setting.findOne().lean();
  await sendEmail(pending.adminEmail, 'registrationRejected', {
    schoolName: pending.name,
    adminName: pending.adminName || 'Admin',
    reason: reason || 'Contact support for details.',
  }, settings);

  await Log.create({
    adminId: req.admin.id,
    action: 'school_rejected',
    details: `Self-registered school rejected: ${pending.name}. Reason: ${reason}`,
    ip: req.ip,
  });

  logger.info(`❌ School rejected: ${pending.name}`);
  return success(res, null, 'School rejected');
});

module.exports = { getPendingSchools, getPendingSchool, approveSchool, rejectSchool };