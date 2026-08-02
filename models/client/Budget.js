const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true },
  term: { type: String, enum: ['term1', 'term2', 'term3'], required: true },
  academicYear: { type: String, required: true },
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  plannedAmount: { type: Number, required: true },
  actualAmount: { type: Number, default: 0 },
  type: { type: String, enum: ['income', 'expense'], required: true },
  status: { type: String, enum: ['draft', 'approved', 'active', 'closed'], default: 'draft' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Budget', budgetSchema);