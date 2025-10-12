const { repeatEachOptions } = require('@prisma/client');
const {prisma} = require('../config/prismaClient');

//Futuramente será implementado o cache
const AppError = require('../utils/AppError');

const convertToISO = (dateString) =>{
    const date = new Date(dateString);
    return date.toISOString();
}

const checkIfTransactionTypeMatchesToCategoryType = async (userId, TransactionType, CategoryId) => {
    
    const getCategory = await prisma.expenseAndRevenueCategories.findUnique({
        where:{
            userId: userId,
            type: TransactionType,
            id: CategoryId,
        }
    });
        
    if (!getCategory){
        throw new AppError('Categoria não encontrada ou incompatível com o tipo da transação.', 400, 'TRANSACTION_ERROR');
    }

    return getCategory;

}

const createTransactionService = async(reqBody, userId) => {

    await checkIfTransactionTypeMatchesToCategoryType(userId, reqBody.type, reqBody.categoryId);

    return prisma.$transaction(async(tx) => {

        //Se a transação foi paga, atualize o saldo da conta.
        if (reqBody.paid_out === true) {
            const operation = reqBody.type === 'revenue' ? 'increment' : 'decrement';
            
            await tx.accounts.update({
                where: {
                    id: reqBody.accountId,
                    userId: userId // CORREÇÃO 2: Use o userId do argumento da função
                },
                data: {
                    balance: {
                        [operation]: reqBody.amount
                    }
                }
            });
        }
    
        const transaction = await tx.transactions.create({
            data: {
                amount: reqBody.amount,
                type: reqBody.type,
                paid_out: reqBody.paid_out,
                payDay: reqBody.payDay,
                description: reqBody.description,
                attachment: reqBody.attachment,
                remindMe: reqBody.remindMe,
                userId: userId,
                categoryId: reqBody.categoryId,
                accountId: reqBody.accountId,
            },
        });

        //O repeatTransaction é criado aqui, se existir, e associado à transação.
        if (reqBody.repeatTransaction) {
            await tx.repeatTransaction.create({
                data: {
                    ...reqBody.repeatTransaction,
                    transactionId: transaction.id,
                }
            })
        }

        return transaction;
    });
};

const monthMap = {
    Janeiro: 0,
    Fevereiro: 1,
    Março: 2,
    Abril: 3,
    Maio: 4,
    Junho: 5,
    Julho: 6,
    Agosto: 7,
    Setembro: 8,
    Outubro: 9,
    Novembro: 10,
    Dezembro: 11
}

const getMonthlyPaidFlowSummaryService = async (userId, month, year) =>{

    const startDate = new Date(year, monthMap[month], 1);

    const endDate = new Date(year, monthMap[month]+1, 1);

    const paidTransactionsByMonthAndYear = await prisma.transactions.groupBy({
        by: ['type'],
        _sum: {
            amount: true
        },
        where: {
            userId: userId,
            paid_out: true,
            payDay:{
                gte: startDate,
                lt: endDate
            }
        }
    });
    return paidTransactionsByMonthAndYear;
}

const getUnpaidTransactionsSummaryService = async(userId) =>{

       const [revenues, expenses] = await Promise.all([

        prisma.transactions.aggregate({
            where:{
                userId,
                type: 'revenue',
                paid_out: false
            },
            _count: true,
            _sum:{
                amount: true
            }
        }),

        prisma.transactions.aggregate({
            where:{
                userId,
                type: 'expense',
                paid_out: false
            },
            _count: true,
            _sum:{
                amount: true
            }
        })
       ]);

    return {
        pendingRevenueCount: revenues._count,
        pendingRevenueTotal: revenues._sum.amount ?? 0,
        pendingExpenseCount: expenses._count,
        pendingExpensesTotal: expenses._sum.amount ?? 0
    }
   
}

const updateTransactionService = async (userId, transactionId, updates) => {

    const transactionToUpdate = await prisma.transactions.findFirst({
        where:{
            id: transactionId,
            userId: userId
        }
    })
        
    if (!transactionToUpdate) {
        throw new AppError("Transação não encontrada ou não pertence ao usuário.", 400, "TRANSACTION_ERROR");
    }

    /* exemplo de transacao criada com sucesso 
        {
            "amount": 300,
            "type": "revenue",
            "paid_out": true,
            "payDay": "2025-10-07T18:17:47.908Z",
            "description": "Bonificacao",
            "attachment": "",
            "remindMe": "2025-10-10T18:17:47.908Z",
            "categoryId": 58,
            "accountId": 51
        }
    */
    await prisma.$transaction(async (tx) =>{

        //atualiza o 'amount da transacao'
        if (updates.amount && (updates.amount != transactionToUpdate.amount)){

            if (transactionToUpdate.paid_out == true){ //atualiza o balanco da conta vinculada a essa transacao

                const absoluteDiff = Math.abs(updates.amount - transactionToUpdate.amount)
                    
                let operation

                if (transactionToUpdate.type == 'revenue'){

                    if (updates.amount > transactionToUpdate.amount){

                        operation = {increment: absoluteDiff}

                    } else if (updates.amount < transactionToUpdate.amount){

                        operation = {decrement: absoluteDiff}

                    }

                }else if (transactionToUpdate.type == 'expense'){

                    if (updates.amount > transactionToUpdate.amount){

                        operation = {decrement: absoluteDiff}

                    } else if (updates.amount < transactionToUpdate.amount){

                        operation = {increment: absoluteDiff}

                    } 

                }

                await tx.accounts.update({
                    where:{
                        id: transactionToUpdate.accountId,
                        userId: transactionToUpdate.userId
                    },
                    data:{
                        balance:{
                            operation
                        }
                    }
                })
        
            }

            await tx.transactions.update({
                where:{
                    id: transactionToUpdate.id,
                    userId: transactionToUpdate.userId
                },
                data:{
                    amount: updates.amount
                }
            })

        }

        //atualiza o 'type' da transacao
        if (updates.type && (updates.type != transactionToUpdate.type)){
            //prosseguimos daqui
        }

    })

    return true;   
};

const deleteTransactionService = async (transactionId, userId) =>{
    

    const transaction = await prisma.transactions.findUnique({
        where:{
            id: transactionId
        }
    })

    if (!transaction) {
        throw new AppError('Transação não encontrada', 400, 'TRANSACTION_ERROR');
    }

    const operation = transaction.type === 'revenue' ? 'decrement' : 'increment';

    await prisma.$transaction(async (tx) =>{

        if (transaction.paid_out){
            await tx.accounts.update({
                where:{
                    id: transaction.accountId,
                    userId: userId
                },
                data:{
                    balance:{
                        [operation]: transaction.amount
                    }
                }
            })
        }

        await tx.transactions.delete({
            where:{
                id: transaction.id,
                userId: userId
                }
            })

        })

   
}

module.exports ={
    checkIfTransactionTypeMatchesToCategoryType,
    createTransactionService,
    getMonthlyPaidFlowSummaryService,
    getUnpaidTransactionsSummaryService,
    updateTransactionService,
    deleteTransactionService,
}

