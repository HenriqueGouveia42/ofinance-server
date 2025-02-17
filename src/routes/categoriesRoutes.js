const express = require('express');
const router = express.Router();

const {newCategory} = require('../controllers/categoriesController')

router.post('/create-category', newCategory);

module.exports = router;