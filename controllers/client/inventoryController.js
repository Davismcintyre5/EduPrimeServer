const InventoryItem = require('../../models/client/InventoryItem');
const PurchaseOrder = require('../../models/client/PurchaseOrder');
const School = require('../../models/admin/School');
const { sendEmail } = require('../../services/emailService');
const Supplier = require('../../models/client/Supplier');
const StockMovement = require('../../models/client/StockMovement');
const AuditLog = require('../../models/client/Log');
const { success, error, paginated } = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const paginate = require('../../utils/pagination');
const logger = require('../../utils/logger');

// ═══════════ SUPPLIERS ═══════════
const getSuppliers = asyncHandler(async (req, res) => {
  const filter = { schoolId: req.schoolId };
  if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' };
  if (req.query.active === 'false') filter.isActive = false;
  else filter.isActive = true;
  return success(res, await Supplier.find(filter).sort({ name: 1 }));
});

const createSupplier = asyncHandler(async (req, res) => {
  if (!req.body.name) return error(res, 'Name required', 400);
  const supplier = await Supplier.create({ ...req.body, schoolId: req.schoolId });
  await AuditLog.create({ schoolId: req.schoolId, userId: req.user.id, action: 'supplier_created', details: supplier.name, ip: req.ip });
  return success(res, supplier, 'Supplier created', 201);
});

const updateSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findOneAndUpdate({ _id: req.params.id, schoolId: req.schoolId }, req.body, { new: true });
  if (!supplier) return error(res, 'Not found', 404);
  return success(res, supplier, 'Updated');
});

const deleteSupplier = asyncHandler(async (req, res) => {
  await Supplier.findOneAndDelete({ _id: req.params.id, schoolId: req.schoolId });
  return success(res, null, 'Deleted');
});

// ═══════════ STOCK ITEMS ═══════════
const getItems = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = { schoolId: req.schoolId };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.lowStock === 'true') filter.$expr = { $lte: ['$quantity', '$reorderLevel'] };
  if (req.query.search) filter.$or = [{ name: { $regex: req.query.search, $options: 'i' } }, { sku: { $regex: req.query.search, $options: 'i' } }];
  const items = await InventoryItem.find(filter).populate('supplierId', 'name').sort({ name: 1 }).skip(skip).limit(limit);
  return paginated(res, items, await InventoryItem.countDocuments(filter), page, limit, 'Items fetched');
});

const getItem = asyncHandler(async (req, res) => {
  const item = await InventoryItem.findOne({ _id: req.params.id, schoolId: req.schoolId }).populate('supplierId', 'name');
  if (!item) return error(res, 'Item not found', 404);
  return success(res, item);
});

