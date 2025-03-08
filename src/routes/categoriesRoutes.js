const express = require('express');
const router = express.Router();

const {newCategory, renameCategory, deleteCategory} = require('../controllers/categoriesController')

router.post('/create-category', newCategory);
router.patch('/rename-category', renameCategory)
router.delete('/delete-category', deleteCategory)

module.exports = router;