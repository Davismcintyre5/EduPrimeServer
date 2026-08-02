const Attendance = require('../../models/client/Attendance');
const Student = require('../../models/client/Student');
const AuditLog = require('../../models/client/Log');
const { success, error } = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const logger = require('../../utils/logger');

// GET /api/school/attendance/today?grade=&section=&date=
const getTodayAttendance = asyncHandler(async (req, res) => {
  const { grade, section, date } = req.query;
  
  const targetDate = date ? new Date(date) : new Date();
  const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);

  const studentFilter = { schoolId: req.schoolId, isActive: true };
  if (grade) studentFilter.grade = grade;
  if (section) studentFilter.section = section;

  const students = await Student.find(studentFilter).select('firstName lastName studentId grade section photo');
  const studentIds = students.map((s) => s._id);

  const attendanceRecords = await Attendance.find({
    schoolId: req.schoolId,
    studentId: { $in: studentIds },
    date: { $gte: startOfDay, $lt: endOfDay },
  });

  const result = students.map((student) => {
    const record = attendanceRecords.find((a) => a.studentId.toString() === student._id.toString());
    return {
      ...student.toObject(),
      status: record?.status || 'present',
      remark: record?.remark || '',
      markedAt: record?.createdAt || null,
      markedBy: record?.markedBy || null,
    };
  });

  const stats = {
    total: result.length,
    present: result.filter((s) => s.status === 'present').length,
    absent: result.filter((s) => s.status === 'absent').length,
    late: result.filter((s) => s.status === 'late').length,
  };

  return success(res, { students: result, stats });
});

// POST /api/school/attendance/mark
const markAttendance = asyncHandler(async (req, res) => {
  const { records, date } = req.body;
  if (!records || !Array.isArray(records)) return error(res, 'Records array required', 400);

  const targetDate = date ? new Date(date) : new Date();
  const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);

  const results = [];
  for (const record of records) {
    const { studentId, status, remark } = record;
    if (!studentId || !status) continue;

    const attendance = await Attendance.findOneAndUpdate(
      { schoolId: req.schoolId, studentId, date: { $gte: startOfDay, $lt: endOfDay } },
      { schoolId: req.schoolId, studentId, date: startOfDay, status, remark: remark || '', markedBy: req.user.id },
      { upsert: true, new: true }
    );
    results.push(attendance);
  }

  await AuditLog.create({
    schoolId: req.schoolId, userId: req.user.id,
    action: 'attendance_marked', details: `${results.length} students marked`, ip: req.ip,
  });

  logger.info(`✅ Attendance marked: ${results.length} students for ${startOfDay.toISOString().split('T')[0]}`);
  return success(res, { count: results.length }, 'Attendance marked');
});

// GET /api/school/attendance/report?grade=&section=&from=&to=
const getAttendanceReport = asyncHandler(async (req, res) => {
  const { grade, section, from, to } = req.query;

  const studentFilter = { schoolId: req.schoolId, isActive: true };
  if (grade) studentFilter.grade = grade;
  if (section) studentFilter.section = section;

  const students = await Student.find(studentFilter).select('firstName lastName studentId grade section');
  const studentIds = students.map((s) => s._id);

  const dateFilter = { schoolId: req.schoolId, studentId: { $in: studentIds } };
  if (from || to) {
    dateFilter.date = {};
    if (from) dateFilter.date.$gte = new Date(from);
    if (to) dateFilter.date.$lte = new Date(to);
  }

  const records = await Attendance.find(dateFilter);

  const summary = students.map((student) => {
    const studentRecords = records.filter((r) => r.studentId.toString() === student._id.toString());
    const present = studentRecords.filter((r) => r.status === 'present').length;
    const absent = studentRecords.filter((r) => r.status === 'absent').length;
    const late = studentRecords.filter((r) => r.status === 'late').length;
    const total = studentRecords.length;
    const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : 100;

    return { ...student.toObject(), present, absent, late, total, percentage };
  });

  return success(res, summary);
});

// GET /api/school/attendance/student/:id
const getStudentAttendance = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const filter = { schoolId: req.schoolId, studentId: req.params.id };
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  const records = await Attendance.find(filter).sort({ date: -1 });
  const present = records.filter((r) => r.status === 'present').length;
  const total = records.length;
  const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : 100;

  return success(res, {
    records,
    summary: { present, absent: records.filter((r) => r.status === 'absent').length, late: records.filter((r) => r.status === 'late').length, total, percentage },
  });
});

module.exports = { getTodayAttendance, markAttendance, getAttendanceReport, getStudentAttendance };