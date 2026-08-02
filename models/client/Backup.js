const mongoose = require('mongoose');

const schoolBackupSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  size: { type: Number },
  type: { type: String, enum: ['manual', 'auto', 'uploaded'], default: 'manual' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  emailedTo: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('SchoolBackup', schoolBackupSchema);