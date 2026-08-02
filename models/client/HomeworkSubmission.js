const mongoose = require('mongoose');

const homeworkSubmissionSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  homeworkId: { type: mongoose.Schema.Types.ObjectId, ref: 'Homework', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  attachment: { type: String },
  remark: { type: String },
  submittedAt: { type: Date, default: Date.now },
  grade: { type: Number },
  feedback: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('HomeworkSubmission', homeworkSubmissionSchema);