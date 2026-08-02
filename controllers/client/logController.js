const AuditLog = require('../../models/client/Log');
const { success, paginated, error } = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const paginate = require('../../utils/pagination');
const path = require('path');
const fs = require('fs');

// GET /api/school/logs
const getLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const { action, search } = req.query;
  const filter = { schoolId: req.schoolId };
  if (action) filter.action = action;
  if (search) filter.details = { $regex: search, $options: 'i' };

  const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
  const total = await AuditLog.countDocuments(filter);
  return paginated(res, logs, total, page, limit, 'Logs fetched');
});

// DELETE /api/school/logs
const clearLogs = asyncHandler(async (req, res) => {
  const { before } = req.query;
  const filter = { schoolId: req.schoolId };
  if (before) filter.createdAt = { $lt: new Date(before) };

  const result = await AuditLog.deleteMany(filter);
  return success(res, { deleted: result.deletedCount }, 'Logs cleared');
});

// GET /api/school/logs/download
const downloadLogs = asyncHandler(async (req, res) => {
  const logs = await AuditLog.find({ schoolId: req.schoolId }).sort({ createdAt: -1 }).lean();
  const filePath = path.join(__dirname, '..', '..', 'temp', `logs_${req.schoolId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(logs, null, 2));
  res.download(filePath, `school_logs_${Date.now()}.json`, () => {
    fs.unlinkSync(filePath);
  });
});

module.exports = { getLogs, clearLogs, downloadLogs };