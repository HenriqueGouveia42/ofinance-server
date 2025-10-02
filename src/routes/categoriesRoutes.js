const express = require('express');
const router = express.Router();

const
    {
        createCategoryController,
        renameCategoryController,
        deleteCategoryController
    } = require('../controllers/categoryControllers')

const validate = require('../middlewares/requestValidatorMiddleware')
const {createCategorySchema, renameCategorySchema, deleteCategorySchema} = require('../validators/categoryValidators')

router.post('/create-category',validate(createCategorySchema), createCategoryController);
router.patch('/rename-category', validate(renameCategorySchema), renameCategoryController)
router.delete('/delete-category',validate(deleteCategorySchema), deleteCategoryController)

module.exports = router;