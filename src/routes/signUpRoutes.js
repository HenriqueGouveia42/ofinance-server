//Mapeamento das rotas para os controladores correspondentes

const express = require('express');
const {signUpController, verifyCodeController} = require('../controllers/authControllers');
const router = express.Router();
const validate = require('../middlewares/requestValidatorMiddleware')
const {signUpValidator, verifyCodeValidator} = require('../validators/signUpValidators')

router.post('/',validate(signUpValidator), signUpController);
router.post('/verify',validate(verifyCodeValidator), verifyCodeController);

module.exports = router;