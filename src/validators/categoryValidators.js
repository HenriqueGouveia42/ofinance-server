const { z } = require('zod');

const createCategoryValidator = z.object({
    body: z.object({
        name: z.string({
            required_error: "O campo 'name' é obrigatorio",
            invalid_type_error: "O nome da categoria deve ser uma string"
        }).min(3, {message: "O nome da categoria deve ter no minimo 3 catacteres"}),
        
        type: z.enum(['revenue', 'expense'], {
            required_error: "O campo 'type' é obrigatorio",
            errorMap: () => ({message: "O tipo deve ser 'revenue' ou 'expense'"})
        })
    })
})

const renameCategoryValidator = z.object({
    body: z.object({
        categoryId: z.number({
            required_error: "O campo 'categoryId' é obrigatorio",
            invalid_type_error: "O nome da categoria deve ser uma string"
        }),

        newCategoryName: z.string().min(3, {message: "O novo nome da categoria deve ter no minimo 3 caracteres"})
    })
})


const deleteCategoryValidator = z.object({
    body: z.object({

        categoryId: z.number({
            required_error: "O campo 'categoryId' é obrigatorio",
            invalid_type_error: "O campo 'categoryId' deve ser um numero"
        })

    })
})

module.exports = {
    createCategoryValidator, renameCategoryValidator, deleteCategoryValidator
}
