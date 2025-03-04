const express = require('express');
const router = express.Router();

const {newCategory, renameCategory} = require('../controllers/categoriesController')

router.post('/create-category', newCategory);
router.patch('/rename-category', renameCategory)

module.exports = router;