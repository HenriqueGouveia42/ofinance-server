
const express = require('express');
const {loginController, verifyTokenController} = require('../controllers/authController');
const router = express.Router();

router.post('/', loginController);
router.post('/validate-token', verifyTokenController);

module.exports = router;