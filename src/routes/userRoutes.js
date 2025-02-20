const express = require('express');
const {getUserData} = require('../controllers/userController.js');
const router = express.Router();

router.get('/get-user-data', getUserData);

module.exports = router;