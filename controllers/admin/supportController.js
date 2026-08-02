const Support = require('../../models/admin/Support');
const Log = require('../../models/admin/Log');
const { success, error, paginated } = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const paginate = require('../../utils/pagination');
const { sendEmail } = require('../../services/emailService');
const Setting = require('../../models/admin/Setting');
const School = require('../../models/admin/School');
const logger = require('../../utils/logger');

// GET /api/admin/support
const getTickets = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const { status, priority } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  const tickets = await Support.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('schoolId', 'name')
    .populate('handledBy', 'name email');

  const total = await Support.countDocuments(filter);

  return paginated(res, tickets, total, page, limit, 'Tickets fetched');
});

// GET /api/admin/support/:id
const getTicket = asyncHandler(async (req, res) => {
  const ticket = await Support.findById(req.params.id)
    .populate('schoolId', 'name')
    .populate('handledBy', 'name email');

  if (!ticket) {
    return error(res, 'Ticket not found', 404);
  }
  return success(res, ticket);
});

// PATCH /api/admin/support/:id
const updateTicket = asyncHandler(async (req, res) => {
  const { status, priority, response } = req.body;

  const ticket = await Support.findById(req.params.id).populate('schoolId');
  if (!ticket) {
    return error(res, 'Ticket not found', 404);
  }

  ticket.status = status || ticket.status;
  ticket.priority = priority || ticket.priority;
  ticket.response = response || ticket.response;
  ticket.handledBy = req.admin.id;
  await ticket.save();

  // Notify school admin
  const school = ticket.schoolId;
  if (school && school.adminEmail) {
    const settings = await Setting.findOne().lean();
    await sendEmail(school.adminEmail, 'announcement', {
      title: `Support Ticket Update — #${ticket._id}`,
      content: `Your ticket "${ticket.subject}" is now ${ticket.status}. ${ticket.response || ''}`,
    }, settings);
  }

  await Log.create({
    adminId: req.admin.id,
    action: 'ticket_updated',
    details: `Ticket #${ticket._id} updated to ${ticket.status}`,
    ip: req.ip,
  });

  return success(res, ticket, 'Ticket updated');
});

module.exports = { getTickets, getTicket, updateTicket };