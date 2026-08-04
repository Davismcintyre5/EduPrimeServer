const express = require('express');
const router = express.Router();
const auth = require('../../middleware/client/auth');
const tenant = require('../../middleware/client/tenant');
const {
  getSuppliers, createSupplier, updateSupplier, deleteSupplier,
  getItems, getItem, createItem, updateItem, deleteItem, adjustStock,
  getMovements,sendOrderToSupplier ,
  getOrders, createOrder, updateOrderStatus, deleteOrder,
  getStockSummary,
} = require('../../controllers/client/inventoryController');

router.use(auth, tenant);

// Suppliers
router.get('/suppliers', getSuppliers);
router.post('/suppliers', createSupplier);
router.put('/suppliers/:id', updateSupplier);
router.delete('/suppliers/:id', deleteSupplier);

// Items
router.get('/items', getItems);
router.get('/items/:id', getItem);
router.post('/items', createItem);
router.put('/items/:id', updateItem);
router.delete('/items/:id', deleteItem);
router.post('/items/:id/adjust', adjustStock);

// Movements
router.get('/movements', getMovements);

// Purchase Orders
router.get('/orders', getOrders);
router.post('/orders', createOrder);
router.patch('/orders/:id/status', updateOrderStatus);
router.delete('/orders/:id', deleteOrder);
router.post('/orders/:id/send', sendOrderToSupplier);

// Reports
router.get('/summary', getStockSummary);

module.exports = router;