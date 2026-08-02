const express = require('express');
const router = express.Router();
const { checkHealth, getHealthHistory } = require('../../controllers/admin/healthController');
const adminAuth = require('../../middleware/admin/adminAuth');

router.use(adminAuth);

router.get('/', checkHealth);
router.get('/history', getHealthHistory);

module.exports = router;