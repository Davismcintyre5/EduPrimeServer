const mongoose = require('mongoose');

const salaryStructureSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  basicSalary: { type: Number, required: true },
  allowances: {
    housing: { type: Number, default: 0 },
    transport: { type: Number, default: 0 },
    medical: { type: Number, default: 0 },
    responsibility: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
  },
  deductions: {
    nhif: { type: Number, default: 0 },
    nssf: { type: Number, default: 0 },
    paye: { type: Number, default: 0 },
    loan: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
  },
  bankName: { type: String },
  accountNumber: { type: String },
  employmentType: { type: String, enum: ['permanent', 'contract', 'part_time', 'intern'], default: 'permanent' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('SalaryStructure', salaryStructureSchema);