const express = require('express');
const router = express.Router();

const {createCategory, renameCategory, deleteCategory} = require('../controllers/categoriesController')

router.post('/create-category', createCategory);
router.patch('/rename-category', renameCategory)
router.delete('/delete-category', deleteCategory)

module.exports = router;