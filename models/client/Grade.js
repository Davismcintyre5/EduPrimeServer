const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true },
  level: { type: String, enum: ['primary', 'jss', 'sss'], required: true },
  sections: [{ type: String }],
  hasStreams: { type: Boolean, default: false },
  streams: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Grade', gradeSchema);