const InventoryItem = require('../../models/client/InventoryItem');
const PurchaseOrder = require('../../models/client/PurchaseOrder');
const AuditLog = require('../../models/client/Log');
const { success, error, paginated } = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const paginate = require('../../utils/pagination');
const logger = require('../../utils/logger');

// ═══════════ STOCK ═══════════
const getItems = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = { schoolId: req.schoolId };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.lowStock === 'true') filter.$expr = { $lte: ['$quantity', '$reorderLevel'] };
  const items = await InventoryItem.find(filter).sort({ name: 1 }).skip(skip).limit(limit);
  return paginated(res, items, await InventoryItem.countDocuments(filter), page, limit, 'Items fetched');
});

const getItem = asyncHandler(async (req, res) => {
  const item = await InventoryItem.findOne({ _id: req.params.id, schoolId: req.schoolId });
  if (!item) return error(res, 'Item not found', 404);
  return success(res, item);
});

const createItem = asyncHandler(async (req, res) => {
  if (!req.body.name || !req.body.category) return error(res, 'Name and category required', 400);
  const item = await InventoryItem.create({ ...req.body, schoolId: req.schoolId });
  await AuditLog.create({ schoolId: req.schoolId, userId: req.user.id, action: 'inventory_item_created', details: item.name, ip: req.ip });
  return success(res, item, 'Item created', 201);
});

const updateItem = asyncHandler(async (req, res) => {
  const item = await InventoryItem.findOneAndUpdate({ _id: req.params.id, schoolId: req.schoolId }, req.body, { new: true });
  if (!item) return error(res, 'Item not found', 404);
  return success(res, item, 'Item updated');
});

const deleteItem = asyncHandler(async (req, res) => {
  await InventoryItem.findOneAndDelete({ _id: req.params.id, schoolId: req.schoolId });
  return success(res, null, 'Item deleted');
});

const adjustStock = asyncHandler(async (req, res) => {
  const { quantity, type } = req.body; // type: 'add' | 'remove'
  const item = await InventoryItem.findOne({ _id: req.params.id, schoolId: req.schoolId });
  if (!item) return error(res, 'Item not found', 404);
  if (type === 'add') item.quantity += parseInt(quantity);
  else item.quantity = Math.max(0, item.quantity - parseInt(quantity));
  await item.save();
  await AuditLog.create({ schoolId: req.schoolId, userId: req.user.id, action: 'stock_adjusted', details: `${item.name}: ${type} ${quantity}`, ip: req.ip });
  return success(res, item, 'Stock adjusted');
});

// ═══════════ PURCHASE ORDERS ═══════════
const getOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = { schoolId: req.schoolId };
  if (req.query.status) filter.status = req.query.status;
  const orders = await PurchaseOrder.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('items.itemId', 'name').populate('requestedBy', 'name').populate('approvedBy', 'name');
  return paginated(res, orders, await PurchaseOrder.countDocuments(filter), page, limit, 'Orders fetched');
});

const createOrder = asyncHandler(async (req, res) => {
  const { supplier, items } = req.body;
  if (!supplier || !items?.length) return error(res, 'Supplier and items required', 400);
  const totalAmount = items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);
  const order = await PurchaseOrder.create({ schoolId: req.schoolId, supplier, items, totalAmount, status: 'draft', requestedBy: req.user.id });
  await AuditLog.create({ schoolId: req.schoolId, userId: req.user.id, action: 'po_created', details: `${supplier} - ${totalAmount}`, ip: req.ip });
  return success(res, order, 'Purchase order created', 201);
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await PurchaseOrder.findOneAndUpdate({ _id: req.params.id, schoolId: req.schoolId }, { status, approvedBy: status === 'approved' ? req.user.id : undefined }, { new: true });
  if (!order) return error(res, 'Order not found', 404);
  if (status === 'received') { for (const item of order.items) { await InventoryItem.findByIdAndUpdate(item.itemId, { $inc: { quantity: item.quantity } }); } }
  await AuditLog.create({ schoolId: req.schoolId, userId: req.user.id, action: 'po_updated', details: `Order ${status}`, ip: req.ip });
  return success(res, order, 'Order updated');
});

module.exports = { getItems, getItem, createItem, updateItem, deleteItem, adjustStock, getOrders, createOrder, updateOrderStatus };