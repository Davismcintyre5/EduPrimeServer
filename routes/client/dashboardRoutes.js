const express = require('express');
const router = express.Router();
const { getStats, getRecentActivities, getAnnouncements } = require('../../controllers/client/dashboardController');
const auth = require('../../middleware/client/auth');
const tenant = require('../../middleware/client/tenant');

router.use(auth, tenant);

router.get('/stats', getStats);
router.get('/activities', getRecentActivities);
router.get('/announcements', getAnnouncements);

module.exports = router;