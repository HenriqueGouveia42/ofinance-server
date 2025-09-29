const express = require('express');
const router = express.Router();

const
    {
        createCategoryController,
        renameCategoryController,
        deleteCategoryController
    } = require('../controllers/categoryControllers')

router.post('/create-category', createCategoryController);
router.patch('/rename-category', renameCategoryController)
router.delete('/delete-category', deleteCategoryController)

module.exports = router;