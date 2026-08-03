const express = require('express');
const router = express.Router();
const { sendMessage } = require('../../controllers/public/chatController');
const { authLimiter } = require('../../middleware/global/rateLimiter');

router.post('/send', authLimiter, sendMessage);

module.exports = router;