const express = require('express');
const router = express.Router();
const auth = require('../../middleware/client/auth');
const tenant = require('../../middleware/client/tenant');
const { getItems, getItem, createItem, updateItem, deleteItem, adjustStock, getOrders, createOrder, updateOrderStatus } = require('../../controllers/client/inventoryController');

router.use(auth, tenant);

router.get('/items', getItems);
router.get('/items/:id', getItem);
router.post('/items', createItem);
router.put('/items/:id', updateItem);
router.delete('/items/:id', deleteItem);
router.patch('/items/:id/stock', adjustStock);

router.get('/orders', getOrders);
router.post('/orders', createOrder);
router.patch('/orders/:id/status', updateOrderStatus);

module.exports = router;