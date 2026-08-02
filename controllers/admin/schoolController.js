const School = require('../../models/admin/School');
const User = require('../../models/client/User');
const Log = require('../../models/admin/Log');
const { success, error, paginated } = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const paginate = require('../../utils/pagination');
const { sendEmail } = require('../../services/emailService');
const { sendSMS } = require('../../services/smsService');
const { hashPassword } = require('../../utils/hashPassword');
const Setting = require('../../models/admin/Setting');
const logger = require('../../utils/logger');

const countries = require('../../utils/countries');
const counties = require('../../utils/counties');
const constituencies = require('../../utils/constituencies');
const wards = require('../../utils/wards');

// ─── REFERENCE DATA ───

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

// ─── SCHOOL CRUD ───

const createSchool = asyncHandler(async (req, res) => {
  const { 
    name, country, county, constituency, town, location, 
    currency, type, levels, 
    adminEmail, adminPhone, adminName, adminPassword
  } = req.body;

  if (!adminName || !adminPassword) {
    return error(res, 'School admin name and password are required', 400);
  }

  const exists = await School.findOne({ name });
  if (exists) return error(res, 'School name already exists', 400);

  const hashedPassword = await hashPassword(adminPassword);

  const school = await School.create({
    name, country, county, constituency, town, location,
    currency, type, levels, 
    adminEmail, adminPhone,
    adminName, adminPassword: hashedPassword,
  });

  await User.create({
    schoolId: school._id,
    name: adminName,
    email: adminEmail,
    password: hashedPassword,
    phone: adminPhone,
    role: 'school_admin',
    isActive: true,
  });

  await Log.create({
    adminId: req.admin.id,
    action: 'school_created',
    details: `School created: ${name} | Admin: ${adminName} (${adminEmail})`,
    ip: req.ip,
  });

  const settings = await Setting.findOne().lean();
  await sendEmail(adminEmail, 'schoolCreated', {
    schoolName: name, adminName, email: adminEmail, password: adminPassword,
    loginUrl: `${process.env.CLIENT_URL}/login`,
  }, settings);

  if (adminPhone) {
    await sendSMS(adminPhone, 'schoolCreated', {
      schoolName: name, loginUrl: `${process.env.CLIENT_URL}/login`,
    });
  }

  logger.info(`🏫 School created: ${name} | Admin: ${adminName}`);
  return success(res, { school }, 'School and admin created successfully', 201);
});

const getSchools = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const { search, status, country } = req.query;

  const filter = {};
  if (search) filter.name = { $regex: search, $options: 'i' };
  if (status === 'active') filter.isActive = true;
  if (status === 'inactive') filter.isActive = false;
  if (country) filter.country = country;

  const schools = await School.find(filter)
    .select('-adminPassword')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();  // 🆕 plain objects for adding counts

  // 🆕 Get student & staff counts for each school
  const Student = require('../../models/client/Student');
  const User = require('../../models/client/User');

  const schoolsWithCounts = await Promise.all(schools.map(async (school) => {
    const studentCount = await Student.countDocuments({ schoolId: school._id, isActive: true });
    const staffCount = await User.countDocuments({ schoolId: school._id, isActive: true });
    return { ...school, studentCount, staffCount };
  }));

  const total = await School.countDocuments(filter);
  return paginated(res, schoolsWithCounts, total, page, limit, 'Schools fetched');
});

const getSchool = asyncHandler(async (req, res) => {
  const school = await School.findById(req.params.id).select('-adminPassword').lean();
  if (!school) return error(res, 'School not found', 404);

  // 🆕 Get counts
  const Student = require('../../models/client/Student');
  const User = require('../../models/client/User');

  const studentCount = await Student.countDocuments({ schoolId: school._id, isActive: true });
  const staffCount = await User.countDocuments({ schoolId: school._id, isActive: true });

  return success(res, { ...school, studentCount, staffCount });
});

const updateSchool = asyncHandler(async (req, res) => {
  const { adminPassword, ...updateData } = req.body;
  if (adminPassword) updateData.adminPassword = await hashPassword(adminPassword);

  const school = await School.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true }).select('-adminPassword');
  if (!school) return error(res, 'School not found', 404);

  if (updateData.adminName || updateData.adminEmail || adminPassword) {
    const updateUser = {};
    if (updateData.adminName) updateUser.name = updateData.adminName;
    if (updateData.adminEmail) updateUser.email = updateData.adminEmail;
    if (adminPassword) updateUser.password = await hashPassword(adminPassword);
    await User.findOneAndUpdate({ schoolId: school._id, role: 'school_admin' }, updateUser);
  }

  await Log.create({ adminId: req.admin.id, action: 'school_updated', details: `School updated: ${school.name}`, ip: req.ip });
  return success(res, school, 'School updated');
});

const suspendSchool = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const school = await School.findById(req.params.id);
  if (!school) return error(res, 'School not found', 404);
  if (!school.isActive) return error(res, 'School is already suspended', 400);

  school.isActive = false;
  school.suspensionReason = reason || 'No reason provided';
  school.suspendedAt = new Date();
  school.suspendedBy = req.admin.id;
  await school.save();

  await User.updateMany({ schoolId: school._id }, { isActive: false });

  const settings = await Setting.findOne().lean();
  await sendEmail(school.adminEmail, 'schoolSuspended', {
    schoolName: school.name, adminName: school.adminName, reason: school.suspensionReason,
  }, settings);

  if (school.adminPhone) {
    await sendSMS(school.adminPhone, 'schoolSuspended', {
      schoolName: school.name, reason: school.suspensionReason,
    });
  }

  await Log.create({ adminId: req.admin.id, action: 'school_suspended', details: `School suspended: ${school.name}`, ip: req.ip });
  logger.warn(`🚫 School suspended: ${school.name}`);
  return success(res, school, 'School suspended');
});

const reactivateSchool = asyncHandler(async (req, res) => {
  const school = await School.findById(req.params.id);
  if (!school) return error(res, 'School not found', 404);
  if (school.isActive) return error(res, 'School is already active', 400);

  school.isActive = true;
  school.suspensionReason = null;
  school.suspendedAt = null;
  school.suspendedBy = null;
  await school.save();

  await User.findOneAndUpdate({ schoolId: school._id, role: 'school_admin' }, { isActive: true });

  const settings = await Setting.findOne().lean();
  await sendEmail(school.adminEmail, 'schoolReactivated', {
    schoolName: school.name, adminName: school.adminName, loginUrl: `${process.env.CLIENT_URL}/login`,
  }, settings);

  if (school.adminPhone) {
    await sendSMS(school.adminPhone, 'schoolReactivated', {
      schoolName: school.name, loginUrl: `${process.env.CLIENT_URL}/login`,
    });
  }

  await Log.create({ adminId: req.admin.id, action: 'school_reactivated', details: `School reactivated: ${school.name}`, ip: req.ip });
  logger.info(`✅ School reactivated: ${school.name}`);
  return success(res, school, 'School reactivated');
});

const deleteSchool = asyncHandler(async (req, res) => {
  const school = await School.findById(req.params.id);
  if (!school) return error(res, 'School not found', 404);

  await User.deleteMany({ schoolId: school._id });
  await School.findByIdAndDelete(req.params.id);

  await Log.create({ adminId: req.admin.id, action: 'school_deleted', details: `School deleted: ${school.name}`, ip: req.ip });
  return success(res, null, 'School deleted');
});

module.exports = { 
  createSchool, getSchools, getSchool, updateSchool, 
  suspendSchool, reactivateSchool, deleteSchool,
  getCountries, getCounties, getConstituencies, getWards
};