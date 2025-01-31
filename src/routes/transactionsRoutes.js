const express = require('express');
const {createTransaction, readMonthTransactions} = require('../controllers/transactionController');
const router = express.Router();


router.post('/create', createTransaction);
router.get('/readMonthTransaction', readMonthTransactions);

module.exports = router;