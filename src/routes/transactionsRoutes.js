const express = require('express');
const {createTransaction, readMonthTransactions, readUnpaidTransactions, getAllTranscations} = require('../controllers/transactionController');
const router = express.Router();

router.post('/create-transaction', createTransaction);
router.get('/readMonthTransaction', readMonthTransactions);
router.get('/readUnpaidTransactions', readUnpaidTransactions)
router.get('/get-all-transactions', getAllTranscations)

module.exports = router;