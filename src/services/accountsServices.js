const {prisma} = require('../config/prismaClient');
const AppError = require('../utils/AppError');

const createAccountService = async(userId, accountName) =>{
    
        //validacao de entrada
        if (typeof accountName !== "string" || !/^[a-zA-Z][a-zA-Z0-9_ ]*$/.test(accountName)) {
            throw new AppError("Nome inválido. Deve ser uma string e começar com uma letra", 400);
        }

        const toTitleCase = (str) => {
            return str
              .toLowerCase()
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
        };

        const titleCaseAccountName = toTitleCase(accountName)

        //checa se este usuario já possui uma conta com este mesmo nome
        const account = await prisma.accounts.findFirst({
            where:{ name: titleCaseAccountName, userId }
        });
        
        if(account){
            throw new AppError('Este usuario já tem uma conta com esse nome!', 409, 'INVALID_ACCOUNT_NAME')
        }

        //cria a conta
        const newAcc = await prisma.accounts.create({
            data:{
                userId: userId,
                name: accountName,
                balance: 0
            }
        })

        return newAcc;

}

//check cache first
const getAccountsByUserIdService = async(userId) =>{
    
    const accounts = await prisma.accounts.findMany({
        where:{
            userId: userId,
        },
    });

    if (!accounts){
        throw new AppError('Erro ao buscar as contas deste usuario', 404, 'ACCOUNTS_ERROR')
    }

    return accounts;
    
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
    try {
        await prisma.$transaction(async (tx) => {

            if(typeof accountId ==! "number"){
                return res.status(400).json({message: "Id da conta a ser deletada invalido"})
            }
            
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

            let revenue = 0;
            let expense = 0;

            allTransactions.forEach((t) => {
                if (t.type === 'revenue') revenue += t.amount;
                else expense += t.amount;
            });

            const balanceResult = revenue - expense;

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
    createAccountService,
    getAccountsByUserIdService,
    checkIfAccountExists,
    deleteAccountById,
    checkIfrecurringTransactionsExists,
    updateAccountBalanceService,
    deleteAccountService
}