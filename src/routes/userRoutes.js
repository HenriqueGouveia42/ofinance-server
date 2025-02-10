const express = require('express');
const router = express.Router();

const {getUserFromToken} = require('../controllers/authController');


router.get('/get-user', getUserFromToken);

module.exports = router;