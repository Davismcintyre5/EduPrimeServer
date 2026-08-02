const express = require('express');
const router = express.Router();
const { login, forgotPassword, resetPassword, getMe, refreshToken } = require('../../controllers/client/authController');
const auth = require('../../middleware/client/auth');
const { authLimiter } = require('../../middleware/global/rateLimiter');

router.post('/login', authLimiter, login);           // No x-school-id needed
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/refresh', refreshToken);
router.get('/me', auth, getMe);                      // Uses token's schoolId

module.exports = router;