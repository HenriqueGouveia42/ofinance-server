const {prisma} = require('../config/prismaClient');
const AppError = require('../utils/AppError');

const createAccountService = async(userId, accountName, initialBalance) =>{
    
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
                balance: initialBalance
            }
        })

        return newAcc;

}

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

const updateAccountBalanceService = async(accountId, userId, newAccountBalance) => {

    const currentAccountBalance = await prisma.accounts.findFirst({
        where:{userId, id: accountId},
        select: {balance: true},
    })

    if (newAccountBalance == currentAccountBalance.balance){
        throw new AppError('Novo balanço da conta é igual ao balanço atual', 409, 'ACCOUNTS_ERROR')
    }
    
    const balanceUpdated = await prisma.accounts.update({
            where:{
                id: accountId,
                userId: userId
            },
            data:{
                balance: newAccountBalance
            }
    })

    if (!balanceUpdated){
        throw new Error('Erro ao atualizar o balanco da conta', 400, 'ACCOUNTS_ERROR')
    }

    return balanceUpdated
        
}

const renameAccountService = async(userId, accountId, accountNewName) =>{

    if(typeof accountId ==! "number" || typeof accountNewName ==! "string"){
        throw new AppError('Tipos de entrada incorretos', 400, 'ACCOUNTS_ERROR')
    }

    const renameAccount = await prisma.accounts.update({
        where:{
            id: accountId,
            userId: userId
        },
        data:{
            name: accountNewName
        }
    })

    if (!renameAccount){
        throw new AppError('Erro ao tentar renomear a conta', 400, 'ACCOUNTS_ERROR')
    }

    return renameAccount

}

const deleteAccountService = async (userId, accountId) => {

    const acc = await prisma.accounts.findFirst({
        where:{
            id: accountId,
            userId: userId,
        }
    })

    if (!acc){
        throw new AppError('Nao existe nenhuma conta com este id', 400, 'ACCOUNTS_ERROR')
    }
    
    await prisma.$transaction(async (tx) => {        

        const deleteTransactions = await tx.transactions.deleteMany({
            where: {
                userId: userId,
                accountId: accountId,
            },
        });

        if(!deleteTransactions){
            throw new AppError('Erro ao deletar transacoes vinculadas a esta conta', 400, 'ACCOUNTS_ERROR');
        }
 
        const deleteAccount = await tx.accounts.delete({
            where: {
                id: accountId,
                userId: userId,
            },
        });
            
        if(!deleteAccount){
            throw new AppError('Erro ao deletar conta', 400, 'ACCOUNTS_ERROR');
        }
    });

};


module.exports = {
    createAccountService,
    getAccountsByUserIdService,
    renameAccountService,
    updateAccountBalanceService,
    deleteAccountService
}