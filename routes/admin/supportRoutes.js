const express = require('express');
const router = express.Router();
const { getContacts, markRead, getTickets, getTicket, updateTicket } = require('../../controllers/admin/supportController');
const adminAuth = require('../../middleware/admin/adminAuth');

router.use(adminAuth);

// Contacts — must be before /:id
router.get('/contacts', getContacts);
router.patch('/contacts/:id/read', markRead);

// Tickets
router.get('/', getTickets);
router.get('/:id', getTicket);
router.patch('/:id', updateTicket);

module.exports = router;