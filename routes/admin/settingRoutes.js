const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, getLandingSettings, updateLandingSettings, getChatSettings, updateChatSettings } = require('../../controllers/admin/settingController');
const adminAuth = require('../../middleware/admin/adminAuth');

router.use(adminAuth);

router.get('/', getSettings);
router.put('/', updateSettings);
router.get('/landing', getLandingSettings);
router.put('/landing', updateLandingSettings);
router.get('/chat', getChatSettings);
router.put('/chat', updateChatSettings);

module.exports = router;