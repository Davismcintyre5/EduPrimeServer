const SchoolBackup = require('../../models/client/Backup');
const AuditLog = require('../../models/client/Log');
const { success, error, paginated } = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const paginate = require('../../utils/pagination');
const { sendEmail } = require('../../services/emailService');
const path = require('path');
const fs = require('fs');
const logger = require('../../utils/logger');

const backupDir = path.join(__dirname, '..', '..', 'backups');
if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

// Helper: Create backup JSON
const createBackupJSON = async (schoolId) => {
  const mongoose = require('mongoose');
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  const schoolObjectId = new mongoose.Types.ObjectId(schoolId);

  const schoolCollections = [
    'students', 'users', 'parents', 'attendances', 'marks', 'exams',
    'reportcards', 'feetransactions', 'feestructures', 'payments',
    'expenses', 'incomes', 'accounts', 'budgets', 'books', 'booktransactions',
    'inventoryitems', 'purchaseorders', 'homeworks', 'homeworksubmissions',
    'announcements', 'timetables', 'subjects', 'grades', 'sections',
    'leaves', 'salarystructures', 'payrolls', 'casualstaffs',
    'schoolsettings',
  ];

  const excludedCollections = ['auditlogs', 'logs', 'schoolbackups'];

  const backup = {
    appName: process.env.APP_NAME || 'EduPrime',
    version: '1.0.0',
    schoolId: schoolId.toString(),
    createdAt: new Date().toISOString(),
    collections: {},
  };

  for (const col of collections) {
    if (!schoolCollections.includes(col.name)) continue;
    if (excludedCollections.includes(col.name)) continue;

    const data = await db.collection(col.name).find({ schoolId: schoolObjectId }).toArray();
    backup.collections[col.name] = data.map((doc) => {
      const obj = { ...doc };
      if (obj._id) obj._id = obj._id.toString();
      if (obj.schoolId) obj.schoolId = obj.schoolId.toString();
      if (obj.studentId) obj.studentId = obj.studentId?.toString();
      if (obj.userId) obj.userId = obj.userId?.toString();
      if (obj.staffId) obj.staffId = obj.staffId?.toString();
      if (obj.gradeId) obj.gradeId = obj.gradeId?.toString();
      if (obj.sectionId) obj.sectionId = obj.sectionId?.toString();
      if (obj.subjectId) obj.subjectId = obj.subjectId?.toString();
      if (obj.examId) obj.examId = obj.examId?.toString();
      if (obj.parentId) obj.parentId = obj.parentId?.toString();
      if (obj.feeStructureId) obj.feeStructureId = obj.feeStructureId?.toString();
      if (obj.invoiceId) obj.invoiceId = obj.invoiceId?.toString();
      if (obj.accountId) obj.accountId = obj.accountId?.toString();
      if (obj.bookId) obj.bookId = obj.bookId?.toString();
      if (obj.borrowerId) obj.borrowerId = obj.borrowerId?.toString();
      if (obj.recordedBy) obj.recordedBy = obj.recordedBy?.toString();
      if (obj.generatedBy) obj.generatedBy = obj.generatedBy?.toString();
      if (obj.reviewedBy) obj.reviewedBy = obj.reviewedBy?.toString();
      if (obj.markedBy) obj.markedBy = obj.markedBy?.toString();
      if (obj.enteredBy) obj.enteredBy = obj.enteredBy?.toString();
      if (obj.assignedBy) obj.assignedBy = obj.assignedBy?.toString();
      if (obj.postedBy) obj.postedBy = obj.postedBy?.toString();
      if (obj.issuedBy) obj.issuedBy = obj.issuedBy?.toString();
      if (obj.requestedBy) obj.requestedBy = obj.requestedBy?.toString();
      if (obj.approvedBy) obj.approvedBy = obj.approvedBy?.toString();
      if (obj.casualStaffId) obj.casualStaffId = obj.casualStaffId?.toString();
      return obj;
    });
  }

  return backup;
};

// GET /api/school/backups
const getBackups = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const backups = await SchoolBackup.find({ schoolId: req.schoolId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('createdBy', 'name email');

  const total = await SchoolBackup.countDocuments({ schoolId: req.schoolId });
  return paginated(res, backups, total, page, limit, 'Backups fetched');
});

// GET /api/school/backups/settings
const getBackupSettings = asyncHandler(async (req, res) => {
  const SchoolSetting = require('../../models/client/Setting');
  const settings = await SchoolSetting.find({
    schoolId: req.schoolId,
    key: { $in: ['backup_auto_enabled', 'backup_frequency', 'backup_email_on_auto', 'backup_email_recipient', 'backup_retention'] }
  });
  const result = {};
  settings.forEach((s) => { result[s.key] = s.value; });
  return success(res, result);
});

// PUT /api/school/backups/settings
const updateBackupSettings = asyncHandler(async (req, res) => {
  const SchoolSetting = require('../../models/client/Setting');
  const updates = req.body;
  for (const [key, value] of Object.entries(updates)) {
    await SchoolSetting.findOneAndUpdate(
      { schoolId: req.schoolId, key },
      { value },
      { upsert: true, new: true }
    );
  }
  await AuditLog.create({
    schoolId: req.schoolId, userId: req.user.id,
    action: 'backup_settings_updated',
    details: Object.keys(updates).join(', '), ip: req.ip,
  });
  logger.info('⚙️ Backup settings updated');
  return success(res, null, 'Backup settings updated');
});

