const Backup = require('../../models/admin/Backup');
const Setting = require('../../models/admin/Setting');
const Log = require('../../models/admin/Log');
const { success, error, paginated } = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const paginate = require('../../utils/pagination');
const { sendEmail } = require('../../services/emailService');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const logger = require('../../utils/logger');

const backupDir = path.join(__dirname, '..', '..', 'backups');

// Ensure backup directory exists
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// ─── Helper: Create backup JSON ───
const createBackupJSON = async () => {
  const mongoose = require('mongoose');
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();

  const excludedCollections = ['logs', 'auditlogs', 'health', 'backups'];

  const backup = {
    appName: process.env.APP_NAME || 'EduPrime',
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    collections: {},
  };

  for (const col of collections) {
    if (excludedCollections.includes(col.name)) continue;

    const data = await db.collection(col.name).find({}).toArray();
    backup.collections[col.name] = data.map((doc) => {
      const obj = { ...doc };
      if (obj._id) obj._id = obj._id.toString();
      if (obj.schoolId) obj.schoolId = obj.schoolId.toString();
      if (obj.createdBy) obj.createdBy = obj.createdBy?.toString();
      if (obj.adminId) obj.adminId = obj.adminId?.toString();
      if (obj.reviewedBy) obj.reviewedBy = obj.reviewedBy?.toString();
      if (obj.handledBy) obj.handledBy = obj.handledBy?.toString();
      if (obj.suspendedBy) obj.suspendedBy = obj.suspendedBy?.toString();
      return obj;
    });
  }

  return backup;
};

// ─── GET /api/admin/backups ───
const getBackups = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);

  const backups = await Backup.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('createdBy', 'name email');

  const total = await Backup.countDocuments();

  return paginated(res, backups, total, page, limit, 'Backups fetched');
});

// ─── GET /api/admin/backups/settings ───
const getBackupSettings = asyncHandler(async (req, res) => {
  const settings = await Setting.find({
    key: { $in: ['backup_auto_enabled', 'backup_frequency', 'backup_time', 'backup_email_on_auto', 'backup_email_recipient', 'backup_retention'] }
  });

  const result = {};
  settings.forEach((s) => { result[s.key] = s.value; });

  return success(res, result);
});

// ─── PUT /api/admin/backups/settings ───
const updateBackupSettings = asyncHandler(async (req, res) => {
  const updates = req.body;

  for (const [key, value] of Object.entries(updates)) {
    await Setting.findOneAndUpdate({ key }, { value }, { upsert: true });
  }

  await Log.create({
    adminId: req.admin.id,
    action: 'backup_settings_updated',
    details: `Backup settings updated: ${Object.keys(updates).join(', ')}`,
    ip: req.ip,
  });

  logger.info('⚙️  Backup settings updated');

  return success(res, null, 'Backup settings updated');
});

// ─── POST /api/admin/backups/create ───
const createNow = asyncHandler(async (req, res) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `eduprime_backup_${timestamp}.json`;
  const filePath = path.join(backupDir, fileName);

  try {
    const backupData = await createBackupJSON();
    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));

    const stats = fs.statSync(filePath);

    const backup = await Backup.create({
      fileName,
      filePath,
      size: stats.size,
      type: 'manual',
      createdBy: req.admin.id,
    });

    await Log.create({
      adminId: req.admin.id,
      action: 'backup_created',
      details: `Manual backup created: ${fileName}`,
      ip: req.ip,
    });

    logger.info(`💾 Backup created: ${fileName}`);

    return success(res, backup, 'Backup created successfully', 201);
  } catch (err) {
    logger.error(`❌ Backup creation failed: ${err.message}`);
    return error(res, 'Backup creation failed', 500);
  }
});

// ─── POST /api/admin/backups/upload ───
const uploadBackup = asyncHandler(async (req, res) => {
  if (!req.file) {
    return error(res, 'Please upload a .json backup file', 400);
  }

  const fileName = `eduprime_backup_uploaded_${Date.now()}.json`;
  const filePath = path.join(backupDir, fileName);

  fs.copyFileSync(req.file.path, filePath);
  fs.unlinkSync(req.file.path);

  const stats = fs.statSync(filePath);

  const backup = await Backup.create({
    fileName,
    filePath,
    size: stats.size,
    type: 'uploaded',
    createdBy: req.admin.id,
  });

  await Log.create({
    adminId: req.admin.id,
    action: 'backup_uploaded',
    details: `Backup uploaded: ${fileName}`,
    ip: req.ip,
  });

  logger.info(`📤 Backup uploaded: ${fileName}`);

  return success(res, backup, 'Backup uploaded successfully', 201);
});

