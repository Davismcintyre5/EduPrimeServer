const Homework = require('../../models/client/Homework');
const HomeworkSubmission = require('../../models/client/HomeworkSubmission');
const Student = require('../../models/client/Student');
const Subject = require('../../models/client/Subject');
const AuditLog = require('../../models/client/Log');
const { success, error, paginated } = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const paginate = require('../../utils/pagination');
const logger = require('../../utils/logger');

// GET /api/school/homework
const getHomework = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = { schoolId: req.schoolId };
  if (req.query.subjectId) filter.subjectId = req.query.subjectId;
  if (req.query.gradeId) filter.gradeId = req.query.gradeId;
  if (req.user.role === 'teacher') filter.assignedBy = req.user.id;

  const hw = await Homework.find(filter).sort({ dueDate: -1 }).skip(skip).limit(limit)
    .populate('subjectId', 'name').populate('gradeId', 'name').populate('sectionId', 'name').populate('assignedBy', 'name');
  return paginated(res, hw, await Homework.countDocuments(filter), page, limit, 'Homework fetched');
});

// POST /api/school/homework
const createHomework = asyncHandler(async (req, res) => {
  if (!['school_admin', 'principal', 'deputy_principal', 'teacher'].includes(req.user.role)) return error(res, 'Access denied', 403);
  const { subjectId, gradeId, sectionId, title, description, dueDate, attachment } = req.body;
  if (!title || !subjectId || !gradeId) return error(res, 'Title, subject and grade required', 400);
  const hw = await Homework.create({ schoolId: req.schoolId, subjectId, gradeId, sectionId, title, description, dueDate, attachment, assignedBy: req.user.id });
  await AuditLog.create({ schoolId: req.schoolId, userId: req.user.id, action: 'homework_assigned', details: title, ip: req.ip });
  return success(res, hw, 'Homework assigned', 201);
});

// GET /api/school/homework/:id
const getHomeworkById = asyncHandler(async (req, res) => {
  const hw = await Homework.findOne({ _id: req.params.id, schoolId: req.schoolId }).populate('subjectId', 'name').populate('assignedBy', 'name');
  if (!hw) return error(res, 'Not found', 404);
  return success(res, hw);
});

// DELETE /api/school/homework/:id
const deleteHomework = asyncHandler(async (req, res) => {
  await Homework.findOneAndDelete({ _id: req.params.id, schoolId: req.schoolId });
  await HomeworkSubmission.deleteMany({ homeworkId: req.params.id });
  return success(res, null, 'Deleted');
});

// ═══════════ SUBMISSIONS ═══════════

// GET /api/school/homework/submissions/:homeworkId
const getSubmissions = asyncHandler(async (req, res) => {
  const subs = await HomeworkSubmission.find({ homeworkId: req.params.homeworkId, schoolId: req.schoolId })
    .populate('studentId', 'firstName lastName admissionNumber').sort({ submittedAt: -1 });
  return success(res, subs);
});

// POST /api/school/homework/submit/:homeworkId
const submitHomework = asyncHandler(async (req, res) => {
  const { attachment, remark } = req.body;
  // Students submit for themselves or teacher submits on behalf
  const studentId = req.user.role === 'student' ? req.user.id : req.body.studentId;
  if (!studentId) return error(res, 'Student ID required', 400);

  const existing = await HomeworkSubmission.findOne({ homeworkId: req.params.homeworkId, studentId });
  if (existing) {
    existing.attachment = attachment || existing.attachment;
    existing.remark = remark || existing.remark;
    existing.submittedAt = new Date();
    await existing.save();
    return success(res, existing, 'Submission updated');
  }

  const sub = await HomeworkSubmission.create({ schoolId: req.schoolId, homeworkId: req.params.homeworkId, studentId, attachment, remark });
  return success(res, sub, 'Submitted', 201);
});

// PATCH /api/school/homework/grade/:submissionId
const gradeSubmission = asyncHandler(async (req, res) => {
  const { grade, feedback } = req.body;
  const sub = await HomeworkSubmission.findOneAndUpdate({ _id: req.params.submissionId, schoolId: req.schoolId }, { grade, feedback }, { new: true });
  if (!sub) return error(res, 'Not found', 404);
  return success(res, sub, 'Graded');
});

module.exports = { getHomework, createHomework, getHomeworkById, deleteHomework, getSubmissions, submitHomework, gradeSubmission };