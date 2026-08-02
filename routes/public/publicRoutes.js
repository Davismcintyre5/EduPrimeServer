const express = require('express');
const router = express.Router();
const {
  getPublicSettings,
  getPublicLegals,
  getSupportInfo,
  getCountries,
  getCounties,
  getConstituencies,
  getWards,
  registerSchool,
  checkRegistrationStatus,
  forgotPassword,
  resetPassword ,
} = require('../../controllers/public/publicController');
const { authLimiter } = require('../../middleware/global/rateLimiter');

// Public info
router.get('/settings', getPublicSettings);
router.get('/legals', getPublicLegals);
router.get('/support', getSupportInfo);

// Reference data (dropdowns)
router.get('/countries', getCountries);
router.get('/counties', getCounties);
router.get('/constituencies', getConstituencies);
router.get('/wards', getWards);

// Self-registration
router.post('/register-school', authLimiter, registerSchool);
router.get('/check-registration/:id', checkRegistrationStatus);

router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;