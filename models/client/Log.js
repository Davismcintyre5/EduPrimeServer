const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId },
  action: { type: String, required: true },
  details: { type: String },
  ip: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);