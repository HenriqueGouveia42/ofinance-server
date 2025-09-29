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
            //opcionais - se nao vierem no req.body, ficarão como 'undefined'. 'chave': undefined
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
        const {transactionId} = req.body;

        await deleteTransactionService(transactionId);

        return res.status(200).json({message: "Transacao deletada com sucesso"});
    }catch(error){
        
        console.error('Erro ao deletar uma transação:', error.message);

        if (error.message === 'Transação não encontrada') {
            return res.status(404).json({ message: error.message });
        }

        return res.status(500).json({ message: 'Erro interno no servidor' })
    }
}

const updateTransactionController = async(req, res) =>{
    try{
        const {transactionId, updates} = req.body;
        
        const userId = req.user.id;

        if(typeof transactionId != 'number' || typeof updates != 'object'){
            return res.status(400).json({message: "Campos obrigatorios faltando ou de tipos incorretos"});
        }
        
        const update = await updateTransactionService(userId, transactionId, updates);

        if(!update){
            return res.status(204).json({message: "Erro ao atualizar transação"});
        }

        return res.status(200).json({message: "Transacao alterada com sucesso!"})
        
    }catch(error){
        console.error('Erro ao editar a transacao');
        return res.status(500).json({message: "Erro interno ao editar transação"})
    }
}

const getMonthlyPaidFlowSummaryController = async(req, res) =>{
    try{

        const {month, year} = req.query;

        const userId = req.user.id;
        
        const transactions = await getMonthlyPaidFlowSummaryService(userId, month, year);
        
        return transactions
        
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