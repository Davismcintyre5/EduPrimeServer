const mongoose = require('mongoose');
const FeeStructure = require('../../models/client/FeeStructure');
const FeeTransaction = require('../../models/client/FeeTransaction');
const Payment = require('../../models/client/Payment');
const Expense = require('../../models/client/Expense');
const Income = require('../../models/client/Income');
const Account = require('../../models/client/Account');
const Budget = require('../../models/client/Budget');
const Student = require('../../models/client/Student');
const AuditLog = require('../../models/client/Log');
const { success, error, paginated } = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const paginate = require('../../utils/pagination');
const { generateInvoiceNumber } = require('../../utils/helpers');
const logger = require('../../utils/logger');

// ─── PERMISSION HELPERS ───
const canAccessFinance = (role) => ['school_admin', 'principal', 'accountant'].includes(role);
const isAdmin = (role) => role === 'school_admin';

const cleanObjectIds = (data, fields) => {
  const cleaned = { ...data };
  fields.forEach(f => { if (cleaned[f] === '' || cleaned[f] === null || cleaned[f] === undefined) delete cleaned[f]; });
  return cleaned;
};

const getCurrentTerm = () => { const month = new Date().getMonth() + 1; if (month >= 1 && month <= 4) return 'term1'; if (month >= 5 && month <= 8) return 'term2'; return 'term3'; };

// ═══════════ FEE STRUCTURE ═══════════
const getFeeStructures = asyncHandler(async (req, res) => {
  const filter = { schoolId: req.schoolId };
  if (req.query.gradeId) filter.gradeId = req.query.gradeId;
  if (req.query.term) filter.term = req.query.term;
  if (req.query.academicYear) filter.academicYear = req.query.academicYear;
  return success(res, await FeeStructure.find(filter).populate('gradeId', 'name').populate('accountId', 'name code'));
});

const createFeeStructure = asyncHandler(async (req, res) => {
  if (!canAccessFinance(req.user.role)) return error(res, 'Access denied', 403);
  const data = cleanObjectIds({ ...req.body, schoolId: req.schoolId }, ['gradeId', 'accountId']);
  const fee = await FeeStructure.create(data);
  await AuditLog.create({ schoolId: req.schoolId, userId: req.user.id, action: 'fee_structure_created', details: fee.name, ip: req.ip });
  return success(res, fee, 'Fee structure created', 201);
});

const updateFeeStructure = asyncHandler(async (req, res) => {
  if (!canAccessFinance(req.user.role)) return error(res, 'Access denied', 403);
  const data = cleanObjectIds({ ...req.body }, ['gradeId', 'accountId']);
  const fee = await FeeStructure.findOneAndUpdate({ _id: req.params.id, schoolId: req.schoolId }, data, { new: true });
  if (!fee) return error(res, 'Not found', 404);
  return success(res, fee, 'Updated');
});

const deleteFeeStructure = asyncHandler(async (req, res) => {
  if (!canAccessFinance(req.user.role)) return error(res, 'Access denied', 403);
  await FeeStructure.findOneAndDelete({ _id: req.params.id, schoolId: req.schoolId });
  return success(res, null, 'Deleted');
});

// ═══════════ TRANSACTIONS ═══════════
const getTransactions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = { schoolId: req.schoolId };
  if (req.query.studentId) filter.studentId = req.query.studentId;
  if (req.query.status) { filter.status = { $in: req.query.status.split(',') }; }
  if (req.query.term) filter.term = req.query.term;
  const txs = await FeeTransaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('studentId', 'firstName lastName admissionNumber').populate('feeStructureId', 'name feeType').populate('recordedBy', 'name');
  const total = await FeeTransaction.countDocuments(filter);
  return paginated(res, txs, total, page, limit, 'Transactions fetched');
});

const createTransaction = asyncHandler(async (req, res) => {
  if (!canAccessFinance(req.user.role)) return error(res, 'Access denied', 403);
  if (!req.body.studentId || !req.body.amount) return error(res, 'Student and amount required', 400);
  const data = cleanObjectIds({ ...req.body, schoolId: req.schoolId, invoiceNumber: generateInvoiceNumber('INV'), recordedBy: req.user.id }, ['studentId', 'feeStructureId']);
  const tx = await FeeTransaction.create(data);
  await AuditLog.create({ schoolId: req.schoolId, userId: req.user.id, action: 'invoice_created', details: tx.invoiceNumber, ip: req.ip });
  return success(res, tx, 'Invoice created', 201);
});

