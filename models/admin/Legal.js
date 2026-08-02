const mongoose = require('mongoose');

const legalSchema = new mongoose.Schema({
  type: { type: String, enum: ['privacy_policy', 'terms_of_service', 'refund_policy'], required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  version: { type: String, default: '1.0' },
  isPublished: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Legal', legalSchema);