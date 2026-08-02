const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  country: { type: String, required: true },
  county: { type: String },
  constituency: { type: String },
  town: { type: String },
  location: { type: String },
  currency: { type: String, required: true, default: 'KES' },
  type: { type: String, enum: ['private', 'public'], required: true },
  levels: [{ type: String, enum: ['primary', 'jss', 'sss'] }],

  // School Contact
  email: { type: String },
  phone: { type: String },
  website: { type: String },
  address: { type: String },

  // Branding
  logo: { type: String },
  motto: { type: String },
  vision: { type: String },
  mission: { type: String },

  // Admin
  adminName: { type: String, required: true },
  adminEmail: { type: String, required: true },
  adminPhone: { type: String },
  adminPassword: { type: String },

  // Status
  isActive: { type: Boolean, default: true },
  suspensionReason: { type: String },
  suspendedAt: { type: Date },
  suspendedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
}, { timestamps: true });

module.exports = mongoose.model('School', schoolSchema);