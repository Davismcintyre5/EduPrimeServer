const express = require('express');
const router = express.Router();

router.use('/admin', require('./admin'));
router.use('/school', require('./client'));
router.use('/public', require('./public'));

module.exports = router;