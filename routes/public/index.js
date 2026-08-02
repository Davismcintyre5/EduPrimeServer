const express = require('express');
const router = express.Router();

router.use('/', require('./publicRoutes'));
router.use('/portal', require('./portalRoutes')); 
module.exports = router;