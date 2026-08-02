const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  senderRole: { type: String, required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, required: true },
  receiverRole: { type: String, required: true },
  content: { type: String, required: true },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);