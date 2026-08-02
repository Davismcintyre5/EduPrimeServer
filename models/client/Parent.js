const mongoose = require('mongoose');

const parentSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  isActive: { type: Boolean, default: true },
  resetToken: { type: String },
  resetTokenExpiry: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Parent', parentSchema);