const { z } = require('zod');

const createAccountSchema = z.object({

    body: z.object({

        accountName: z.string({
            required_error: "O nome da conta é obrigatorio",
            invalid_type_error: "O nome da nova conta deve ser uma string",
        }).min(3, {message: "O nome da conta deve ter no minimo 3 caracteres"}),

        initialBalance: z.number({
            required_error: "O saldo inicial eh obrigatorio.",
            invalid_type_error: "O saldo inicial deve ser um número",
        })
    })
})

const updateAccountBalanceSchema = z.object({
    body: z.object({
        accountId: z.number(),
        newAccountBalance: z.number()
    })
})

const renameAccountSchema = z.object({
    body: z.object({
        accountId: z.number(),
        accountNewName: z.string().min(3)
    })
})

const deleteAccountSchema = z.object({
    body: z.object({
        accountId: z.number()
    })
})


module.exports = {createAccountSchema, updateAccountBalanceSchema, renameAccountSchema, deleteAccountSchema}