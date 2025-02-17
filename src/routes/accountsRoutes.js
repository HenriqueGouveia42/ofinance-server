const express = require('express');
const router = express.Router();
const {createAccount, updateBalance, getAccounts} = require('../controllers/accountsController')

router.post('/create-account', createAccount);
router.get('/get-accounts', getAccounts);
router.patch('/update-balance', updateBalance)

module.exports = router;