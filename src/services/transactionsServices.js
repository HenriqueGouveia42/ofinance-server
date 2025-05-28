const {prisma} = require('../config/prismaClient');

//Futuramente será implementado o cache
const {getOrSetCache} = require('../services/cacheService');

const newTransaction = async(
    amount,
    type,
    paid_out,
    payDay,
    description,
    attachment,
    fixed,
    repeat,
    typeRepeat,
    remindMe,
    createdAt,
    updatedAt,
    userId,
    categoryId,
    accountId,
) => {
    try{
        const transaction = await prisma.transactions.create({
            data:{
                amount,
                type,
                paid_out,
                payDay,
                description,
                attachment,
                fixed,
                repeat,
                typeRepeat,
                remindMe,
                createdAt,
                updatedAt,
                userId,
                categoryId,
                accountId,
            }
        })
        return transaction;
    }catch(error){
        console.error("Erro no serviço de criar nova transacao", error);
        throw new Error('Erro no serviço de criar nova transacao');
    }
}

const checkIfTransactionTypeMatchesToCategoryType = async (userId, TransactionType, CategoryId) => {
    try{
        
        const getCategory = await prisma.expenseAndRevenueCategories.findUnique({
            where:{
                userId: userId,
                type: TransactionType,
                id: CategoryId,
            }
        });
        
        if (!getCategory){
            throw new Error("Categoria não encontrada ou incompatível com o tipo da transação.");
        }
        
        return getCategory;
    }catch(error){
        console.error("Erro ao verificar se o tipo de transacao escolhido confere com o tipo de categoria", error);
        throw new Error("Erro ao validar categoria da transação ou tipo da transação não bate com o tipo da categoria");
    }
}

const readMonthPaidTransactionsService = async (userId, startDate, endDate) =>{
    try{
        const readMonthT = await prisma.transactions.groupBy({
            by: ['type'],
            _sum: {
                amount: true
            },
            where: {
                userId: userId,
                paid_out: true,
                payDay:{
                    gte: startDate,
                    lt: endDate
                }
            }
            });
            return readMonthT;
    }catch(error){
        console.error('Erro ao buscar as transacoes do mes');
        throw new Error('Erro ao buscar as transacoes do mes')
    }
}

const readUnpaidTransactionsService = async(userId) =>{
    try{
        
       const [revenues, expenses] = await Promise.all([
        prisma.transactions.aggregate({
            where:{
                userId,
                type: 'revenue',
                paid_out: false
            },
            _count: true,
            _sum:{
                amount: true
            }
        }),
        prisma.transactions.aggregate({
            where:{
                userId,
                type: 'expense',
                paid_out: false
            },
            _count: true,
            _sum:{
                amount: true
            }
        })
       ]);
        return {
            pendingRevenueCount: revenues._count,
            pendingRevenueTotal: revenues._sum.amount ?? 0,
            pendingExpenseCount: expenses._count,
            pendingExpensesTotal: expenses._sum.amount ?? 0
        }
    }catch(error){
        console.error("Erro ao ler as transações não pagas");
        throw new Error("Erro no serviço de ler as transações não pagas")
    }
}

