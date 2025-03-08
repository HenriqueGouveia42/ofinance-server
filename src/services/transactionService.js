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

const checkIfTransactionTypeMatchesToCategoryType = async (TransactionType, CategoryId) => {
    try{
        const getCategory = await prisma.expenseAndRevenueCategories.findUnique({
            where:{
                id: CategoryId
            }
        })
        if(getCategory.type === TransactionType){
            return true;
        }else{
            return false;
        }
    }catch(error){
        console.error("Erro ao verificar se o tipo de transacao escolhido confere com o tipo de categoria")
        return null;
    }
}



//const getAllTranscations = async ()
module.exports ={
    checkIfTransactionTypeMatchesToCategoryType,
    newTransaction,
}

