const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, enum: ['utilities', 'salaries', 'maintenance', 'supplies', 'transport', 'events', 'food', 'security', 'other'], required: true },
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },  // 🆕
  receipt: { type: String },
  date: { type: Date, required: true },
  paymentMethod: { type: String, enum: ['cash', 'mpesa', 'bank_transfer', 'cheque', 'other'] },
  reference: { type: String },                          // 🆕
  vendor: { type: String },                             // 🆕
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending', 'approved', 'paid'], default: 'paid' },  // 🆕
  remark: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);