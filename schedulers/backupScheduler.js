const Backup = require('../models/admin/Backup');
const Setting = require('../models/admin/Setting');
const { sendEmail } = require('../services/emailService');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

const backupDir = path.join(__dirname, '..', 'backups');

const createBackupJSON = async () => {
  const mongoose = require('mongoose');
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();

  const backup = {
    appName: process.env.APP_NAME || 'EduPrime',
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    collections: {},
  };

  for (const col of collections) {
    const data = await db.collection(col.name).find({}).toArray();
    backup.collections[col.name] = data.map((doc) => {
      const obj = { ...doc };
      if (obj._id) obj._id = obj._id.toString();
      return obj;
    });
  }

  return backup;
};

const runBackup = async () => {
  try {
    // Get settings
    const settings = await Setting.find({
      key: { $in: ['backup_auto_enabled', 'backup_email_on_auto', 'backup_email_recipient', 'backup_retention'] }
    });
    const config = {};
    settings.forEach((s) => { config[s.key] = s.value; });

    if (!config.backup_auto_enabled) {
      logger.info('⏭️  Auto backup disabled. Skipping.');
      return;
    }

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `eduprime_backup_auto_${timestamp}.json`;
    const filePath = path.join(backupDir, fileName);

    const backupData = await createBackupJSON();
    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));

    const stats = fs.statSync(filePath);

    const backup = await Backup.create({
      fileName,
      filePath,
      size: stats.size,
      type: 'auto',
    });

    logger.info(`💾 Auto backup created: ${fileName} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);

    // Email if enabled
    if (config.backup_email_on_auto && config.backup_email_recipient) {
      const allSettings = await Setting.findOne().lean();
      await sendEmail(config.backup_email_recipient, 'announcement', {
        title: `Auto Backup Complete — ${fileName}`,
        content: `Automated backup created on ${new Date().toISOString()}.<br>Size: ${(stats.size / 1024 / 1024).toFixed(2)}MB`,
      }, allSettings);
      backup.emailedTo = config.backup_email_recipient;
      await backup.save();
      logger.info(`📧 Backup emailed to: ${config.backup_email_recipient}`);
    }

    // Cleanup old backups
    const retention = config.backup_retention || 7;
    const oldBackups = await Backup.find({ type: 'auto' })
      .sort({ createdAt: -1 })
      .skip(retention);

    for (const old of oldBackups) {
      if (fs.existsSync(old.filePath)) {
        fs.unlinkSync(old.filePath);
      }
      await Backup.findByIdAndDelete(old._id);
    }

  } catch (err) {
    logger.error(`❌ Auto backup failed: ${err.message}`);
  }
};

module.exports = { runBackup };