const Announcement = require('../../models/client/Announcement');
const AuditLog = require('../../models/client/Log');
const { success, error, paginated } = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const paginate = require('../../utils/pagination');
const { sendEmail } = require('../../services/emailService');
const logger = require('../../utils/logger');

// GET /api/school/communications
const getCommunications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = { schoolId: req.schoolId };
  if (req.query.type) filter.type = req.query.type;
  if (req.query.targetAudience) filter.targetAudience = req.query.targetAudience;

  const comms = await Announcement.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('postedBy', 'name');
  return paginated(res, comms, await Announcement.countDocuments(filter), page, limit, 'Communications fetched');
});

// POST /api/school/communications
const createCommunication = asyncHandler(async (req, res) => {
  if (!['school_admin', 'principal', 'deputy_principal'].includes(req.user.role)) return error(res, 'Access denied', 403);
  
  const { type, title, content, targetAudience, targetGrade, postToPortal, allowPrint, attachment } = req.body;
  if (!type || !title || !content) return error(res, 'Type, title and content required', 400);

  const comm = await Announcement.create({
    schoolId: req.schoolId,
    type: type || 'general',
    title,
    content,
    targetAudience: targetAudience || ['all'],
    targetGrade: targetGrade || [],
    postToPortal: postToPortal !== false,
    allowPrint: allowPrint !== false,
    attachment: attachment || '',
    postedBy: req.user.id,
  });

  await AuditLog.create({ schoolId: req.schoolId, userId: req.user.id, action: 'communication_created', details: `${type}: ${title}`, ip: req.ip });
  
  // Send email if needed
  if (type === 'announcement' || type === 'urgent') {
    try {
      const School = require('../../models/admin/School');
      const school = await School.findById(req.schoolId).lean();
      await sendEmail(school.adminEmail, 'announcement', { title, content, attachment }, school);
    } catch (e) { logger.warn('Failed to send announcement email'); }
  }

  logger.info(`📢 Communication: ${type} - ${title}`);
  return success(res, comm, 'Communication created', 201);
});

// PUT /api/school/communications/:id
const updateCommunication = asyncHandler(async (req, res) => {
  if (!['school_admin', 'principal', 'deputy_principal'].includes(req.user.role)) return error(res, 'Access denied', 403);
  const comm = await Announcement.findOneAndUpdate({ _id: req.params.id, schoolId: req.schoolId }, req.body, { new: true });
  if (!comm) return error(res, 'Not found', 404);
  return success(res, comm, 'Updated');
});

// DELETE /api/school/communications/:id
const deleteCommunication = asyncHandler(async (req, res) => {
  await Announcement.findOneAndDelete({ _id: req.params.id, schoolId: req.schoolId });
  return success(res, null, 'Deleted');
});

module.exports = { getCommunications, createCommunication, updateCommunication, deleteCommunication };