const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  type: { type: String, enum: ['memo', 'announcement', 'newsletter', 'general', 'urgent'], default: 'general' },
  title: { type: String, required: true },
  content: { type: String, required: true },
  targetAudience: [{ type: String, enum: ['all', 'students', 'parents', 'staff'] }],
  targetGrade: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Grade' }],
  postToPortal: { type: Boolean, default: true },
  allowPrint: { type: Boolean, default: true },
  attachment: { type: String },
  ccEmails: [{ type: String }], 
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);