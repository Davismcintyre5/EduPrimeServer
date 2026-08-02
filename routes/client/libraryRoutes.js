const express = require('express');
const router = express.Router();
const auth = require('../../middleware/client/auth');
const tenant = require('../../middleware/client/tenant');
const { getBooks, getBook, createBook, updateBook, deleteBook, getTransactions, issueBook, returnBook, payFine } = require('../../controllers/client/libraryController');

router.use(auth, tenant);

router.get('/books', getBooks);
router.get('/books/:id', getBook);
router.post('/books', createBook);
router.put('/books/:id', updateBook);
router.delete('/books/:id', deleteBook);

router.get('/transactions', getTransactions);
router.post('/issue', issueBook);
router.post('/return/:id', returnBook);
router.patch('/pay-fine/:id', payFine);

module.exports = router;