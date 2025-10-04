const { z } = require('zod');

const loginSchema = z.object({

    body: z.object({
        email: z.email({
            required_error: "O email de login é obrigatorio",
            invalid_type_error: "O login da conta deve ser no formato de email"
        }),
        password: z.string({
            required_error: "A senha é obrigatoria",
            invalid_type_error: "A senha precisa ser do tipo 'string'"
        })
    })
})

module.exports = {loginSchema}