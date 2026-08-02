const express = require('express');
const router = express.Router();
const { login, forgotPassword, resetPassword, getMe, refreshToken } = require('../../controllers/admin/authController');
const adminAuth = require('../../middleware/admin/adminAuth');
const { authLimiter } = require('../../middleware/global/rateLimiter');

router.post('/login', authLimiter, login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/refresh', refreshToken);
router.get('/me', adminAuth, getMe);

module.exports = router;