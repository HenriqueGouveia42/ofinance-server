const { z } = require('zod');

const createTransactionSchema = z.object({
    body: z.object({
        amount: z.number({
            required_error: "O valor (amount) é obrigatório.",
            invalid_type_error: "O valor deve ser um número."
        }).positive({ message: "O valor da transação deve ser positivo." }),

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

module.exports = { createTransactionSchema };