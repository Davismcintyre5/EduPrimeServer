const express = require('express');
const router = express.Router();
const auth = require('../../middleware/client/auth');
const tenant = require('../../middleware/client/tenant');
const { getLogs, clearLogs, downloadLogs } = require('../../controllers/client/logController');

router.get('/logs', auth, tenant, getLogs);
router.delete('/logs', auth, tenant, clearLogs);
router.get('/logs/download', auth, tenant, downloadLogs);

module.exports = router;