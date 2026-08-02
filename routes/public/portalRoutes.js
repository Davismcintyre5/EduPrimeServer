const express = require('express');
const router = express.Router();
const { register, login, forgotPassword, resetPassword, changePassword, getDashboard, getStudentDetail } = require('../../controllers/public/portalController');
const auth = require('../../middleware/client/auth');
const { authLimiter } = require('../../middleware/global/rateLimiter');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password', auth, changePassword);
router.get('/dashboard', auth, getDashboard);
router.get('/student/:studentId', auth, getStudentDetail);

module.exports = router;