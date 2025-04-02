const {prisma} = require('../config/prismaClient');

//check cache first
const getAccountsByUserId = async(userId) =>{
    try{
        const accounts = await prisma.accounts.findMany({
            where:{
                userId: userId,
            },
        });
        return accounts;
    }catch(error){
        console.error("Erro ao buscar contas do usuario", error);
        throw new Error('Erro ao buscar contas do usuario"');
    }
}

//check cache first
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

//check cache first
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

//check cache first
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

const updateAccountBalance = async(accountId, type, amount) => {
    try{
        const updateData =
            type === "expense"
            ? {balance: {decrement: amount}}
            : {balance: {increment: amount}};

        const newBalance = await prisma.accounts.update({
            where:{id: accountId},
            data: updateData,
        });

        return newBalance
    }catch(error){
        console.error("Erro ao atualizar o balanço da conta", error);
        throw new Error("Erro ao atualizar o balanço da conta")
    }
}


module.exports = {
    getAccountsByUserId,
    checkIfAccountAlreadyExists,
    checkIfAccountExists,
    deleteAccountById,
    checkIfrecurringTransactionsExists,
    updateAccountBalance
}