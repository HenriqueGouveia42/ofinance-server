const express = require('express');
const 
    {
        createTransactionController,
        deleteTransactionController,
        updateTransactionController,
        getMonthlyPaidFlowSummaryController,
        getUnpaidTransactionsSummaryController
    } = require('../controllers/transactionControllers');
    
const router = express.Router();

router.post('/create-transaction', createTransactionController);
router.delete('/delete-transaction', deleteTransactionController);
router.patch('/update-transaction', updateTransactionController)
router.get('/get-monthly-paid-flow-summary', getMonthlyPaidFlowSummaryController);
router.get('/get-unpaid-transactions-summary', getUnpaidTransactionsSummaryController)

module.exports = router;