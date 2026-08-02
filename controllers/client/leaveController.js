const Leave = require('../../models/client/Leave');
const AuditLog = require('../../models/client/Log');
const { success, error, paginated } = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const paginate = require('../../utils/pagination');
const logger = require('../../utils/logger');

const getLeaves = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = { schoolId: req.schoolId };
  if (req.query.status) filter.status = req.query.status;
  if (req.user.role === 'teacher') filter.applicantId = req.user.id;

  const leaves = await Leave.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('reviewedBy', 'name')
    .lean();

  // Manually populate applicant name
  const enriched = await Promise.all(leaves.map(async (l) => {
    let applicantName = 'Unknown';
    if (l.applicantType === 'student') {
      const Student = require('../../models/client/Student');
      const s = await Student.findById(l.applicantId).select('firstName lastName');
      if (s) applicantName = `${s.firstName} ${s.lastName}`;
    } else {
      const User = require('../../models/client/User');
      const u = await User.findById(l.applicantId).select('name');
      if (u) applicantName = u.name;
    }
    return { ...l, applicantName };
  }));

  const total = await Leave.countDocuments(filter);
  return paginated(res, enriched, total, page, limit, 'Leaves fetched');
});

const applyLeave = asyncHandler(async (req, res) => {
  const { applicantType, startDate, endDate, reason, applicantId } = req.body;
  if (!startDate || !endDate || !reason) return error(res, 'Start date, end date and reason required', 400);

  const type = applicantType || (req.user.role === 'student' ? 'student' : 'staff');
  
  // For student leave, applicantId is required
  if (type === 'student' && !applicantId) {
    return error(res, 'Please select a student', 400);
  }

  const actualApplicantId = type === 'student' ? applicantId : req.user.id;

  const leave = await Leave.create({
    schoolId: req.schoolId,
    applicantId: actualApplicantId,
    applicantType: type,
    startDate, endDate, reason,
    status: 'pending',
  });

  await AuditLog.create({ schoolId: req.schoolId, userId: req.user.id, action: 'leave_applied', details: `${type} leave: ${startDate} to ${endDate}`, ip: req.ip });
  return success(res, leave, 'Leave applied', 201);
});

const deleteLeave = asyncHandler(async (req, res) => {
  await Leave.findOneAndDelete({ _id: req.params.id, schoolId: req.schoolId });
  return success(res, null, 'Leave deleted');
});

// PATCH /api/school/leave/:id
const reviewLeave = asyncHandler(async (req, res) => {
  if (!['school_admin', 'principal', 'deputy_principal'].includes(req.user.role)) return error(res, 'Access denied', 403);
  const { status } = req.body;
  const leave = await Leave.findOneAndUpdate({ _id: req.params.id, schoolId: req.schoolId }, { status, reviewedBy: req.user.id }, { new: true });
  if (!leave) return error(res, 'Not found', 404);
  await AuditLog.create({ schoolId: req.schoolId, userId: req.user.id, action: 'leave_reviewed', details: `${status}`, ip: req.ip });
  return success(res, leave, `Leave ${status}`);
});

// GET /api/school/leave/stats
const getLeaveStats = asyncHandler(async (req, res) => {
  const [pending, approved, rejected] = await Promise.all([
    Leave.countDocuments({ schoolId: req.schoolId, status: 'pending' }),
    Leave.countDocuments({ schoolId: req.schoolId, status: 'approved' }),
    Leave.countDocuments({ schoolId: req.schoolId, status: 'rejected' }),
  ]);
  return success(res, { pending, approved, rejected, total: pending + approved + rejected });
});

module.exports = { getLeaves, applyLeave,deleteLeave, reviewLeave, getLeaveStats };