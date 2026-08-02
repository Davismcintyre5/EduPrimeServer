const mongoose = require('mongoose');

const healthSchema = new mongoose.Schema({
  dbStatus: { type: String, enum: ['up', 'down'], required: true },
  redisStatus: { type: String, enum: ['up', 'down', 'disabled'] },
  uptime: { type: Number },
  memoryUsage: { type: Number },
  checkedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Health', healthSchema);