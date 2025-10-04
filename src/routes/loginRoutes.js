const express = require('express');
const router = express.Router();

const {loginController, checkAuthStatusController} = require('../controllers/authControllers');
const validate = require('../middlewares/requestValidatorMiddleware')
const {loginSchema} = require('../validators/loginValidators')

router.post('/',validate(loginSchema), loginController);
router.get('/status', checkAuthStatusController);

module.exports = router;