const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true },
  sku: { type: String },
supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
unitPrice: { type: Number, default: 0 },
location: { type: String },
minStock: { type: Number, default: 5 },
  category: { type: String, required: true },
  quantity: { type: Number, default: 0 },
  reorderLevel: { type: Number, default: 10 },
  unit: { type: String },
  location: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);