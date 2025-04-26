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
    currencyId,
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
                currencyId
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


const getAllTransactionsByCurrencyId = async (userId, currencyId) =>{
    try{
        
        const allTr = await prisma.transactions.findMany({
            select:{
                amount: true,
                type: true,
                accountId: true
            },
            where:{
                userId: userId,
                currencyId: currencyId
            }
        })
        return allTr;
    }catch(error){
        console.error("Erro ao buscar transações vinculadas a esta moeda", error);
        return null;
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
            return readMonthT
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

const updateTransactionService = async (userId, transactionId, updates) =>{
    try{
        
        const allowedFields = [
            'amount', 'type', 'paid_out', 'payDay', 'description', 'attachment',
            'fixed', 'repeat', 'typeRepeat', 'remindMe'
        ];

        const invalidFields = Object.keys(updates).filter(key=>!allowedFields.includes(key));


        if (invalidFields.length > 0){
            throw new Error(`Campos invalidos: ${invalidFields.join(', ')}`);
        }

        const transaction = await prisma.transactions.findFirst({
            where:{
                id: transactionId,
                userId: userId
            }
        });

        if(!transaction){
            throw new Error(`Transacao com id: ${transactionId} pertencente ao usuario com id: ${userId} nao encontrada`);
        }

        const updateAll = await prisma.$transaction(async () =>{

            const updatedTransaction = await prisma.transactions.update({
                where:{id: transaction.id},
                data: updates
            })

            if (Object.keys(updates).includes('paid_out') && (updates.paid_out !== transaction.paid_out)) {
                
                let balanceUpdateType = '';

                if(transaction.type == 'revenue'){
                    balanceUpdateType = updates.paid_out ? 'increment' : 'decrement'
                }

                if(transaction.type == 'expense'){
                    balanceUpdateType = updates.paid_out ? 'decrement' : 'increment'
                }
    
                //Altera o saldo da conta
                const updateAccountBalance = await prisma.accounts.update({
                    where: {
                        id: transaction.accountId
                    },
                    data: {
                        balance: {
                            [balanceUpdateType]: transaction.amount
                        }
                    }
                });
            }
    
            if(Object.keys(updates).includes('amount')){

                const updateAccountBalance = prisma.accounts.update({
                    where:{id: transaction.accountId},
                    data:{
                        balance: updates.amount
                    }
                })
            }

            return updatedTransaction;
        })
    }
    catch(error){
        console.error('Erro no servico de atualizar algum campo da transacao');
        throw new Error('Erro no servico de atualizar algum campo da transacao');
    }
}

module.exports ={
    checkIfTransactionTypeMatchesToCategoryType,
    newTransaction,
    getAllTransactionsByCurrencyId,
    readMonthPaidTransactionsService,
    readUnpaidTransactionsService,
    updateTransactionService
}

