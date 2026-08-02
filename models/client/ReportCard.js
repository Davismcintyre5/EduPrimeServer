const mongoose = require('mongoose');

const reportCardSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
  academicYear: { type: String, required: true },
  term: { type: String },                          // 🆕
  type: { type: String, enum: ['exam', 'average'], default: 'exam' },  // 🆕
  grade: { type: String },
  section: { type: String },
  subjects: [{
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    marks: Number,
    total: Number,
    average: String,                               // 🆕
    grade: String,
    remark: String,
  }],
  totalMarks: Number,
  totalMax: Number,
  percentage: Number,
  overallGrade: String,
  classTeacherRemark: String,
  principalRemark: String,
  isPublished: { type: Boolean, default: false },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('ReportCard', reportCardSchema);