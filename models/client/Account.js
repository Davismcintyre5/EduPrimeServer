const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true },
  code: { type: String },
  type: { type: String, enum: ['income', 'expense', 'asset', 'liability', 'equity', 'bank'], required: true },
  category: { type: String },
  description: { type: String },
  balance: { type: Number, default: 0 },
  
  // Bank-specific fields
  bankName: { type: String },
  branch: { type: String },
  accountNumber: { type: String },
  accountHolder: { type: String },
  swiftCode: { type: String },
  
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Account', accountSchema);