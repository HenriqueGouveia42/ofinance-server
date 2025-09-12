const express = require('express');
const router = express.Router();
const {createAccountController, updateBalance, getAccounts, deleteAccount, renameAccount} = require('../controllers/accountsController')

router.post('/create-account', createAccountController);
router.get('/get-accounts', getAccounts);
router.patch('/update-balance', updateBalance);
router.patch('/rename-account', renameAccount )
router.delete('/delete-account', deleteAccount);

module.exports = router;