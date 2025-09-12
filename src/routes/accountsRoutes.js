const express = require('express');
const router = express.Router();
const {createAccountController, updateBalanceController, getAccountsController, deleteAccountController, renameAccountController} = require('../controllers/accountsController')

router.post('/create-account', createAccountController);
router.get('/get-accounts', getAccountsController);
router.patch('/update-balance', updateBalanceController);
router.patch('/rename-account', renameAccountController )
router.delete('/delete-account', deleteAccountController);

module.exports = router;