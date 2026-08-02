const express = require('express');
const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/schools', require('./schoolRoutes'));
router.use('/pending-schools', require('./pendingSchoolRoutes'));
router.use('/backups', require('./backupRoutes'));
router.use('/settings', require('./settingRoutes'));
router.use('/logs', require('./logRoutes'));
router.use('/health', require('./healthRoutes'));
router.use('/support', require('./supportRoutes'));
router.use('/legals', require('./legalRoutes'));

module.exports = router;