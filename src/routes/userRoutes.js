const express = require('express');
const {getUserDataController} = require('../controllers/userController.js');
const router = express.Router();

router.get('/get-user-data', getUserDataController);

module.exports = router;