// ─── POST /api/admin/backups/:id/restore ───
const restoreBackup = asyncHandler(async (req, res) => {
  const backup = await Backup.findById(req.params.id);
  if (!backup) {
    return error(res, 'Backup not found', 404);
  }

  if (!fs.existsSync(backup.filePath)) {
    return error(res, 'Backup file not found on disk', 404);
  }

  try {
    const raw = fs.readFileSync(backup.filePath, 'utf-8');
    const data = JSON.parse(raw);

    const mongoose = require('mongoose');
    const db = mongoose.connection.db;

    // Drop existing collections
    const collections = await db.listCollections().toArray();
    for (const col of collections) {
      await db.dropCollection(col.name);
    }

    // Restore collections
    for (const [colName, documents] of Object.entries(data.collections)) {
      if (documents.length > 0) {
        const docs = documents.map((doc) => {
          if (doc._id) doc._id = new mongoose.Types.ObjectId(doc._id);
          return doc;
        });
        await db.collection(colName).insertMany(docs);
      }
    }

    await Log.create({
      adminId: req.admin.id,
      action: 'backup_restored',
      details: `Backup restored: ${backup.fileName}`,
      ip: req.ip,
    });

    logger.info(`🔄 Backup restored: ${backup.fileName}`);

    return success(res, null, 'Database restored successfully. Server restart recommended.');
  } catch (err) {
    logger.error(`❌ Restore failed: ${err.message}`);
    return error(res, 'Restore failed. File may be corrupted.', 500);
  }
});

// ─── GET /api/admin/backups/:id/download ───
const downloadBackup = asyncHandler(async (req, res) => {
  const backup = await Backup.findById(req.params.id);
  if (!backup) {
    return error(res, 'Backup not found', 404);
  }

  if (!fs.existsSync(backup.filePath)) {
    return error(res, 'Backup file not found on disk', 404);
  }

  res.download(backup.filePath, backup.fileName);
});

// POST /api/admin/backups/:id/email
const emailBackup = asyncHandler(async (req, res) => {
  const backup = await Backup.findById(req.params.id);
  if (!backup) return error(res, 'Backup not found', 404);

  const { email } = req.body;
  if (!email) return error(res, 'Email address is required', 400);
  if (!fs.existsSync(backup.filePath)) return error(res, 'Backup file not found on disk', 404);

  const settings = await Setting.findOne().lean();

  // Read backup content
  const content = fs.readFileSync(backup.filePath, 'utf-8');

  // Use settings (platform level), not school
  await sendEmail(email, 'announcement', {
    title: `EduPrime Backup — ${backup.fileName}`,
    content: `Backup file: ${backup.fileName}<br><br><pre>${content.substring(0, 500)}...</pre>`,
  }, settings);  // ✅ Pass settings, not school

  backup.emailedTo = email;
  await backup.save();

  await Log.create({
    adminId: req.admin.id,
    action: 'backup_emailed',
    details: `Backup ${backup.fileName} emailed to ${email}`,
    ip: req.ip,
  });

  logger.info(`📧 Backup emailed: ${backup.fileName} → ${email}`);
  return success(res, null, `Backup sent to ${email}`);
});

// ─── DELETE /api/admin/backups/:id ───
const deleteBackup = asyncHandler(async (req, res) => {
  const backup = await Backup.findById(req.params.id);
  if (!backup) {
    return error(res, 'Backup not found', 404);
  }

  if (fs.existsSync(backup.filePath)) {
    fs.unlinkSync(backup.filePath);
  }

  await Backup.findByIdAndDelete(req.params.id);

  await Log.create({
    adminId: req.admin.id,
    action: 'backup_deleted',
    details: `Backup deleted: ${backup.fileName}`,
    ip: req.ip,
  });

  logger.info(`🗑️  Backup deleted: ${backup.fileName}`);

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