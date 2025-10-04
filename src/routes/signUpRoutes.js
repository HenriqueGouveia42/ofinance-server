//Mapeamento das rotas para os controladores correspondentes

const express = require('express');
const {signUpController, verifyCodeController} = require('../controllers/authControllers');
const router = express.Router();
const validate = require('../middlewares/requestValidatorMiddleware')
const {signUpSchema, verifyCodeSchema} = require('../validators/signUpValidators')

router.post('/',validate(signUpSchema), signUpController);
router.post('/verify',validate(verifyCodeSchema), verifyCodeController);

module.exports = router;