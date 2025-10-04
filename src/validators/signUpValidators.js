const {z} = require('zod');

const signUpSchema = z.object({
    body: z.object({
        email: z.email({
            required_error: "Email é obrigatorio",
            invalid_type_error: "Email precisa ser do tipo email"
        }),
        
        name: z.string({
            required_error: "Nome é obrigatorio",
            invalid_type_error: "Nome precisa ser do tipo 'string'"
        }).min(3, {message: "Nome precisa ter no minimo 3 caracteres"}),
        
        password: z.string({
            required_error: "A senha é obrigatoria",
            invalid_type_error: "A senha precisa ser do tipo 'string'"
        })
    })
})

const verifyCodeSchema = z.object({
    body: z.object({
        
        email: z.email({
            required_error: "Email é obrigatorio",
            invalid_type_error: "Email precisa ser do tipo email"
        }),
        code: z.string({
            required_error: "Codigo é obrigatorio",
            invalid_type_error: "Codigo precisa ser do tipo string"
        }).min(3, {message: "Codigo tem no minimo 3 numeros"})
    })
})

module.exports = {signUpSchema, verifyCodeSchema}
