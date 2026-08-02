const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['unit_test', 'mid_term', 'final', 'practical'], required: true },
  academicYear: { type: String, required: true },
  term: { type: String, enum: ['term1', 'term2', 'term3'], default: 'term1' },  // 🆕
  weight: { type: Number, default: 33.33 },  // 🆕 Weight percentage
  startDate: { type: Date },
  endDate: { type: Date },
  isPublished: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);