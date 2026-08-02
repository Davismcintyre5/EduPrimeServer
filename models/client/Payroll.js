const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  casualStaffId: { type: mongoose.Schema.Types.ObjectId, ref: 'CasualStaff' },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  basicSalary: { type: Number, required: true },
  allowances: {
    housing: Number, transport: Number, medical: Number,
    responsibility: Number, other: Number,
  },
  totalAllowances: { type: Number, default: 0 },
  grossPay: { type: Number, required: true },
  deductions: {
    nhif: Number, nssf: Number, paye: Number, loan: Number, other: Number,
  },
  totalDeductions: { type: Number, default: 0 },
  netPay: { type: Number, required: true },
  status: { type: String, enum: ['draft', 'approved', 'paid'], default: 'draft' },
  paymentMethod: { type: String, enum: ['bank', 'cash', 'mpesa'], default: 'bank' },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Payroll', payrollSchema);