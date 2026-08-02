const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  gradeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Grade', required: true },
  name: { type: String, required: true },
  classTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  capacity: { type: Number, default: 40 },
}, { timestamps: true });

module.exports = mongoose.model('Section', sectionSchema);