const createItem = asyncHandler(async (req, res) => {
  if (!req.body.name || !req.body.category) return error(res, 'Name and category required', 400);
  const qty = parseInt(req.body.quantity) || 0;
  
  // Auto-generate SKU if not provided
  const sku = req.body.sku || `${req.body.category.substring(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  
  const item = await InventoryItem.create({ ...req.body, schoolId: req.schoolId, quantity: qty, sku });
  
  if (qty > 0) {
    await StockMovement.create({
      schoolId: req.schoolId, itemId: item._id, type: 'in',
      quantity: qty, balanceBefore: 0, balanceAfter: qty,
      reference: 'Initial stock', performedBy: req.user.id
    });
  }
  
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
  const { quantity, type, notes } = req.body;
  const item = await InventoryItem.findOne({ _id: req.params.id, schoolId: req.schoolId });
  if (!item) return error(res, 'Item not found', 404);
  
  const qty = parseInt(quantity);
  const before = item.quantity;
  
  if (type === 'add') item.quantity += qty;
  else if (type === 'remove') item.quantity = Math.max(0, item.quantity - qty);
  else if (type === 'set') item.quantity = qty;
  
  await item.save();
  
  await StockMovement.create({
    schoolId: req.schoolId, itemId: item._id,
    type: type === 'add' ? 'in' : type === 'remove' ? 'out' : 'adjustment',
    quantity: qty, balanceBefore: before, balanceAfter: item.quantity,
    reference: notes || 'Manual adjustment', performedBy: req.user.id
  });
  
  await AuditLog.create({ schoolId: req.schoolId, userId: req.user.id, action: 'stock_adjusted', details: `${item.name}: ${type} ${qty}`, ip: req.ip });
  return success(res, item, 'Stock adjusted');
});

// ═══════════ STOCK MOVEMENTS ═══════════
const getMovements = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = { schoolId: req.schoolId };
  if (req.query.itemId) filter.itemId = req.query.itemId;
  if (req.query.type) filter.type = req.query.type;
  
  const movements = await StockMovement.find(filter)
    .sort({ createdAt: -1 }).skip(skip).limit(limit)
    .populate('itemId', 'name sku unit')
    .populate('performedBy', 'name');
  
  return paginated(res, movements, await StockMovement.countDocuments(filter), page, limit, 'Movements fetched');
});

// ═══════════ PURCHASE ORDERS ═══════════
const getOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = { schoolId: req.schoolId };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.supplierId) filter.supplierId = req.query.supplierId;
  
  const orders = await PurchaseOrder.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
    .populate('supplierId', 'name')
    .populate('items.itemId', 'name sku')
    .populate('requestedBy', 'name');
  
  return paginated(res, orders, await PurchaseOrder.countDocuments(filter), page, limit, 'Orders fetched');
});

const createOrder = asyncHandler(async (req, res) => {
  const { supplierId, items, expectedDate, notes } = req.body;
  if (!supplierId || !items?.length) return error(res, 'Supplier and items required', 400);
  
  const supplier = await Supplier.findById(supplierId);
  const totalAmount = items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);
  const poNumber = `PO-${Date.now().toString(36).toUpperCase()}`;
  
  const order = await PurchaseOrder.create({
    schoolId: req.schoolId, supplierId, items, totalAmount,
    poNumber, expectedDate, notes,
    status: 'draft', requestedBy: req.user.id
  });
  
  await AuditLog.create({ schoolId: req.schoolId, userId: req.user.id, action: 'po_created', details: `${poNumber} - ${supplier?.name}`, ip: req.ip });
  return success(res, order, 'Purchase order created', 201);
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await PurchaseOrder.findOne({ _id: req.params.id, schoolId: req.schoolId });
  if (!order) return error(res, 'Order not found', 404);

  // Validate status flow
  const validTransitions = {
    draft: ['sent', 'cancelled'],
    sent: ['received', 'cancelled'],
    received: ['completed'],
  };

  const allowed = validTransitions[order.status] || [];
  if (!allowed.includes(status)) {
    return error(res, `Cannot change from '${order.status}' to '${status}'`, 400);
  }

  order.status = status;
  if (status === 'received') order.receivedDate = new Date();
  if (status === 'completed') order.completedDate = new Date();
  await order.save();

  // Auto-add stock when received
  if (status === 'received') {
    for (const item of order.items) {
      const invItem = await InventoryItem.findById(item.itemId);
      if (invItem) {
        const before = invItem.quantity;
        invItem.quantity += item.quantity;
        await invItem.save();
        await StockMovement.create({
          schoolId: req.schoolId, itemId: invItem._id, type: 'in',
          quantity: item.quantity, balanceBefore: before, balanceAfter: invItem.quantity,
          reference: `PO ${order.poNumber}`, performedBy: req.user.id
        });
      }
    }
  }

  await AuditLog.create({
    schoolId: req.schoolId, userId: req.user.id,
    action: 'po_updated', details: `PO ${order.poNumber} → ${status}`,
    ip: req.ip
  });

  return success(res, order, `Order marked as ${status}`);
});

const deleteOrder = asyncHandler(async (req, res) => {
  await PurchaseOrder.findOneAndDelete({ _id: req.params.id, schoolId: req.schoolId, status: 'draft' });
  return success(res, null, 'Deleted');
});

// ═══════════ REPORTS ═══════════
const getStockSummary = asyncHandler(async (req, res) => {
  const totalItems = await InventoryItem.countDocuments({ schoolId: req.schoolId });
  const totalStock = await InventoryItem.aggregate([
    { $match: { schoolId: req.schoolId } },
    { $group: { _id: null, totalQty: { $sum: '$quantity' }, totalValue: { $sum: { $multiply: ['$quantity', '$unitPrice'] } } } }
  ]);
  const lowStock = await InventoryItem.countDocuments({ schoolId: req.schoolId, $expr: { $lte: ['$quantity', '$reorderLevel'] } });
  const outOfStock = await InventoryItem.countDocuments({ schoolId: req.schoolId, quantity: 0 });
  const categories = await InventoryItem.distinct('category', { schoolId: req.schoolId });
  
  return success(res, {
    totalItems,
    totalQuantity: totalStock[0]?.totalQty || 0,
    totalValue: totalStock[0]?.totalValue || 0,
    lowStock,
    outOfStock,
    categories: categories.length,
  });
});

const sendOrderToSupplier = asyncHandler(async (req, res) => {
  const order = await PurchaseOrder.findById(req.params.id)
    .populate('supplierId')
    .populate('items.itemId', 'name sku')
    .populate('requestedBy', 'name');
  
  if (!order) return error(res, 'Order not found', 404);
  if (order.status !== 'draft') return error(res, 'Only draft orders can be sent', 400);
  
  const supplier = order.supplierId;
  if (!supplier?.email) return error(res, 'Supplier has no email address', 400);

  const school = await School.findById(req.schoolId).lean();

  const itemsTable = order.items.map(i => `
    <tr>
      <td style="padding:8px;border:1px solid #e0e0e0;">${i.itemId?.name || 'Item'}</td>
      <td style="padding:8px;border:1px solid #e0e0e0;text-align:center;">${i.quantity}</td>
      <td style="padding:8px;border:1px solid #e0e0e0;text-align:right;">KES ${(i.unitPrice || 0).toLocaleString()}</td>
      <td style="padding:8px;border:1px solid #e0e0e0;text-align:right;">KES ${((i.quantity || 0) * (i.unitPrice || 0)).toLocaleString()}</td>
    </tr>
  `).join('');

  await sendEmail(supplier.email, 'purchaseOrder', {
    poNumber: order.poNumber,
    date: new Date(order.createdAt).toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    expectedDate: order.expectedDate ? new Date(order.expectedDate).toLocaleDateString('en-KE') : null,
    requestedBy: order.requestedBy?.name || 'School Administration',
    itemsTable,
    totalAmount: (order.totalAmount || 0).toLocaleString(),
    notes: order.notes || '',
  }, school);

  order.status = 'sent';
  order.sentDate = new Date();
  await order.save();

  await AuditLog.create({
    schoolId: req.schoolId, userId: req.user.id,
    action: 'po_sent', details: `PO ${order.poNumber} emailed to ${supplier.email}`,
    ip: req.ip
  });

  logger.info(`📧 PO ${order.poNumber} sent to ${supplier.email}`);
  return success(res, order, 'Purchase order sent to supplier');
});


module.exports = {
  getSuppliers, createSupplier, updateSupplier, deleteSupplier,
  getItems, getItem, createItem, updateItem, deleteItem, adjustStock,
  getMovements,
  getOrders,sendOrderToSupplier , createOrder, updateOrderStatus, deleteOrder,
  getStockSummary,
};