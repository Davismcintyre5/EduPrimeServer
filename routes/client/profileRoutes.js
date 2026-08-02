const express = require('express');
const router = express.Router();
const auth = require('../../middleware/client/auth');
const tenant = require('../../middleware/client/tenant');
const { getProfile, updateProfile, changePassword, getSchoolInfo, updateSchoolInfo } = require('../../controllers/client/settingController');

// User profile
router.get('/profile', auth, tenant, getProfile);
router.put('/profile', auth, tenant, updateProfile);
router.put('/change-password', auth, tenant, changePassword);

// School info (separate from profile)
router.get('/school-info', auth, tenant, getSchoolInfo);
router.put('/school-info', auth, tenant, updateSchoolInfo);

module.exports = router;