const express = require('express');
const {getUserDataController} = require('../controllers/userControllers.js');
const router = express.Router();

router.get('/get-user-data', getUserDataController);

module.exports = router;