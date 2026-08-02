const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeTransaction' },
  receiptNumber: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cash', 'mpesa', 'bank_transfer', 'cheque', 'online', 'other'], required: true },
  reference: { type: String },
  proof: { type: String },
  date: { type: Date, default: Date.now },
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);