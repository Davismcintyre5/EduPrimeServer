const mongoose = require('mongoose');

const pendingSchoolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  country: { type: String, required: true },
  county: { type: String },
  constituency: { type: String },
  ward: { type: String },
  town: { type: String },
  location: { type: String },
  currency: { type: String, required: true, default: 'KES' },
  type: { type: String, enum: ['private', 'public'], required: true },
  levels: [{ type: String, enum: ['primary', 'jss', 'sss'] }],
  adminName: { type: String },
  adminEmail: { type: String, required: true },
  adminPhone: { type: String },
  adminPassword: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
  reviewedAt: { type: Date },
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('PendingSchool', pendingSchoolSchema);