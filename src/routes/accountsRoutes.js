const express = require('express');
const router = express.Router();
const {createAccountController, updateAccountBalanceController, getAccountsController, deleteAccountController, renameAccountController} = require('../controllers/accountsController')

const validate = require('../middlewares/requestValidatorMiddleware')
const {createAccountSchema, updateAccountBalanceSchema, renameAccountSchema, deleteAccountSchema} = require('../validators/accountValidators')

router.post('/create-account', validate(createAccountSchema), createAccountController);
router.get('/get-accounts', getAccountsController);
router.patch('/update-account-balance', validate(updateAccountBalanceSchema), updateAccountBalanceController);
router.patch('/rename-account', validate(renameAccountSchema), renameAccountController )
router.delete('/delete-account', validate(deleteAccountSchema), deleteAccountController);

module.exports = router;