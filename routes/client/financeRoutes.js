const express = require('express');
const router = express.Router();
const auth = require('../../middleware/client/auth');
const tenant = require('../../middleware/client/tenant');
const {
  getFeeStructures, createFeeStructure, updateFeeStructure, deleteFeeStructure,
  getTransactions, createTransaction, generateTermInvoices, getStudentBalance, getAllBalances,
  getPayments, recordPayment,
  getIncomes, createIncome,
  getExpenses, createExpense, updateExpense, deleteExpense,
  getAccounts, createAccount, updateAccount, deleteAccount,
  getBudgets, createBudget, updateBudget, deleteBudget,
  getFinanceSummary,
} = require('../../controllers/client/financeController');

router.use(auth, tenant);

// Fee Structure
router.get('/fee-structures', getFeeStructures);
router.post('/fee-structures', createFeeStructure);
router.put('/fee-structures/:id', updateFeeStructure);
router.delete('/fee-structures/:id', deleteFeeStructure);

// Transactions / Invoices
router.get('/transactions', getTransactions);
router.post('/transactions', createTransaction);

// Generate Term Invoices
router.post('/generate-invoices', generateTermInvoices);

// Student Balances
router.get('/student-balance/:studentId', getStudentBalance);
router.get('/all-balances', getAllBalances);

// Payments
router.get('/payments', getPayments);
router.post('/payments', recordPayment);

// Income
router.get('/incomes', getIncomes);
router.post('/incomes', createIncome);

// Expenses
router.get('/expenses', getExpenses);
router.post('/expenses', createExpense);
router.put('/expenses/:id', updateExpense);
router.delete('/expenses/:id', deleteExpense);

// Accounts
router.get('/accounts', getAccounts);
router.post('/accounts', createAccount);
router.put('/accounts/:id', updateAccount);
router.delete('/accounts/:id', deleteAccount);

// Budgets
router.get('/budgets', getBudgets);
router.post('/budgets', createBudget);
router.put('/budgets/:id', updateBudget);
router.delete('/budgets/:id', deleteBudget);

// Reports
router.get('/summary', getFinanceSummary);

module.exports = router;