const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
  action: { type: String, required: true },
  details: { type: String },
  ip: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Log', logSchema);