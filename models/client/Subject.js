const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true },
  code: { type: String },
  gradeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Grade', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isCompulsory: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);