const generateTermInvoices = asyncHandler(async (req, res) => {
  if (!canAccessFinance(req.user.role)) return error(res, 'Access denied', 403);
  const { term, academicYear, gradeId } = req.body;
  if (!term || !academicYear) return error(res, 'Term and academic year required', 400);
  const feeFilter = { schoolId: req.schoolId, term, academicYear, isActive: true };
  if (gradeId) feeFilter.gradeId = gradeId;
  const feeStructures = await FeeStructure.find(feeFilter);
  if (feeStructures.length === 0) return error(res, 'No active fee structures', 400);
  const students = await Student.find({ schoolId: req.schoolId, isActive: true });
  let created = 0, skipped = 0;
  for (const student of students) {
    const applicableFees = feeStructures.filter(f => !f.gradeId || String(f.gradeId) === String(student.grade));
    for (const fee of applicableFees) {
      const exists = await FeeTransaction.findOne({ schoolId: req.schoolId, studentId: student._id, feeStructureId: fee._id, term, academicYear });
      if (!exists) { await FeeTransaction.create({ schoolId: req.schoolId, studentId: student._id, feeStructureId: fee._id, invoiceNumber: generateInvoiceNumber('INV'), amount: fee.amount, dueDate: fee.dueDate || new Date(), term, academicYear, status: 'pending', recordedBy: req.user.id }); created++; }
      else { skipped++; }
    }
  }
  await AuditLog.create({ schoolId: req.schoolId, userId: req.user.id, action: 'invoices_generated', details: `${created} new, ${skipped} skipped - ${term} ${academicYear}`, ip: req.ip });
  return success(res, { created, skipped }, `Generated ${created} invoices`);
});

const getStudentBalance = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { term, academicYear } = req.query;
  const filter = { schoolId: req.schoolId, studentId };
  if (term) filter.term = term;
  if (academicYear) filter.academicYear = academicYear;
  const transactions = await FeeTransaction.find(filter).populate('feeStructureId', 'name feeType').sort({ createdAt: -1 });
  const total = transactions.reduce((s, t) => s + t.amount, 0);
  const paid = transactions.reduce((s, t) => s + t.paidAmount, 0);
  return success(res, { studentId, total, paid, balance: total - paid, transactions: transactions.map(t => ({ _id: t._id, invoiceNumber: t.invoiceNumber, feeType: t.feeStructureId?.feeType, feeName: t.feeStructureId?.name, amount: t.amount, paidAmount: t.paidAmount, balance: t.amount - t.paidAmount, status: t.status, dueDate: t.dueDate, term: t.term, academicYear: t.academicYear })) });
});

const getAllBalances = asyncHandler(async (req, res) => {
  const { term, academicYear } = req.query;
  const students = await Student.find({ schoolId: req.schoolId, isActive: true }).select('firstName lastName admissionNumber');
  const balances = await Promise.all(students.map(async (student) => {
    const filter = { schoolId: req.schoolId, studentId: student._id };
    if (term) filter.term = term;
    if (academicYear) filter.academicYear = academicYear;
    const txns = await FeeTransaction.find(filter);
    const total = txns.reduce((s, t) => s + t.amount, 0);
    const paid = txns.reduce((s, t) => s + t.paidAmount, 0);
    return { studentId: student._id, studentName: `${student.firstName} ${student.lastName}`, admissionNumber: student.admissionNumber, total, paid, balance: total - paid };
  }));
  return success(res, balances);
});

// ═══════════ PAYMENTS ═══════════
const getPayments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = { schoolId: req.schoolId };
  if (req.query.studentId) filter.studentId = req.query.studentId;
  const payments = await Payment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('studentId', 'firstName lastName admissionNumber').populate('invoiceId', 'invoiceNumber').populate('recordedBy', 'name').populate('accountId', 'name bankName accountNumber');
  const total = await Payment.countDocuments(filter);
  return paginated(res, payments, total, page, limit, 'Payments fetched');
});

