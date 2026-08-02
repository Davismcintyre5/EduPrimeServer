const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true },
  gradeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Grade' },
  amount: { type: Number, required: true },
  dueDate: { type: Date },
  feeType: { type: String, enum: ['tuition', 'transport', 'library', 'exam', 'boarding', 'registration', 'development', 'other'], default: 'tuition' },
  term: { type: String, enum: ['term1', 'term2', 'term3'], default: 'term1' },
  academicYear: { type: String },
  lateFineDaily: { type: Number, default: 0 },
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },  // 🆕 Link to chart of accounts
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('FeeStructure', feeStructureSchema);