const cron = require('node-cron');
const logger = require('../utils/logger');
const { runFeeReminders } = require('./feeReminderScheduler');
const { runBackup } = require('./backupScheduler');

const startAllSchedulers = () => {
  logger.info('⏰ Starting schedulers...');

  // Fee reminders — daily at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    logger.info('🔔 Running fee reminder scheduler...');
    await runFeeReminders();
  });

  // Database backup — daily at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    logger.info('💾 Running backup scheduler...');
    await runBackup();
  });

  logger.info('✅ Schedulers started');
};

module.exports = { startAllSchedulers };