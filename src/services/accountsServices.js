const {prisma} = require('../config/prismaClient');

const getAccountsByUserId = async(userId) =>{
    try{
        const accounts = await prisma.accounts.findMany({
            where:{
                userId: userId,
            },
        });
        return accounts; //Retorna um array vazio se nao houver contas cadastradas 
    }catch(error){
        console.error("Erro ao buscar contas do usuario", error);
        return null; //Retorna null apenas em casos de erro
    }
}

const checkIfAccountAlreadyExists = async(accountName, userId) =>{
    try{
        const account = await prisma.accounts.findFirst({
            where:{
                name: accountName,
                userId: userId
            }
        });
        
        if(account){
            return true
        }else{
            return false
        }
    }catch(error){
        console.error("Erro ao checar se a conta já existe", error);
        return null;
    }
}

const checkIfAccountExists = async(accountId, userId) =>{
    try{
        const accExists = await prisma.accounts.findUnique({
            where:{
                id: accountId,
                userId: userId
            }
        })
        return accExists
    }catch(error){
        console.error("Erro ao verificar se a conta já existe", error);
        return null;
    }
}

const deleteAccountById = async(userId, accountId) =>{
    try{
        const dellAccById = await prisma.accounts.delete({
            where:{
                userId: userId,
                id: accountId
            }
        })
        return dellAccById
    }catch(error){
        console.error("Erro ao deletar conta pelo id", error);
        return null
    }
}

const checkIfrecurringTransactionsExists = async(accountId) =>{
    try{
        const recTransExists = await prisma.transactions.findFirst({
            where:{
                accountId: accountId,
                fixed: true
            }
        })
        return recTransExists
    }catch(error){
        console.error("Erro ao verificar se existem transacoes recorrentes vinculadas a este 'accountId'", error);
        return null
    }
}


module.exports = {
    getAccountsByUserId,
    checkIfAccountAlreadyExists,
    checkIfAccountExists,
    deleteAccountById,
    checkIfrecurringTransactionsExists
}