// POST /api/school/backups/create
const createNow = asyncHandler(async (req, res) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `school_backup_${timestamp}.json`;
  const filePath = path.join(backupDir, fileName);

  try {
    const backupData = await createBackupJSON(req.schoolId);
    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));
    const stats = fs.statSync(filePath);

    const backup = await SchoolBackup.create({
      schoolId: req.schoolId,
      fileName,
      filePath,
      size: stats.size,
      type: 'manual',
      createdBy: req.user.id,
    });

    await AuditLog.create({
      schoolId: req.schoolId, userId: req.user.id,
      action: 'backup_created', details: fileName, ip: req.ip,
    });

    logger.info(`💾 School backup created: ${fileName}`);
    return success(res, backup, 'Backup created successfully', 201);
  } catch (err) {
    logger.error(`Backup creation failed: ${err.message}`);
    return error(res, 'Backup creation failed', 500);
  }
});

// POST /api/school/backups/upload
const uploadBackup = asyncHandler(async (req, res) => {
  if (!req.file) return error(res, 'Please upload a .json backup file', 400);

  const fileName = `school_backup_uploaded_${Date.now()}.json`;
  const filePath = path.join(backupDir, fileName);
  fs.copyFileSync(req.file.path, filePath);
  fs.unlinkSync(req.file.path);

  const stats = fs.statSync(filePath);
  const backup = await SchoolBackup.create({
    schoolId: req.schoolId, fileName, filePath,
    size: stats.size, type: 'uploaded', createdBy: req.user.id,
  });

  await AuditLog.create({
    schoolId: req.schoolId, userId: req.user.id,
    action: 'backup_uploaded', details: fileName, ip: req.ip,
  });

  logger.info(`📤 School backup uploaded: ${fileName}`);
  return success(res, backup, 'Backup uploaded', 201);
});

// POST /api/school/backups/:id/restore
const restoreBackup = asyncHandler(async (req, res) => {
  const backup = await SchoolBackup.findOne({ _id: req.params.id, schoolId: req.schoolId });
  if (!backup) return error(res, 'Backup not found', 404);
  if (!fs.existsSync(backup.filePath)) return error(res, 'Backup file not found on disk', 404);

  try {
    const raw = fs.readFileSync(backup.filePath, 'utf-8');
    const data = JSON.parse(raw);
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;

    // Drop school-specific data
    const collections = await db.listCollections().toArray();
    for (const col of collections) {
      await db.collection(col.name).deleteMany({ schoolId: req.schoolId.toString() });
    }

    // Restore
    for (const [colName, documents] of Object.entries(data.collections)) {
      if (documents.length > 0) {
        const docs = documents.map((doc) => {
          if (doc._id) doc._id = new mongoose.Types.ObjectId(doc._id);
          if (doc.schoolId) doc.schoolId = new mongoose.Types.ObjectId(doc.schoolId);
          return doc;
        });
        await db.collection(colName).insertMany(docs);
      }
    }

    await AuditLog.create({
      schoolId: req.schoolId, userId: req.user.id,
      action: 'backup_restored', details: backup.fileName, ip: req.ip,
    });

    logger.info(`🔄 School backup restored: ${backup.fileName}`);
    return success(res, null, 'Data restored successfully');
  } catch (err) {
    logger.error(`Restore failed: ${err.message}`);
    return error(res, 'Restore failed. File may be corrupted.', 500);
  }
});

// GET /api/school/backups/:id/download
const downloadBackup = asyncHandler(async (req, res) => {
  const backup = await SchoolBackup.findOne({ _id: req.params.id, schoolId: req.schoolId });
  if (!backup || !fs.existsSync(backup.filePath)) return error(res, 'Backup not found', 404);
  res.download(backup.filePath, backup.fileName);
});

// POST /api/school/backups/:id/email
const emailBackup = asyncHandler(async (req, res) => {
  const backup = await SchoolBackup.findOne({ _id: req.params.id, schoolId: req.schoolId });
  if (!backup) return error(res, 'Backup not found', 404);
  const { email } = req.body;
  if (!email) return error(res, 'Email address is required', 400);
  if (!fs.existsSync(backup.filePath)) return error(res, 'Backup file not found on disk', 404);

  const School = require('../../models/admin/School');
  const school = await School.findById(req.schoolId).lean();
  const content = fs.readFileSync(backup.filePath, 'utf-8');

  await sendEmail(email, 'announcement', {
    title: `School Backup — ${backup.fileName}`,
    content: `Backup file: ${backup.fileName}<br><br><pre>${content.substring(0, 500)}...</pre>`,
    attachment: backup.filePath,
  }, school);

  backup.emailedTo = email;
  await backup.save();

  await AuditLog.create({
    schoolId: req.schoolId, userId: req.user.id,
    action: 'backup_emailed', details: `${backup.fileName} → ${email}`, ip: req.ip,
  });

  return success(res, null, `Backup sent to ${email}`);
});

// DELETE /api/school/backups/:id
const deleteBackup = asyncHandler(async (req, res) => {
  const backup = await SchoolBackup.findOne({ _id: req.params.id, schoolId: req.schoolId });
  if (!backup) return error(res, 'Backup not found', 404);
  if (fs.existsSync(backup.filePath)) fs.unlinkSync(backup.filePath);
  await SchoolBackup.findByIdAndDelete(req.params.id);

  await AuditLog.create({
    schoolId: req.schoolId, userId: req.user.id,
    action: 'backup_deleted', details: backup.fileName, ip: req.ip,
  });

  return success(res, null, 'Backup deleted');
});

module.exports = {
  getBackups,
  getBackupSettings,
  updateBackupSettings,
  createNow,
  uploadBackup,
  restoreBackup,
  downloadBackup,
  emailBackup,
  deleteBackup,
};