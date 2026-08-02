const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  marksObtained: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  grade: { type: String },
  remark: { type: String },
  status: { type: String, enum: ['draft', 'submitted'], default: 'draft' },
  enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Marks', marksSchema);