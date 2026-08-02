const Book = require('../../models/client/Book');
const BookTransaction = require('../../models/client/BookTransaction');
const Student = require('../../models/client/Student');
const User = require('../../models/client/User');
const AuditLog = require('../../models/client/Log');
const { success, error, paginated } = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const paginate = require('../../utils/pagination');
const logger = require('../../utils/logger');

// ═══════════ BOOKS ═══════════
const getBooks = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = { schoolId: req.schoolId };
  if (req.query.search) filter.$or = [{ title: { $regex: req.query.search, $options: 'i' } }, { author: { $regex: req.query.search, $options: 'i' } }, { isbn: { $regex: req.query.search, $options: 'i' } }];
  if (req.query.category) filter.category = req.query.category;
  const books = await Book.find(filter).sort({ title: 1 }).skip(skip).limit(limit);
  return paginated(res, books, await Book.countDocuments(filter), page, limit, 'Books fetched');
});

const getBook = asyncHandler(async (req, res) => {
  const book = await Book.findOne({ _id: req.params.id, schoolId: req.schoolId });
  if (!book) return error(res, 'Book not found', 404);
  return success(res, book);
});

const createBook = asyncHandler(async (req, res) => {
  const { title, author, isbn, category, quantity, shelf } = req.body;
  if (!title || !author) return error(res, 'Title and author required', 400);
  const qty = parseInt(quantity) || 1;
  const book = await Book.create({ schoolId: req.schoolId, title, author, isbn, category, quantity: qty, available: qty, shelf });
  await AuditLog.create({ schoolId: req.schoolId, userId: req.user.id, action: 'book_created', details: title, ip: req.ip });
  return success(res, book, 'Book created', 201);
});

const updateBook = asyncHandler(async (req, res) => {
  const book = await Book.findOneAndUpdate({ _id: req.params.id, schoolId: req.schoolId }, req.body, { new: true });
  if (!book) return error(res, 'Book not found', 404);
  return success(res, book, 'Book updated');
});

const deleteBook = asyncHandler(async (req, res) => {
  await Book.findOneAndDelete({ _id: req.params.id, schoolId: req.schoolId });
  return success(res, null, 'Book deleted');
});

// ═══════════ ISSUE / RETURN ═══════════
const getTransactions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = { schoolId: req.schoolId };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.borrowerType) filter.borrowerType = req.query.borrowerType;
  
  const txns = await BookTransaction.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('bookId', 'title isbn')
    .populate('issuedBy', 'name')
    .lean(); // Get plain objects

  // 🆕 Manually populate borrower names
  const enrichedTxns = await Promise.all(txns.map(async (txn) => {
    let borrowerName = '—';
    if (txn.borrowerType === 'student') {
      const student = await Student.findById(txn.borrowerId).select('firstName lastName admissionNumber');
      if (student) borrowerName = `${student.firstName} ${student.lastName} (${student.admissionNumber})`;
    } else if (txn.borrowerType === 'staff') {
      const staff = await User.findById(txn.borrowerId).select('name email');
      if (staff) borrowerName = staff.name;
    }
    return { ...txn, borrowerName };
  }));

  const total = await BookTransaction.countDocuments(filter);
  return paginated(res, enrichedTxns, total, page, limit, 'Transactions fetched');
});

const issueBook = asyncHandler(async (req, res) => {
  const { bookId, borrowerId, borrowerType, dueDate } = req.body;
  if (!bookId || !borrowerId || !borrowerType) return error(res, 'Book, borrower and type required', 400);
  
  const book = await Book.findById(bookId);
  if (!book) return error(res, 'Book not found', 404);
  if (book.available < 1) return error(res, 'No copies available', 400);

  // 🆕 Look up borrower by admission number or staff ID
  let borrowerObjectId = borrowerId;
  if (borrowerType === 'student') {
    const student = await Student.findOne({ 
      $or: [{ admissionNumber: borrowerId }, { studentId: borrowerId }],
      schoolId: req.schoolId 
    });
    if (!student) return error(res, 'Student not found', 404);
    borrowerObjectId = student._id;
  } else if (borrowerType === 'staff') {
    const staff = await User.findOne({ 
      $or: [{ email: borrowerId }, { phone: borrowerId }],
      schoolId: req.schoolId 
    });
    if (!staff) return error(res, 'Staff not found', 404);
    borrowerObjectId = staff._id;
  }

  const txn = await BookTransaction.create({
    schoolId: req.schoolId, bookId, 
    borrowerId: borrowerObjectId, 
    borrowerType,
    issueDate: new Date(),
    dueDate: dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    status: 'issued',
    issuedBy: req.user.id
  });
  
  book.available -= 1;
  await book.save();

  await AuditLog.create({ schoolId: req.schoolId, userId: req.user.id, action: 'book_issued', details: `${book.title} to ${borrowerId}`, ip: req.ip });
  logger.info(`📚 Book issued: ${book.title}`);
  return success(res, txn, 'Book issued', 201);
});

const returnBook = asyncHandler(async (req, res) => {
  const txn = await BookTransaction.findOne({ _id: req.params.id, schoolId: req.schoolId, status: 'issued' });
  if (!txn) return error(res, 'Transaction not found or already returned', 404);
  
  const today = new Date();
  let fine = 0;
  if (today > txn.dueDate) {
    const daysLate = Math.ceil((today - txn.dueDate) / (1000 * 60 * 60 * 24));
    fine = daysLate * 50; // KES 50 per day
  }

  txn.returnDate = today;
  txn.fineAmount = fine;
  txn.status = 'returned';
  if (fine > 0) txn.status = 'overdue';
  await txn.save();

  const book = await Book.findById(txn.bookId);
  if (book) { book.available += 1; await book.save(); }

  await AuditLog.create({ schoolId: req.schoolId, userId: req.user.id, action: 'book_returned', details: `Fine: ${fine}`, ip: req.ip });
  return success(res, txn, `Book returned. Fine: KES ${fine}`);
});

const payFine = asyncHandler(async (req, res) => {
  const txn = await BookTransaction.findOne({ _id: req.params.id, schoolId: req.schoolId });
  if (!txn) return error(res, 'Transaction not found', 404);
  txn.finePaid = true;
  txn.status = 'returned';
  await txn.save();
  return success(res, txn, 'Fine marked as paid');
});

module.exports = { getBooks, getBook, createBook, updateBook, deleteBook, getTransactions, issueBook, returnBook, payFine };