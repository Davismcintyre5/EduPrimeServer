const Parent = require('../../models/client/Parent');
const { success, error, paginated } = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const paginate = require('../../utils/pagination');

const getParents = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = { schoolId: req.schoolId };
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ];
  }
  const parents = await Parent.find(filter).populate('children', 'firstName lastName').sort({ createdAt: -1 }).skip(skip).limit(limit);
  const total = await Parent.countDocuments(filter);
  return paginated(res, parents, total, page, limit, 'Parents fetched');
});

const toggleParent = asyncHandler(async (req, res) => {
  const parent = await Parent.findOne({ _id: req.params.id, schoolId: req.schoolId });
  if (!parent) return error(res, 'Parent not found', 404);
  parent.isActive = !parent.isActive;
  await parent.save();
  return success(res, null, `Parent ${parent.isActive ? 'activated' : 'deactivated'}`);
});

module.exports = { getParents, toggleParent };