const express = require('express');
const router = express.Router();
const {newAccountController} = require('../controllers/NewItemsController')

router.post('/', newAccountController);