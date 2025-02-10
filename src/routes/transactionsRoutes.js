const express = require('express');
const {createTransaction, readMonthTransactions, readUnpaidTransactions} = require('../controllers/transactionController');
const router = express.Router();

router.post('/create-transaction', createTransaction);
router.get('/readMonthTransaction', readMonthTransactions);
router.get('/readUnpaidTransactions', readUnpaidTransactions)

module.exports = router;