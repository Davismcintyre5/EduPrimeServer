const express = require('express');
const router = express.Router();
const auth = require('../../middleware/client/auth');
const tenant = require('../../middleware/client/tenant');
const multer = require('multer');
const upload = multer({ dest: 'uploads/temp/' });
const {
  getBackups, getBackupSettings, updateBackupSettings,
  createNow, uploadBackup, restoreBackup, downloadBackup, emailBackup, deleteBackup,
} = require('../../controllers/client/backupController');

router.use(auth, tenant);

router.get('/backups', getBackups);
router.get('/backups/settings', getBackupSettings);
router.put('/backups/settings', updateBackupSettings);
router.post('/backups/create', createNow);
router.post('/backups/upload', upload.single('backup'), uploadBackup);
router.post('/backups/:id/restore', restoreBackup);
router.get('/backups/:id/download', downloadBackup);
router.post('/backups/:id/email', emailBackup);
router.delete('/backups/:id', deleteBackup);

module.exports = router;