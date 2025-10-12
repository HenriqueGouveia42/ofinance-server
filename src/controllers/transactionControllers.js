const {prisma} = require('../config/prismaClient');

const {createTransactionService, getMonthlyPaidFlowSummaryService, getUnpaidTransactionsSummaryService, updateTransactionService, deleteTransactionService, validateReqBody} = require('../services/transactionsServices')

const AppError = require('../utils/AppError');

const createTransactionController = async (req, res) =>{
    try{
        const {
            amount,
            type,
            paid_out,
            payDay,
            categoryId,
            accountId,
            //opcionais
            description,
            attachment,
            remindMe,
            repeatTransaction
        } = req.body;

        const userId = req.user.id;

        const reqBody = {
            amount,
            type,
            paid_out,
            payDay,
            categoryId,
            accountId,
            description,
            attachment,
            remindMe,
            repeatTransaction
        }

        const transaction = await createTransactionService(reqBody, userId)

        return res.status(200).json({message: "Transacao criada com sucesso!", transaction})
        
    }catch(error){

        console.error("Erro ao criar transacao.", error);

        if (error instanceof AppError){
            return res.status(error.statusCode).json({message: error.message})
        }

        res.status(500).json({message: "Erro interno ao servidor ao criar transacao"});
    }

}

const deleteTransactionController = async(req, res) =>{
    try{
        const {transactionId} = req.query;
        const {transactionDetailsToUpdate} = req.body;
        const userId = req.user.id

        await deleteTransactionService(transactionId, userId, transactionDetailsToUpdate)
    }catch(error){
        
        console.error('Erro ao deletar uma transação:', error);

        if (error instanceof AppError){
            return res.status(error.statusCode).json({message: error.message})
        }

        return res.status(500).json({ message: 'Erro interno no servidor' })
    }
}

const updateTransactionController = async(req, res) =>{
    try{
        const {transactionId} = req.query;
        const {updates} = req.body;
        const userId = req.user.id;
        const update = await updateTransactionService(userId, transactionId, updates);

        return res.status(200).json({message: "Transacao alterada com sucesso!"})
        
    }catch(error){
        console.error('Erro ao editar a transacao', error);

        if (error instanceof AppError){
            throw new AppError('Erro ao tentar editar transacao', 400, 'TRANSACTION_ERROR')
        }

        return res.status(500).json({message: "Erro interno ao editar transação"})
    }
}

const getMonthlyPaidFlowSummaryController = async(req, res) =>{
    try{

        const {month, year} = req.query;

        const userId = req.user.id;
        
        const transactions = await getMonthlyPaidFlowSummaryService(userId, month, year);
        
        return res.status(200).json(transactions)
        
    }catch(error){

        console.error('Erro ao tentar ler transacoes do mes', error);

        if (error instanceof AppError){
            return res.status(error.statusCode).json({message: error.message})
        }

        return res.status(500).json({error: "Erro interno ao tentar ler transacao"})
    }    
}

const getUnpaidTransactionsSummaryController = async(req, res) =>{
    try{
        const userId = req.user.id;
        
        const unpaidTransactions = await getUnpaidTransactionsSummaryService(userId);
        
        return res.status(200).json(unpaidTransactions)

    }catch(error){
        console.error("Erro ao tentar ler as transacoes nao pagas", error);

        if (error instanceof AppError){
            return res.status(error.statusCode).json({message: error.message})
        }

        return res.status(500).json({message: "Erro interno ao ler as mensagens pagas"})
    }
}


module.exports = {
    createTransactionController,
    deleteTransactionController,
    getMonthlyPaidFlowSummaryController,
    getUnpaidTransactionsSummaryController,
    updateTransactionController
};