const express = require('express');
const router = express.Router();

const {newCurrency, updateDefaultCurrency, deleteCurrency} = require('../controllers/currencyController');

router.post('/create-currency', newCurrency);
router.patch('/update-default-currency', updateDefaultCurrency);
router.delete('/delete-currency', deleteCurrency)

module.exports = router;