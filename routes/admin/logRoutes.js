const express = require('express');
const router = express.Router();
const { getLogs, clearLogs } = require('../../controllers/admin/logController');
const adminAuth = require('../../middleware/admin/adminAuth');

router.use(adminAuth);

router.get('/', getLogs);
router.delete('/', clearLogs);

module.exports = router;