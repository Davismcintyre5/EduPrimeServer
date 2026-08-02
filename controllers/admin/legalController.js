const Legal = require('../../models/admin/Legal');
const Log = require('../../models/admin/Log');
const { success, error } = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

// GET /api/admin/legals
const getLegals = asyncHandler(async (req, res) => {
  const { type } = req.query;
  const filter = type ? { type } : {};
  const legals = await Legal.find(filter);
  return success(res, legals);
});

// POST /api/admin/legals
const createLegal = asyncHandler(async (req, res) => {
  const { type, title, content } = req.body;
  const legal = await Legal.create({ type, title, content });

  await Log.create({
    adminId: req.admin.id,
    action: 'legal_created',
    details: `Legal document created: ${title}`,
    ip: req.ip,
  });

  return success(res, legal, 'Legal document created', 201);
});

// PUT /api/admin/legals/:id
const updateLegal = asyncHandler(async (req, res) => {
  const legal = await Legal.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!legal) {
    return error(res, 'Legal document not found', 404);
  }

  await Log.create({
    adminId: req.admin.id,
    action: 'legal_updated',
    details: `Legal document updated: ${legal.title}`,
    ip: req.ip,
  });

  return success(res, legal, 'Legal document updated');
});

// PATCH /api/admin/legals/:id/publish
const togglePublish = asyncHandler(async (req, res) => {
  const legal = await Legal.findById(req.params.id);
  if (!legal) {
    return error(res, 'Legal document not found', 404);
  }

  legal.isPublished = !legal.isPublished;
  await legal.save();

  return success(res, legal, `Legal document ${legal.isPublished ? 'published' : 'unpublished'}`);
});

// DELETE /api/admin/legals/:id
const deleteLegal = asyncHandler(async (req, res) => {
  const legal = await Legal.findByIdAndDelete(req.params.id);
  if (!legal) {
    return error(res, 'Legal document not found', 404);
  }

  await Log.create({
    adminId: req.admin.id,
    action: 'legal_deleted',
    details: `Legal document deleted: ${legal.title}`,
    ip: req.ip,
  });

  return success(res, null, 'Legal document deleted');
});

module.exports = { getLegals, createLegal, updateLegal, togglePublish, deleteLegal };