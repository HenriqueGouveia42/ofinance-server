const express = require('express');
const router = express.Router();

const {loginController, checkAuthStatusController} = require('../controllers/authControllers');


router.post('/', loginController);
router.get('/status', checkAuthStatusController);

module.exports = router;