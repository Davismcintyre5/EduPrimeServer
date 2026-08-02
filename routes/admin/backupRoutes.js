const express = require('express');
const router = express.Router();
const {
  getBackups,
  getBackupSettings,
  updateBackupSettings,
  createNow,
  uploadBackup,
  restoreBackup,
  downloadBackup,
  emailBackup,
  deleteBackup,
} = require('../../controllers/admin/backupController');
const adminAuth = require('../../middleware/admin/adminAuth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/temp/' });

router.use(adminAuth);

router.get('/', getBackups);
router.get('/settings', getBackupSettings);
router.put('/settings', updateBackupSettings);
router.post('/create', createNow);
router.post('/upload', upload.single('backup'), uploadBackup);
router.post('/:id/restore', restoreBackup);
router.get('/:id/download', downloadBackup);
router.post('/:id/email', emailBackup);
router.delete('/:id', deleteBackup);

module.exports = router;