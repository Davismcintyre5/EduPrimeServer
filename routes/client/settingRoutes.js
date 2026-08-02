const express = require('express');
const router = express.Router();
const auth = require('../../middleware/client/auth');
const tenant = require('../../middleware/client/tenant');
const { getSettings, updateSettings } = require('../../controllers/client/settingController');

router.get('/', auth, tenant, getSettings);
router.put('/', auth, tenant, updateSettings);

module.exports = router;