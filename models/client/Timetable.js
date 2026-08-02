const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  gradeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Grade', required: true },
  sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
  day: { type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], required: true },
  periods: [{
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    startTime: String,
    endTime: String,
  }],
}, { timestamps: true });

module.exports = mongoose.model('Timetable', timetableSchema);