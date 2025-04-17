const express = require('express');
const {createTransaction, readPaidMonthTransactions, readUnpaidTransactions, updateTransaction} = require('../controllers/transactionController');
const router = express.Router();

router.post('/create-transaction', createTransaction);
router.patch('/update-transaction', updateTransaction)
router.get('/readPaidMonthTransaction', readPaidMonthTransactions);
router.get('/readUnpaidTransactions', readUnpaidTransactions)

module.exports = router;