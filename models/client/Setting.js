const mongoose = require('mongoose');

const schoolSettingSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  key: { type: String, required: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
}, { timestamps: true });

module.exports = mongoose.model('SchoolSetting', schoolSettingSchema);