const express = require('express');
const router = express.Router();

const {loginController, checkAuthStatusController} = require('../controllers/authController');


router.post('/', loginController);
router.get('/status', checkAuthStatusController);

module.exports = router;