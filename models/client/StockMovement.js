const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
  type: { type: String, enum: ['in', 'out', 'adjustment'], required: true },
  quantity: { type: Number, required: true },
  balanceBefore: { type: Number },
  balanceAfter: { type: Number },
  reference: { type: String },
  notes: { type: String },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('StockMovement', stockMovementSchema);