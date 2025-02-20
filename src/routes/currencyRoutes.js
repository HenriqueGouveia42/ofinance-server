const express = require('express');
const router = express.Router();

const {newCurrency, updateDefaultCurrency} = require('../controllers/currencyController');

router.post('/create-currency', newCurrency);
router.patch('/update-default-currency', updateDefaultCurrency);

module.exports = router;