const express = require('express');
const router = express.Router();
const { getPendingSchools, getPendingSchool, approveSchool, rejectSchool } = require('../../controllers/admin/pendingSchoolController');
const adminAuth = require('../../middleware/admin/adminAuth');

router.use(adminAuth);

router.get('/', getPendingSchools);
router.get('/:id', getPendingSchool);
router.patch('/:id/approve', approveSchool);
router.patch('/:id/reject', rejectSchool);

module.exports = router;