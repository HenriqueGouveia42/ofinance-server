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

const updateAccountBalanceService = async(userId, accountId, newAccountBalance, changeInitialBalanceOrCreateTransaction, categoryId) => {

    if (!(changeInitialBalanceOrCreateTransaction == 'create_transaction' || changeInitialBalanceOrCreateTransaction == 'change_initial_balance')){
        throw new AppError('parametros possiveis de `changeInitialBalanceOrCreateTransaction`: `change_initial_balance` ou `create_transaction`', 409, 'ACCOUNTS_ERROR')
    }
    
    const currentAccountBalance = await prisma.accounts.findFirst({
        where:{userId, id: accountId},
        select: {balance: true},
    })

    if (newAccountBalance == currentAccountBalance.balance){
        throw new AppError('Novo balanço da conta é igual ao balanço atual', 409, 'ACCOUNTS_ERROR')
    }
    
    await prisma.accounts.update({
            where:{
                id: accountId,
                userId: userId
            },
            data:{
                balance: newAccountBalance
            }
    })

    if (changeInitialBalanceOrCreateTransaction == 'create_transaction'){

        //verificar se a categoria selecionada para a transacao é do tipo correspondente
        
        const categoryType = await prisma.expenseAndRevenueCategories.findFirst({
            where:{userId: userId, id: categoryId },
            select: {type: true}
        })

    
        if (newAccountBalance > currentAccountBalance){ //criar uma receita

            if (categoryType.type != 'revenue'){
                throw new AppError('categoria de tipo (`revenue` ou `expense`) incompativel', 400, 'ACCOUNTS_ERROR')
            }

            await prisma.transactions.create({
                data:{
                    amount: newAccountBalance - currentAccountBalance,
                    type: revenue,
                    paid_out: true,
                    payDay: new Date(),
                    description: 'Ajuste no balanço da conta',
                    userId: userId,
                    categoryId: categoryId,
                    accountId: accountId
                }
            })

        } else if (newAccountBalance < currentAccountBalance){ //criar uma despesa

            if (categoryType.type != 'expense'){
                throw new AppError('categoria de tipo (`revenue` ou `expense`) incompativel', 400, 'ACCOUNTS_ERROR')
            }

                await prisma.transactions.create({
                data:{
                    amount: currentAccountBalance - newAccountBalance,
                    type: expense,
                    paid_out: true,
                    payDay: new Date(),
                    description: 'Ajuste no balanço da conta',
                    userId: userId,
                    categoryId: categoryId,
                    accountId: accountId
                }
            })
        }
    
    }
        
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

        if(typeof accountId ==! "number"){
            return res.status(400).json({message: "Id da conta a ser deletada invalido"})
        }
            
        const repeatTransactions = await tx.transactions.findFirst({
                where: {
                    userId: userId,
                    accountId: accountId,
                },
                include:{
                    repeatTransaction: true
                }
            });

            if (repeatTransactions) {
                throw new AppError('Existem transações com repeticao vinculadas a esta conta. Remova-as antes de deletar a conta.', 400, 'ACCOUNTS_ERROR');
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
                throw new AppError('Erro ao atualizar o balanço da conta', 400, 'ACCOUNTS_ERROR');
            }

            // 5) 
            const deleteTransactions = await tx.transactions.deleteMany({
                where: {
                    userId: userId,
                    accountId: accountId,
                },
            });

            if(!deleteTransactions){
                throw new AppError('Erro ao deletar transacoes vinculadas a esta conta', 400, 'ACCOUNTS_ERROR');
            }

            // 6) 
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