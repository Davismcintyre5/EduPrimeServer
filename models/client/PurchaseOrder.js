const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  poNumber: { type: String, unique: true },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  supplier: { type: String },
  items: [{
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem' },
    quantity: Number,
    unitPrice: Number,
  }],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['draft', 'sent', 'received', 'completed', 'cancelled'], default: 'draft' },
  expectedDate: { type: Date },
  notes: { type: String },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sentDate: { type: Date },
  receivedDate: { type: Date },
  completedDate: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);