const recordPayment = asyncHandler(async (req, res) => {
  if (!canAccessFinance(req.user.role)) return error(res, 'Access denied', 403);
  const { amount, paymentMethod } = req.body;
  if (!amount || !paymentMethod) return error(res, 'Amount and payment method required', 400);
  const data = cleanObjectIds({ ...req.body, schoolId: req.schoolId, receiptNumber: generateInvoiceNumber('RCT'), recordedBy: req.user.id }, ['studentId', 'invoiceId', 'accountId']);
  const payment = await Payment.create(data);
  if (data.invoiceId) { const invoice = await FeeTransaction.findById(data.invoiceId); if (invoice) { invoice.paidAmount += Number(amount); invoice.status = invoice.paidAmount >= invoice.amount ? 'paid' : 'partial'; invoice.paidDate = new Date(); invoice.paymentMethod = paymentMethod; invoice.paymentReference = req.body.reference; await invoice.save(); } }
  if (data.accountId) { await Account.findByIdAndUpdate(data.accountId, { $inc: { balance: Number(amount) } }); }
  await AuditLog.create({ schoolId: req.schoolId, userId: req.user.id, action: 'payment_recorded', details: `${payment.receiptNumber} - ${amount}`, ip: req.ip });
  return success(res, payment, 'Payment recorded', 201);
});

// ═══════════ INCOME ═══════════
const getIncomes = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = { schoolId: req.schoolId };
  if (req.query.accountId) filter.accountId = req.query.accountId;
  const incomes = await Income.find(filter).sort({ date: -1 }).skip(skip).limit(limit).populate('accountId', 'name bankName accountNumber').populate('recordedBy', 'name');
  return paginated(res, incomes, await Income.countDocuments(filter), page, limit, 'Incomes fetched');
});

const createIncome = asyncHandler(async (req, res) => {
  if (!canAccessFinance(req.user.role)) return error(res, 'Access denied', 403);
  const { accountId, amount } = req.body;
  if (!accountId || !amount) return error(res, 'Account and amount required', 400);
  const data = cleanObjectIds({ ...req.body, schoolId: req.schoolId, recordedBy: req.user.id }, ['accountId']);
  const income = await Income.create(data);
  await Account.findByIdAndUpdate(accountId, { $inc: { balance: Number(amount) } });
  await Budget.findOneAndUpdate({ schoolId: req.schoolId, accountId, academicYear: `${new Date().getFullYear()}-${new Date().getFullYear()+1}`, term: getCurrentTerm(), type: 'income', status: { $in: ['approved', 'active'] } }, { $inc: { actualAmount: Number(amount) } });
  return success(res, income, 'Income recorded', 201);
});

// ═══════════ EXPENSES ═══════════
const getExpenses = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = { schoolId: req.schoolId };
  if (req.query.category) filter.category = req.query.category;
  const expenses = await Expense.find(filter).sort({ date: -1 }).skip(skip).limit(limit).populate('accountId', 'name code bankName accountNumber').populate('recordedBy', 'name');
  return paginated(res, expenses, await Expense.countDocuments(filter), page, limit, 'Expenses fetched');
});

const createExpense = asyncHandler(async (req, res) => {
  if (!canAccessFinance(req.user.role)) return error(res, 'Access denied', 403);
  const data = cleanObjectIds({ ...req.body, schoolId: req.schoolId, recordedBy: req.user.id }, ['accountId']);
  const expense = await Expense.create(data);
  if (data.accountId) { await Account.findByIdAndUpdate(data.accountId, { $inc: { balance: -Number(expense.amount) } }); await Budget.findOneAndUpdate({ schoolId: req.schoolId, accountId: data.accountId, academicYear: `${new Date().getFullYear()}-${new Date().getFullYear()+1}`, term: getCurrentTerm(), type: 'expense', status: { $in: ['approved', 'active'] } }, { $inc: { actualAmount: Number(expense.amount) } }); }
  return success(res, expense, 'Expense created', 201);
});

const updateExpense = asyncHandler(async (req, res) => { if (!canAccessFinance(req.user.role)) return error(res, 'Access denied', 403); const data = cleanObjectIds({ ...req.body }, ['accountId']); const expense = await Expense.findOneAndUpdate({ _id: req.params.id, schoolId: req.schoolId }, data, { new: true }); if (!expense) return error(res, 'Not found', 404); return success(res, expense, 'Updated'); });
const deleteExpense = asyncHandler(async (req, res) => { if (!canAccessFinance(req.user.role)) return error(res, 'Access denied', 403); await Expense.findOneAndDelete({ _id: req.params.id, schoolId: req.schoolId }); return success(res, null, 'Deleted'); });

