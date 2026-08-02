const mongoose = require('mongoose');

const casualStaffSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true },
  phone: { type: String },
  role: { type: String, enum: ['groundsman', 'cook', 'security', 'office_assistant', 'other'], required: true },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  dob: { type: Date },
  nationalId: { type: String },
  kraPin: { type: String },
  address: { type: String },
  emergencyContact: { type: String },
  emergencyPhone: { type: String },
  wage: { type: Number },
  paymentMethod: { type: String, enum: ['cash', 'mpesa', 'bank'], default: 'cash' },
  bankName: { type: String },
  accountNumber: { type: String },
  isActive: { type: Boolean, default: true },
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('CasualStaff', casualStaffSchema);