const { TransactionType } = require('@prisma/client');
const { z } = require('zod');

const createTransactionSchema = z.object({
    body: z.object({

        amount: z.number({
            required_error: "O valor (amount) é obrigatório.",
            invalid_type_error: "O valor deve ser um número."
        }).positive({ message: "O valor da transação deve ser positivo." }).min(0.1, {message: "O valor da transacao (amount) deve ser no minimo 0.1"})
        .max(10000000, {message: "O valor da transacao (amount) deve ser no maixmo 10.000.000"}),

        type: z.enum(['revenue', 'expense'], {
            required_error: "O tipo (type) é obrigatório.",
            errorMap: () => ({ message: "O tipo deve ser 'revenue' ou 'expense'." })
        }),

        paid_out: z.boolean({
            required_error: "O status de pagamento (paid_out) é obrigatório.",
            invalid_type_error: "O status de pagamento deve ser um booleano."
        }),

        payDay: z.coerce.date({
            required_error: "A data do pagamento é obrigatória.",
            invalid_type_error: "A data do pagamento deve estar em um formato de data válido."
        }),

        categoryId: z.number({
            required_error: "O ID da categoria (categoryId) é obrigatório."
        }).int().positive(),

        accountId: z.number({
            required_error: "O ID da conta (accountId) é obrigatório."
        }).int().positive(),

        description: z.string().max(100, { message: "A descrição não pode ultrapassar 100 caracteres." }).optional(),
        attachment: z.string().optional(),
        remindMe: z.coerce.date().optional(),

        repeatTransaction: z.object({
            repeatEvery: z.number().int().positive(),
            repeatEachOptions: z.enum(['day', 'week', 'month', 'year']),
            repeatEachWeekdays: z.array(z.enum(
                ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
            )).optional(),
            ends: z.enum(['never', 'at', 'after']),
            endsAt: z.coerce.date().optional(),
            endsAfterOccurrencies: z.number().int().positive().optional() // Corrigi o typo "Ocurrencies"
        }).optional()

    }).superRefine((data, ctx) => {
        
        if (data.repeatTransaction) {
            const repeat = data.repeatTransaction;

            if (repeat.repeatEachOptions === 'week' && (!repeat.repeatEachWeekdays || repeat.repeatEachWeekdays.length === 0)) {
                ctx.addIssue({
                    code: 'custom',
                    message: "Para repetição semanal, a lista de dias (repeatEachWeekdays) é obrigatória.",
                    path: ['repeatTransaction', 'repeatEachWeekdays'],
                });
            }

            if (repeat.ends === 'at' && !repeat.endsAt) {
                ctx.addIssue({
                    code: 'custom',
                    message: "Se 'ends' for 'at', a data de término (endsAt) é obrigatória.",
                    path: ['repeatTransaction', 'endsAt'],
                });
            }

            if (repeat.ends === 'after' && !repeat.endsAfterOccurrencies) {
                ctx.addIssue({
                    code: 'custom',
                    message: "Se 'ends' for 'after', o número de ocorrências (endsAfterOccurrencies) é obrigatório.",
                    path: ['repeatTransaction', 'endsAfterOccurrencies']
                });
            }
        }
    })
});

const deleteTransactionSchema = z.object({

    params: z.object({
        id: z.string().transform(Number).refine(val => !isNaN(val) && val > 0, {
            message: "O ID da transformacao deve ser um número valido na URL"
        }),
    }),

    body: z.object({
        amount: z.number().positive("O valor deve ser um numero positivo").optional(),
        type: z.enum(Object.values(TransactionType)).optional(),
        paid_out: z.boolean().optional(),
        payDay: z.coerce.date({
            invalid_type_error: "O campo 'payDay' deve ser uma data válida"
        }).optional(),
        description: z.string().optional(),
        attachment: z.string().optional(),
        remindMe: z.coerce.date({
            invalid_type_error: "O campo 'remindMe' deve ser uma data válida"
        }).optional(),
        categoryId: z.number().int().positive().optional(),
        accountId: z.number().int().positive().optional()

    }).refine(data =>{
        if (data.type && data.categoryId === undefined){
            return false
        }
        return true
    }, {
        message: "Ao alterar o 'type' de uma transacao, um novo 'categoryId' correspondente é obrigatorio",
        path: ["categoryId"]
    })

})

const monthMap = {
    Janeiro: 0,
    Fevereiro: 1,
    Março: 2,
    Abril: 3,
    Maio: 4,
    Junho: 5,
    Julho: 6,
    Agosto: 7,
    Setembro: 8,
    Outubro: 9,
    Novembro: 10,
    Dezembro: 11
}

const monthNames = Object.keys(monthMap);

const getMonthlyPaidFlowSummarySchema = z.object({
    query: z.object({

        year: z.coerce.number({
            required_error: "O parametro 'year' é obrigatorio",
            invalid_type_error: "O ano deve ser um numero valido"
        }).int({message: "O ano deve ser um numero inteiro"}).min(2000,{message:"O ano deve ser igual ou superior a 2000"}),
        
        month: z.enum(monthNames, {
                required_error: "O parametro 'month' é obrigatorio na URL",
                errorMap: () => ({message: "O mes fornecido é invalido. Use um nome de mes valido (ex: 'Janeiro')"})
        })
    })
})

const updateTransactionSchema = z.object({
    body: z.object({

    })
})

module.exports = { createTransactionSchema, deleteTransactionSchema, getMonthlyPaidFlowSummarySchema};