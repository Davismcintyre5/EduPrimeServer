const mongoose = require('mongoose');

const feeTransactionSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  feeStructureId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeStructure' },
  invoiceNumber: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  lateFine: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },              // 🆕
  status: { type: String, enum: ['pending', 'partial', 'paid', 'overdue', 'cancelled'], default: 'pending' },
  dueDate: { type: Date },
  paidDate: { type: Date },
  paymentMethod: { type: String, enum: ['cash', 'mpesa', 'bank_transfer', 'cheque', 'online', 'other'] },
  paymentReference: { type: String },                    // 🆕 Transaction reference
  paymentProof: { type: String },
  term: { type: String, enum: ['term1', 'term2', 'term3'] },
  academicYear: { type: String },
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },  // 🆕
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },                              // 🆕
}, { timestamps: true });

module.exports = mongoose.model('FeeTransaction', feeTransactionSchema);