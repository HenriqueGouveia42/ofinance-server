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

    try {
    
        const allowedFields = [
            'amount', 'type', 'paid_out', 'payDay', 'description', 'attachment',
            'fixed', 'repeat', 'typeRepeat', 'remindMe', 'categoryId'
        ];

        // Verifica se há campos inválidos no objeto updates
        const invalidFields = Object.keys(updates).filter(key => !allowedFields.includes(key));

        if (invalidFields.length > 0) {
            throw new AppError(`Campos inválidos: ${invalidFields.join(', ')}`, 400, "TRANSACTION_ERROR");
        }

        // Busca a transação original
        let transaction = await prisma.transactions.findFirst({
            where: { id: transactionId, userId: userId }
        });

        
        if (!transaction) {
            throw new AppError("Transação não encontrada ou não pertence ao usuário.", 400, "TRANSACTION_ERROR");
        }

        // Verifica, chave por chave, se os tipos estão corretos e se houve mudança
        /*
            1 - Alteração no montante da transação
            2 - Alteração no tipo da transação
            3 - Alteração no status 'paid_out' da transação
            4 - Alteração na data  em que foi criado o pagamento
            5 - Alteração na descrição
            6 - Alteração no atributo 'fixed'
        
        */
        await prisma.$transaction(async (tx) =>{
        
            // 1 - Alteração do montante da transação
            if(typeof updates.amount === 'number' && updates.amount != transaction.amount){

                let absoluteDiff;

                absoluteDiff = Math.abs(updates.amount - transaction.amount);

                let balanceOperation1;

                //revenue
                if(transaction.type == "revenue"){
                    //novo valor é maior - increment account balance
                    //novo valor é menor - decrement account balance
                    balanceOperation1 = updates.amount > transaction.amount
                    ?   {increment: absoluteDiff}
                    :   {decrement: absoluteDiff}                 
                }

                //expense
                if(transaction.type == "expense"){
                    //novo valor é maior - decrement account balance
                    //novo valor é menor - increment account balance
                    balanceOperation1 = updates.amount > transaction.amount
                    ?   {decrement: absoluteDiff}
                    :   {increment: absoluteDiff}
                }

                if (transaction.paid_out){

                    await tx.accounts.update({
                        where:{
                            id: transaction.accountId,
                            userId: userId
                        },
                        data:{
                            balance:{
                                balanceOperation1
                            }
                        }
                    })
                }

                await tx.transactions.update({
                    where:{
                        id: transaction.id,
                        userId: userId
                    },
                    data:{
                        amount: updates.amount
                    }
                })

                //Atualiza a cópia local da transação a fim de evitar mais buscas no banco de dados
                transaction.amount = updates.amount

            }

            // 2 - Alteração no tipo da transação
            if((updates.type =! null) && (updates.type != transaction.type)){

                //Mudança do tipo implica em mudança no 'categoryId'. É preciso verificar se a nova categoria ('expense' ou 'revenue') corresponde a nova categoria
                
                let balanceOperation2;
                let newCategoryType;

                //expense => revenue
                if(updates.type == "revenue"){
                    newCategoryType = "revenue";
                    balanceOperation2 = {increment: 2*transaction.amount}
                }

                //revenue => expense
                if(updates.type == "expense"){
                    newCategoryType = "revenue";
                    balanceOperation2 = {decrement: 2*transaction.amount}
                }

                if(typeof updates.categoryId === 'number'){

                    //Verifica se a nova categoria é compativel
                    const isNewCategoryValid = await tx.expenseAndRevenueCategories.findFirst({
                        where:{
                            id: updates.categoryId,
                            userId: userId,
                            type: newCategoryType
                        }
                    })

                    if(!isNewCategoryValid){
                        throw new Error('Nova categoria incompatível')
                    }
                        
                }else{
                    throw new Error('Para alterar o tipo de transação, é obrigatório alterar sua categoria ("revenue" ou "expense")')
                }

                if (transaction.paid_out){
                    await tx.accounts.update({
                        where:{
                            id:transaction.accountId,
                            userId: userId
                        },
                        data:{
                            balance: balanceOperation2
                        }
                    })
                }

                await tx.transactions.update({
                    where:{
                        id: transactionId,
                        userId: userId
                    },
                    data:{
                        type: newCategoryType
                    }
                })

                //Atualiza a cópia local da transação a fim de evitar mais buscas no banco de dados
                transaction.type = newCategoryType
                
            }else{
                if((updates.type != "revenue") && (updates.type != "expense")){
                    throw new Error("'type' só pode ser 'revenue' ou 'expense', ou é a mesma categoria")
                }
            }

            // 3 - Alteração no status 'paid_out' da transação
            if(typeof updates.paid_out === 'boolean' && updates.paid_out != transaction.paid_out){

                let balanceOperation3;
                
                if(updates.paid_out == true && transaction.type == "revenue"){

                    balanceOperation3 = {increment: transaction.amount}

                }

                if(updates.paid_out == true && transaction.type == "expense"){

                    balanceOperation3 = {decrement: transaction.amount}

                }

                if(updates.paid_out == false && transaction.type == "revenue"){

                    balanceOperation3 = {decrement: transaction.amount}

                }


                if(updates.paid_out == false && transaction.type == "expense"){

                    balanceOperation3 = {increment: transaction.amount}

                }

                await tx.accounts.update({
                    where:{
                        id: transaction.accountId,
                        userId: userId
                    },
                    data:{
                        balanceOperation3
                    }
                })

                await tx.transactions.update({
                    where:{
                        id: transactionId,
                        userId: userId
                    },
                    data:{
                        paid_out: updates.paid_out
                    }
                })

                //Atualiza a cópia local da transação a fim de evitar mais buscas no banco de dados
                transaction.paid_out = updates.paid_out

            }

            // 4 - Alteração na data  em que foi criado o pagamento
            if(typeof updates.payDay === 'object' && updates.payDay != transaction.payDay){
                
                await tx.transactions.update({
                    where:{
                        id: transactionId,
                        userId: userId
                    },
                    data:{
                        payDay: updates.payDay
                    }
                })

                //Atualiza a cópia local da transação a fim de evitar mais buscas no banco de dados
                transaction.payDay = updates.payDay

            }
            
            // 5 - Alteração na descrição
            if(typeof updates.description === 'string' && updates.description != transaction.description){
                
                await tx.transactions.update({
                    where:{
                        id: transactionId,
                        userId: userId
                    },
                    data:{
                        description: updates.description
                    }
                })

                //Atualiza a cópia local da transação a fim de evitar mais buscas no banco de dados
                transaction.description = updates.description

            }

            // 6 - Alteração no atributo 'fixed'
            if(typeof updates.fixed === 'boolean' && updates.fixed != transaction.fixed){

                if(updates.fixed){
                
                    await tx.fixedTransactions.create({
                        data:{
                            id: transactionId
                        }
                    })

                    await tx.transactions.update({
                        where:{
                            id: transactionId,
                            userId: userId
                        },
                        data:{
                            fixed: true
                        }
                    })

                }

                if(!updates.fixed){

                    await tx.fixedTransactions.delete({
                        where:{
                            id: transactionId
                        }
                    })

                    await tx.transactions.update({
                        where:{
                            id: transactionId,
                            userId: userId
                        },
                        data:{
                            fixed: false
                        }
                    })
                }
                //Atualiza a cópia local da transação a fim de evitar mais buscas no banco de dados
                transaction.fixed = updates.fixed
            }

            // 7 - Alteração no atributo repeate
            if(typeof updates.repeat === 'boolean' && updates.repeat != transaction.repeat){

                let trueOrFalse;

                if(updates.repeat){
                   trueOrFalse = true
                }else{
                    trueOrFalse = false
                }

                await tx.transactions.update({
                    where:{
                        id: transactionId,
                        userId: userId
                    },
                    data:{
                            repeat: trueOrFalse
                    }
                })

                //Atualiza a cópia local da transação a fim de evitar mais buscas no banco de dados
                transaction.repeat = updates.repeat
            }

            if(typeof updates.typeRepeat === 'string' && updates.typeRepeat != transaction.typeRepeat){
                if(updates.typeRepeat){
                    
                }
            }

            if(typeof updates.remindMe === 'string' && updates.remindMe != transaction.remindMe){

            }

        })

        return true;

    } catch (error) {
        console.error("Erro ao atualizar transação:", error.message);
        throw new Error("Erro no serviço de atualização de transação");
    }
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

