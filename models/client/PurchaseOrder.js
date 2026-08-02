const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  supplier: { type: String, required: true },
  items: [{
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem' },
    quantity: Number,
    unitPrice: Number,
  }],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['draft', 'pending', 'approved', 'rejected', 'received'], default: 'draft' },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);