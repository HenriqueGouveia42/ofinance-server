const express = require('express');
const router = express.Router();

const
    {
        createCategoryController,
        renameCategoryController,
        deleteCategoryController
    } = require('../controllers/categoryControllers')

const validate = require('../middlewares/requestValidatorMiddleware')
const {createCategoryValidator, renameCategoryValidator, deleteCategoryValidator} = require('../validators/categoryValidators')

router.post('/create-category',validate(createCategoryValidator), createCategoryController);
router.patch('/rename-category', validate(renameCategoryValidator), renameCategoryController)
router.delete('/delete-category',validate(deleteCategoryValidator), deleteCategoryController)

module.exports = router;