const updateTransactionService = async (userId, transactionId, updates) => {
    try {
        const allowedFields = [
            'amount', 'type', 'paid_out', 'payDay', 'description', 'attachment',
            'fixed', 'repeat', 'typeRepeat', 'remindMe', 'categoryId'
        ];

        // Verifica se há campos inválidos no objeto updates
        const invalidFields = Object.keys(updates).filter(key => !allowedFields.includes(key));
        if (invalidFields.length > 0) {
            throw new Error(`Campos inválidos: ${invalidFields.join(', ')}`);
        }

        // Busca a transação original
        const transaction = await prisma.transactions.findFirst({
            where: { id: transactionId, userId }
        });

        if (!transaction) {
            throw new Error("Transação não encontrada ou não pertence ao usuário.");
        }

        // Inicia uma transação do Prisma para garantir atomicidade
        await prisma.$transaction(async (tx) => {
            // Atualiza o valor da transação e ajusta o saldo, se necessário
            if ('amount' in updates && updates.amount !== transaction.amount) {
                if (typeof updates.amount !== 'number') {
                    throw new Error("amount deve ser um número.");
                }

                const absoluteDiff = Math.abs(updates.amount - transaction.amount);

                // Só ajusta o balanço se estiver marcada como "paga"
                if (transaction.paid_out) {
                    let balanceOperation;

                    if (transaction.type === 'expense') {
                        // Despesas pagas: aumento do valor => diminuir saldo
                        balanceOperation = updates.amount > transaction.amount
                            ? { decrement: absoluteDiff }
                            : { increment: absoluteDiff };
                    } else {
                        // Receitas pagas: aumento do valor => aumentar saldo
                        balanceOperation = updates.amount > transaction.amount
                            ? { increment: absoluteDiff }
                            : { decrement: absoluteDiff };
                    }

                    await tx.accounts.update({
                        where: { id: transaction.accountId, userId },
                        data: { balance: balanceOperation }
                    });
                }

                // Atualiza o valor da transação
                await tx.transactions.update({
                    where: { id: transaction.id, userId },
                    data: { amount: updates.amount }
                });
            }

            // Atualiza o tipo e categoria, se houver
            if (
                'type' in updates &&
                updates.type !== transaction.type
            ) {
                if (!updates.categoryId) {
                    throw new Error("categoryId obrigatório para alteração de tipo.");
                }

                // Valida se a nova categoria é compatível com o tipo
                const isValidCategory = await tx.expenseAndRevenueCategories.findFirst({
                    where: {
                        id: updates.categoryId,
                        type: updates.type
                    }
                });

                if (!isValidCategory) {
                    throw new Error("Categoria inválida para o tipo informado.");
                }

                // Ajuste no saldo se já foi paga
                if (transaction.paid_out) {
                    const amount = updates.amount ?? transaction.amount;

                    // Reverte o valor anterior
                    const reverse = transaction.type === 'expense'
                        ? { increment: amount }
                        : { decrement: amount };

                    // Aplica o novo tipo
                    const apply = updates.type === 'expense'
                        ? { decrement: amount }
                        : { increment: amount };

                    // Reverte e aplica o novo tipo ################################################
                    const previousAmount = transaction.amount;
                    const newAmount = updates.amount ?? transaction.amount;

                    let balanceDelta = 0;

                    // Reverte valor anterior
                    balanceDelta += transaction.type === 'expense' ? previousAmount : -previousAmount;

                    // Aplica novo valor com novo tipo
                    balanceDelta += updates.type === 'expense' ? -newAmount : newAmount;

                    await tx.accounts.update({
                        where: { id: transaction.accountId, userId },
                        data: {
                            balance: {
                                increment: balanceDelta
                            }
                        }
                    });
                }

                // Atualiza o tipo e a categoria
                await tx.transactions.update({
                    where: { id: transaction.id, userId },
                    data: {
                        type: updates.type,
                        categoryId: updates.categoryId
                    }
                });
            }

            // Atualiza os demais campos permitidos, se existirem
            const otherFields = { ...updates };
            delete otherFields.amount;
            delete otherFields.type;
            delete otherFields.categoryId;

            if (Object.keys(otherFields).length > 0) {
                await tx.transactions.update({
                    where: { id: transaction.id, userId },
                    data: otherFields
                });
            }
        });

        return true;

    } catch (error) {
        console.error("Erro ao atualizar transação:", error.message);
        throw new Error("Erro no serviço de atualização de transação");
    }
};



const deleteTransactionService = async (transactionId) =>{
    try{

        const transaction = await prisma.transactions.findUnique({
            where:{
                id: transactionId
            }
        })

        if (!transaction) {
            throw new Error('Transação não encontrada');
        }

        const operation = transaction.type === 'revenue' ? 'decrement' : 'increment';

        await prisma.$transaction(async (tx) =>{

            await tx.accounts.update({
                where:{
                    id: transaction.accountId
                },
                data:{
                    balance:{
                        [operation]: transaction.amount
                    }
                }
            })
    
            await tx.transactions.delete({
                where:{
                    id: transaction.id
                }
            })

        })

    }catch(error){
        console.error('Erro no servico de deletar uma transacao', error);
        throw error('Erro no servico de deletar uma transacao');
    }
}

module.exports ={
    checkIfTransactionTypeMatchesToCategoryType,
    newTransaction,
    readMonthPaidTransactionsService,
    readUnpaidTransactionsService,
    updateTransactionService,
    deleteTransactionService
}

