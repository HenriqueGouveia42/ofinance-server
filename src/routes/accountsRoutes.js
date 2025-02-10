const express = require('express');
const router = express.Router();
const {createAccount, updateBalance} = require('../controllers/accountsController')

router.post('/create-account', createAccount);
router.patch('/update-balance', updateBalance)

module.exports = router;