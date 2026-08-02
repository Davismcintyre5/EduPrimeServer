const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  isbn: { type: String },
  title: { type: String, required: true },
  author: { type: String, required: true },
  category: { type: String },
  quantity: { type: Number, default: 1 },
  available: { type: Number, default: 1 },
  shelf: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);