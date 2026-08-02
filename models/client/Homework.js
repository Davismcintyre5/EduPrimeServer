const mongoose = require('mongoose');

const homeworkSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  gradeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Grade', required: true },
  sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
  title: { type: String, required: true },
  description: { type: String },
  attachment: { type: String },
  dueDate: { type: Date, required: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Homework', homeworkSchema);