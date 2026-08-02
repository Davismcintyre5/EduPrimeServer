const mongoose = require('mongoose');

const bookTransactionSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  borrowerId: { type: mongoose.Schema.Types.ObjectId, required: true },
  borrowerType: { type: String, enum: ['student', 'staff'], required: true },
  issueDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  returnDate: { type: Date },
  fineAmount: { type: Number, default: 0 },
  finePaid: { type: Boolean, default: false },
  status: { type: String, enum: ['issued', 'returned', 'overdue'], default: 'issued' },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('BookTransaction', bookTransactionSchema);