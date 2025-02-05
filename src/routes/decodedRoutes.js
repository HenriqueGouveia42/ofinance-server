const express = require('express');
const router = express.Router();

const {getUserFromToken} = require('../controllers/authController');


router.get('/', getUserFromToken);

module.exports = router;