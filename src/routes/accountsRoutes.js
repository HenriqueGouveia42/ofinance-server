const express = require('express');
const router = express.Router();
const {createAccount, updateBalance, getAccounts, deleteAccount} = require('../controllers/accountsController')

router.post('/create-account', createAccount);
router.get('/get-accounts', getAccounts);
router.patch('/update-balance', updateBalance);
router.delete('/delete-account', deleteAccount);

module.exports = router;