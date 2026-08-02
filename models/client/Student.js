const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  studentId: { type: String, required: true, unique: true },
  rollNumber: { type: String, required: true },
  admissionNumber: { type: String },        // ✅ Add this
  dateJoined: { type: Date },               // ✅ Add this
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  dob: { type: Date },
  grade: { type: String, required: true },
  section: { type: String, required: true },
  photo: { type: String },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent' },
  documents: [{ name: String, url: String }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);