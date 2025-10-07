const {prisma} = require('../config/prismaClient');
const AppError = require('../utils/AppError');

const createAccountService = async(userId, accountName, initialBalance) =>{
    
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
                name: titleCaseAccountName,
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
        where:{
            userId: userId,
            id: accountId
        },
        select:{
            balance: true
        },
    })

    if (!currentAccountBalance){
        throw new AppError('Conta com esse userId e id nao encontrada', 404, "ACCOUNTS_ERROR")
    }

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

    const accountToDelete = await prisma.accounts.findFirst({
        where: {
            id: accountId,
            userId: userId,
        }
    });

    if (!accountToDelete) {
        throw new AppError('Nao existe nenhuma conta com este id', 400, 'ACCOUNTS_ERROR');
    }

    await prisma.$transaction(async (tx) => {

        const relatedTransactions = await tx.transactions.findMany({
            where: {
                accountId,
                userId
            }
        });

        if (relatedTransactions.length === 0) {
            await tx.accounts.delete({ where: { id: accountId } });
            return true;
        }

        const netBalance = relatedTransactions.reduce((acc, t) => {
            if (t.paid_out) {
                return acc + (t.type === 'revenue' ? t.amount : -t.amount);
            }
            return acc;
        }, 0);

        const generalAccountName = "Conta Geral";

        const generalAccount = await tx.accounts.upsert({
            where: {
                userId_name: {
                    userId: userId,
                    name: generalAccountName
                }
            },
            update: netBalance !== 0 ? {
                balance: {
                    ...(netBalance > 0 ? { increment: netBalance } : { decrement: Math.abs(netBalance) })
                }
            } : {},
            create: {
                userId: userId,
                name: generalAccountName,
                balance: netBalance
            }
        });

        await tx.transactions.updateMany({
            where: {
                accountId: accountId,
                userId: userId
            },
            data: {
                accountId: generalAccount.id
            }
        });

        await tx.accounts.delete({
            where: {
                id: accountId,
            }
        });
    });

    return true;
};

module.exports = {
    createAccountService,
    getAccountsByUserIdService,
    renameAccountService,
    updateAccountBalanceService,
    deleteAccountService
}