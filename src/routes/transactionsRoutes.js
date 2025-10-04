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

const validate = require('../middlewares/requestValidatorMiddleware')
const {createTransactionSchema, deleteTransactionSchema, getMonthlyPaidFlowSummarySchema} = require('../validators/transactionValidators')

router.post('/create-transaction',validate(createTransactionSchema), createTransactionController);
router.delete('/delete-transaction',validate(deleteTransactionSchema), deleteTransactionController);
router.patch('/update-transaction', updateTransactionController)
router.get('/get-monthly-paid-flow-summary',validate(getMonthlyPaidFlowSummarySchema), getMonthlyPaidFlowSummaryController);
router.get('/get-unpaid-transactions-summary', getUnpaidTransactionsSummaryController)

module.exports = router;