const {prisma} = require('../config/prismaClient');


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

const getAllTranscations = async ()
module.exports ={
    checkIfTransactionTypeMatchesToCategoryType
}

