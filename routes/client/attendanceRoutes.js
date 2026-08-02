const express = require('express');
const router = express.Router();
const auth = require('../../middleware/client/auth');
const tenant = require('../../middleware/client/tenant');
const {
  getTodayAttendance,
  markAttendance,
  getAttendanceReport,
  getStudentAttendance,
} = require('../../controllers/client/attendanceController');

router.use(auth, tenant);

router.get('/today', getTodayAttendance);
router.post('/mark', markAttendance);
router.get('/report', getAttendanceReport);
router.get('/student/:id', getStudentAttendance);

module.exports = router;