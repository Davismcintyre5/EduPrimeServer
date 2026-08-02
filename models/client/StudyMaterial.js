const mongoose = require('mongoose');

const studyMaterialSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  title: { type: String, required: true },
  description: { type: String },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  gradeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Grade' },
  file: { type: String },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('StudyMaterial', studyMaterialSchema);