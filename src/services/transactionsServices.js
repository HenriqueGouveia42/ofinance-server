const { parse } = require('dotenv');
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

const getAllTransactionsByAccountId = async (userId, accountId) =>{
    try{

        const allTransByAccId = await prisma.transactions.findMany({
            select:{

                type: true,
                amount: true
            },
            where:{
                userId: userId,
                accountId: accountId
            }
        })

        
        return allTransByAccId
    }catch(error){
        console.error("Erro ao buscar todas as transações vinculadas a esta conta", error);
        return null
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

const readMonthTransactionsService = async (userId, startDate, endDate) =>{
    try{
        /*const readMonthT = async(async () =>{
            await prisma.transactions.groupBy({
                by: ['type', 'paid_out'],
                _sum: {
                    amount: true
                },
                _count: {
                    id: true
                },
                where: {
                    userId: userId,
                    payDay:{
                        gte: startDate,
                        lt: endDate
                    }
                }
            })
        })*/
        const readMonthT = await prisma.transactions.groupBy({
            by: ['type', 'paid_out'],
            _sum: {
                amount: true
            },
            _count: {
                id: true
            },
            where: {
                userId: userId,
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
        
        const unpaidTransactions = (async () =>{
            await prisma.transactions.findMany({
                where:{
                    userId: userId,
                    paid_out: false
                }
            })
        })
        
        return unpaidTransactions;
    }catch(error){
        console.error("Erro ao ler as transações não pagas");
        throw new Error("Erro no serviço de ler as transações não pagas")
    }
}

module.exports ={
    checkIfTransactionTypeMatchesToCategoryType,
    newTransaction,
    getAllTransactionsByAccountId,
    getAllTransactionsByCurrencyId,
    readMonthTransactionsService,
    readUnpaidTransactionsService
}