// ═══════════ ACCOUNTS ═══════════
const getAccounts = asyncHandler(async (req, res) => { const filter = { schoolId: req.schoolId }; if (req.query.type) filter.type = req.query.type; return success(res, await Account.find(filter).sort({ code: 1 })); });
const createAccount = asyncHandler(async (req, res) => { if (!canAccessFinance(req.user.role)) return error(res, 'Access denied', 403); return success(res, await Account.create({ ...req.body, schoolId: req.schoolId }), 'Account created', 201); });
const updateAccount = asyncHandler(async (req, res) => { if (!canAccessFinance(req.user.role)) return error(res, 'Access denied', 403); const account = await Account.findOneAndUpdate({ _id: req.params.id, schoolId: req.schoolId }, req.body, { new: true }); if (!account) return error(res, 'Not found', 404); return success(res, account, 'Updated'); });
const deleteAccount = asyncHandler(async (req, res) => { if (!canAccessFinance(req.user.role)) return error(res, 'Access denied', 403); await Account.findOneAndDelete({ _id: req.params.id, schoolId: req.schoolId }); return success(res, null, 'Deleted'); });

// ═══════════ BUDGETS ═══════════
const getBudgets = asyncHandler(async (req, res) => { const filter = { schoolId: req.schoolId }; if (req.query.term) filter.term = req.query.term; if (req.query.academicYear) filter.academicYear = req.query.academicYear; return success(res, await Budget.find(filter).populate('accountId', 'name code type')); });
const createBudget = asyncHandler(async (req, res) => { if (!canAccessFinance(req.user.role)) return error(res, 'Access denied', 403); const data = cleanObjectIds({ ...req.body, schoolId: req.schoolId, createdBy: req.user.id }, ['accountId']); return success(res, await Budget.create(data), 'Budget created', 201); });
const updateBudget = asyncHandler(async (req, res) => { if (!canAccessFinance(req.user.role)) return error(res, 'Access denied', 403); const data = cleanObjectIds({ ...req.body }, ['accountId']); const budget = await Budget.findOneAndUpdate({ _id: req.params.id, schoolId: req.schoolId }, data, { new: true }); if (!budget) return error(res, 'Not found', 404); return success(res, budget, 'Updated'); });
const deleteBudget = asyncHandler(async (req, res) => { if (!canAccessFinance(req.user.role)) return error(res, 'Access denied', 403); await Budget.findOneAndDelete({ _id: req.params.id, schoolId: req.schoolId }); return success(res, null, 'Deleted'); });

// ═══════════ REPORTS ═══════════
const getFinanceSummary = asyncHandler(async (req, res) => {
  const { term, academicYear } = req.query;
  const matchFilter = { schoolId: new mongoose.Types.ObjectId(req.schoolId), status: { $in: ['paid', 'partial'] } };
  if (term) matchFilter.term = term;
  if (academicYear) matchFilter.academicYear = academicYear;
  const [incomeResult, expenseResult, pendingResult] = await Promise.all([FeeTransaction.aggregate([{ $match: matchFilter }, { $group: { _id: null, total: { $sum: '$paidAmount' } } }]), Expense.aggregate([{ $match: { schoolId: new mongoose.Types.ObjectId(req.schoolId) } }, { $group: { _id: null, total: { $sum: '$amount' } } }]), FeeTransaction.countDocuments({ schoolId: req.schoolId, status: { $in: ['pending', 'overdue'] } })]);
  return success(res, { totalIncome: incomeResult[0]?.total || 0, totalExpenses: expenseResult[0]?.total || 0, pendingFees: pendingResult, balance: (incomeResult[0]?.total || 0) - (expenseResult[0]?.total || 0) });
});

module.exports = { getFeeStructures, createFeeStructure, updateFeeStructure, deleteFeeStructure, getTransactions, createTransaction, generateTermInvoices, getStudentBalance, getAllBalances, getPayments, recordPayment, getIncomes, createIncome, getExpenses, createExpense, updateExpense, deleteExpense, getAccounts, createAccount, updateAccount, deleteAccount, getBudgets, createBudget, updateBudget, deleteBudget, getFinanceSummary };