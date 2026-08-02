const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  userRole: { type: String, required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  link: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);