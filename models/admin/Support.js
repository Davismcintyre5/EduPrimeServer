const mongoose = require('mongoose');

const supportSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
  response: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Support', supportSchema);