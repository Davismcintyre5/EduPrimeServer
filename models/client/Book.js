const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  isbn: { type: String },
  type: { type: String, enum: ['book', 'stationery'], default: 'book' },
unit: { type: String, default: '' },
price: { type: Number, default: 0 },
  title: { type: String, required: true },
  author: { type: String, default: '' },
  category: { type: String },
  quantity: { type: Number, default: 1 },
  available: { type: Number, default: 1 },
  shelf: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);