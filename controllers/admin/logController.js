const Log = require('../../models/admin/Log');
const { success, paginated } = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const paginate = require('../../utils/pagination');

// GET /api/admin/logs
const getLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const { action, from, to } = req.query;

  const filter = {};
  if (action) filter.action = action;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const logs = await Log.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('adminId', 'name email');

  const total = await Log.countDocuments(filter);

  return paginated(res, logs, total, page, limit, 'Logs fetched');
});

// DELETE /api/admin/logs
const clearLogs = asyncHandler(async (req, res) => {
  const { before } = req.query;
  const filter = before ? { createdAt: { $lt: new Date(before) } } : {};

  const result = await Log.deleteMany(filter);
  return success(res, { deleted: result.deletedCount }, 'Logs cleared');
});

module.exports = { getLogs, clearLogs };