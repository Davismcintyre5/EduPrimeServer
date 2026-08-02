const express = require('express');
const router = express.Router();
const auth = require('../../middleware/client/auth');
const tenant = require('../../middleware/client/tenant');
const { getLeaves, applyLeave, reviewLeave,deleteLeave, getLeaveStats } = require('../../controllers/client/leaveController');

router.use(auth, tenant);
router.get('/', getLeaves);
router.post('/', applyLeave);
router.patch('/:id', reviewLeave);
router.get('/stats', getLeaveStats);
router.delete('/:id', deleteLeave);

module.exports = router;