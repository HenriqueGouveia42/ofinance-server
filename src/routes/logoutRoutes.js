const express = require('express');
const router = express.Router();

const {logoutController} = require('../controllers/authControllers');


router.post('/', logoutController);

module.exports = router;