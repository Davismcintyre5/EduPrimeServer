const User = require('../../models/client/User');
const AuditLog = require('../../models/client/Log');
const { success, error, paginated } = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const paginate = require('../../utils/pagination');
const { hashPassword } = require('../../utils/hashPassword');
const logger = require('../../utils/logger');

// GET /api/school/staff
const getStaff = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = { schoolId: req.schoolId, role: { $ne: 'school_admin' } };
  
   if (req.query.role) filter.role = req.query.role;
  
  const users = await User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit);
  const total = await User.countDocuments(filter);
  return paginated(res, users, total, page, limit, 'Staff fetched');
});

// GET /api/school/staff/:id
const getStaffMember = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, schoolId: req.schoolId }).select('-password');
  if (!user) return error(res, 'Staff not found', 404);
  return success(res, user);
});

// POST /api/school/staff
const createStaff = asyncHandler(async (req, res) => {
  const {
    name, email, phone, password, role,
    tscNumber, employmentType, gender, dob, subjects,
    qualification, yearJoined, nationalId, address,
    emergencyContact, emergencyPhone,
  } = req.body;

  if (!name || !email || !password || !role) return error(res, 'Name, email, password and role are required', 400);

  const exists = await User.findOne({ email, schoolId: req.schoolId });
  if (exists) return error(res, 'Email already exists', 400);

  const hashed = await hashPassword(password);
  const user = await User.create({
    schoolId: req.schoolId, name, email, phone, password: hashed, role,
    tscNumber: tscNumber || '',
    employmentType: employmentType || 'BOM',
    gender: gender || '',
    dob: dob || null,
    subjects: subjects || [],
    qualification: qualification || '',
    yearJoined: yearJoined || null,
    nationalId: nationalId || '',
    address: address || '',
    emergencyContact: emergencyContact || '',
    emergencyPhone: emergencyPhone || '',
  });

  await AuditLog.create({ schoolId: req.schoolId, userId: req.user.id, action: 'staff_created', details: `${name} (${role})`, ip: req.ip });
  logger.info(`👤 Staff created: ${name}`);
  return success(res, { id: user._id, name, email, role }, 'Staff created', 201);
});

// PUT /api/school/staff/:id
const updateStaff = asyncHandler(async (req, res) => {
  const allowed = [
  'name', 'email', 'phone', 'role', 'photo',
  'tscNumber', 'employmentType', 'gender', 'dob', 'subjects',
  'qualification', 'yearJoined', 'nationalId', 'kraPin', 'address',
  'emergencyContact', 'emergencyPhone',
];
  const updates = {};
  allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  if (req.body.password) updates.password = await hashPassword(req.body.password);

  const user = await User.findOneAndUpdate(
    { _id: req.params.id, schoolId: req.schoolId },
    updates,
    { new: true }
  ).select('-password');

  if (!user) return error(res, 'Staff not found', 404);
  await AuditLog.create({ schoolId: req.schoolId, userId: req.user.id, action: 'staff_updated', details: `${user.name}`, ip: req.ip });
  return success(res, user, 'Staff updated');
});

// PATCH /api/school/staff/:id/toggle
const toggleStaff = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, schoolId: req.schoolId });
  if (!user) return error(res, 'User not found', 404);
  user.isActive = !user.isActive;
  await user.save();
  await AuditLog.create({ schoolId: req.schoolId, userId: req.user.id, action: 'staff_toggled', details: `${user.name} ${user.isActive ? 'activated' : 'deactivated'}`, ip: req.ip });
  return success(res, null, `User ${user.isActive ? 'activated' : 'deactivated'}`);
});

// DELETE /api/school/staff/:id
const deleteStaff = asyncHandler(async (req, res) => {
  const user = await User.findOneAndDelete({ _id: req.params.id, schoolId: req.schoolId, role: { $ne: 'school_admin' } });
  if (!user) return error(res, 'User not found', 404);
  await AuditLog.create({ schoolId: req.schoolId, userId: req.user.id, action: 'staff_deleted', details: `${user.name}`, ip: req.ip });
  return success(res, null, 'Staff deleted');
});

module.exports = { getStaff, getStaffMember, createStaff, updateStaff, toggleStaff, deleteStaff };