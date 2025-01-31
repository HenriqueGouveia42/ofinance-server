//Mapeamento das rotas para os controladores correspondentes

const express = require('express');
const {signUpController, verifyCodeController} = require('../controllers/authController');
const router = express.Router();

router.post('/', signUpController);
router.post('/verify', verifyCodeController);

module.exports = router;