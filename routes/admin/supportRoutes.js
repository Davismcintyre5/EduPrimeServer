const express = require('express');
const router = express.Router();
const { getTickets, getTicket, updateTicket } = require('../../controllers/admin/supportController');
const adminAuth = require('../../middleware/admin/adminAuth');

router.use(adminAuth);

router.get('/', getTickets);
router.get('/:id', getTicket);
router.patch('/:id', updateTicket);

module.exports = router;