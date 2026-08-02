const express = require('express');
const router = express.Router();
const auth = require('../../middleware/client/auth');
const tenant = require('../../middleware/client/tenant');
const { getStaff, getStaffMember, createStaff, updateStaff, toggleStaff, deleteStaff } = require('../../controllers/client/userController');

router.use(auth, tenant);

router.get('/staff', getStaff);
router.get('/staff/:id', getStaffMember);
router.post('/staff', createStaff);
router.put('/staff/:id', updateStaff);
router.patch('/staff/:id/toggle', toggleStaff);
router.delete('/staff/:id', deleteStaff);

module.exports = router;