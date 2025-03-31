const {prisma} = require('../config/prismaClient');

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
        return true;
    }catch(error){
        console.error("Erro no serviço de criar nova transacao");
        return false;
    }
}

const checkIfTransactionTypeMatchesToCategoryType = async (userId, TransactionType, CategoryId) => {
    try{
        
        const getCategory = await prisma.expenseAndRevenueCategories.findUnique({
            where:{
                id: CategoryId,
                userId: userId,
                type: TransactionType
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



//const getAllTranscations = async ()
module.exports ={
    checkIfTransactionTypeMatchesToCategoryType,
    newTransaction,
    getAllTransactionsByAccountId,
    getAllTransactionsByCurrencyId
}

