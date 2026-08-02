const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../../controllers/admin/settingController');
const adminAuth = require('../../middleware/admin/adminAuth');

router.use(adminAuth);

router.get('/', getSettings);
router.put('/', updateSettings);

module.exports = router;