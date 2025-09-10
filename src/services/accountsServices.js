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

const updateAccountBalanceService = async(accountId, type, amount, paid_out) => {
    try{

        if(paid_out){
            const updateData =
            type === "expense"
            ? {balance: {decrement: amount}}
            : {balance: {increment: amount}};

            const newBalance = await prisma.accounts.update({
                where:{id: accountId},
                data: updateData,
            });
            
            return newBalance;
        }else{
            return true
        }
    }catch(error){
        console.error("Erro ao atualizar o balanço da conta", error);
        throw new Error("Erro ao atualizar o balanço da conta");
    }
}

const deleteAccountService = async (userId, accountId) => {
    /*
        1) Verifica se existem transações recorrentes vinculadas a esta conta
        2) Buscar todas as transações vinculadas
        3) Somar receitas e despesas
        4) Atualizar balanço
        5) Deletar transações da conta
        6) Deletar a conta em si
    */
    try {
        await prisma.$transaction(async (tx) => {
            // 1) 
            const recurringTransactions = await tx.transactions.findFirst({
                where: {
                    userId: userId,
                    accountId: accountId,
                    fixed: true,
                },
            });

            if (recurringTransactions) {
                throw new Error('Existem transações fixas vinculadas a esta conta. Remova-as antes de deletar a conta.');
            }

            // 2) 
            const allTransactions = await tx.transactions.findMany({
                select: {
                    type: true,
                    amount: true,
                },
                where: {
                    userId: userId,
                    accountId: accountId,
                },
            });

            if(!allTransactions){
                throw new Error('Erro ao buscar as transacoes vinculadas a conta')
            }

            // 3)
            let revenue = 0;
            let expense = 0;

            allTransactions.forEach((t) => {
                if (t.type === 'revenue') revenue += t.amount;
                else expense += t.amount;
            });

            const balanceResult = revenue - expense;

            // 4) 
            const updateAccountBalance = await tx.accounts.update({
                where: {
                    id: accountId,
                    userId: userId,
                },
                data: {
                    balance: balanceResult < 0
                        ? { decrement: Math.abs(balanceResult) }
                        : { increment: Math.abs(balanceResult) },
                },
            });

            if(!updateAccountBalance){
                throw new Error('Erro ao atualizar o balanço da conta');
            }

            // 5) 
            const deleteTransactions = await tx.transactions.deleteMany({
                where: {
                    userId: userId,
                    accountId: accountId,
                },
            });

            if(!deleteTransactions){
                throw new Error('Erro ao deletar transacoes vinculadas a esta conta');
            }

            // 6) 
            const deleteAccount = await tx.accounts.delete({
                where: {
                    id: accountId,
                    userId: userId,
                },
            });
            
            if(!deleteAccount){
                throw new Error('Erro ao deletar conta');
            }
        });

    } catch (error) {
        console.error('Erro no serviço de deletar uma conta:', error);
        throw new Error('Erro ao deletar conta. Nenhuma operação foi executada.');
    }
};


module.exports = {
    getAccountsByUserId,
    checkIfAccountAlreadyExists,
    checkIfAccountExists,
    deleteAccountById,
    checkIfrecurringTransactionsExists,
    updateAccountBalanceService,
    deleteAccountService
}