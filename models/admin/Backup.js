const mongoose = require('mongoose');

const backupSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', default: null },
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  size: { type: Number },
  type: { type: String, enum: ['manual', 'auto', 'uploaded'], default: 'manual' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
  emailedTo: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Backup', backupSchema);