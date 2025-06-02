const {prisma} = require('../config/prismaClient');

const {checkIfTransactionTypeMatchesToCategoryType, newTransaction, readMonthPaidTransactionsService, readUnpaidTransactionsService, updateTransactionService, deleteTransactionService} = require('../services/transactionsServices')

const {updateAccountBalanceService} = require('../services/accountsServices');

const {invalidateAllKeysInCacheService} = require('../services/cacheService');


const convertToISO = (dateString) =>{
    const date = new Date(dateString);
    return date.toISOString();
}

const createTransaction = async (req, res) =>{
    try{
        /*
            1) Verificar a presença de campos obrigatorios
            2) Verificar o tamanho máximo da descrição
            3) Testa o tamanho do attachment
            4) Testa se o valor inserido está dentro dos limites
            5) Verifica se o tipo ide transação é 'revenue' ou 'expense'
            6) Verifica se o tipo de transação ('revenue' ou 'expense') é compatível com o tipo de categoria escolhido ('revenue' ou 'expense')
            7) Revogar as keys do redis relacionadas a transacoes
            8) Atualização do balanço da conta
            9) Criar a nova transação
            
        */
        const {
            amount,
            type,
            paid_out,
            payDay,
            description,
            attachment,
            fixed,
            repeat,
            typeRepeat,
            remindMe,
            categoryId,
            accountId,
        } = req.body;

        const userId = req.user.id;
        
        //1)
        if(!amount || !type || !payDay || !payDay.startDate){
            return res.status(400).json({message: 'Campos obrigatorios estao ausentes!'})
        }

        //2)
        if(typeof description == "string" && (description.length > 200)){
            return res.status(400).json({message: "Descrição com mais de 200 caracteres"})
        }

        //3) 
        if(typeof attachment !== "string" || (attachment.length > 200)){
            return res.status(400).json({message: "Attachment com mais de 200 caracteres"})
        }

        //4)
        if(amount > 100000000000 || amount < 0.01 || typeof amount != 'number'){
            return res.status(404).json({message: "Valor inserido acima do maximo permitido de 100 bilhões ou abaixo do minimo permitido de 1 centavo"})
        }

        //5) 
        if (!['revenue', 'expense'].includes(type)){
            return res.status(400).json({message: "Apenas são permitidos os tipos 'revenue' ou 'expense'"})
        }

        //6)
        const isTransactionsTypeCorrect = await checkIfTransactionTypeMatchesToCategoryType(userId, type, categoryId);

       const isoPayDay = convertToISO(payDay.startDate);

        await prisma.$transaction(async () =>{

            //7)
            const invalidateAllKeysInCache = await invalidateAllKeysInCacheService('transactions');

            //8)
            const newBalance = await updateAccountBalanceService(accountId, type, amount, paid_out);

            const now = new Date();
            const createdAt = now;
            const updatedAt =  now;

            //9)
            const transaction = await newTransaction(
                amount,
                type,
                paid_out,
                isoPayDay,
                description,
                attachment,
                fixed,
                repeat,
                typeRepeat,
                remindMe,
                createdAt,
                updatedAt,
                userId,
                categoryId,
                accountId,
            )

            if (!transaction){
                return res.status(404).json({message: "Erro ao criar transacao"})
            }

            if(transaction.fixed){
                await prisma.fixedTransactions.create({
                    data:{
                        id: transaction.id,
                    }
                })
            }
            

            return res.status(201).json({message: "Transacao criada com sucesso"})

        })
    }catch(error){
        console.error("Erro ao criar transacao.", error);
        res.status(500).json({message: "Erro interno ao servidor"});
    }
    
}

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

const readPaidMonthTransactions = async(req, res) =>{
    try{

        const {month, year} = req.query;
        const userId = req.user.id;
        const startDate = new Date(year, monthMap[month], 1);
        const endDate = new Date(year, monthMap[month]+1, 1);

        // Validação do mês e ano
        if (!month || !year || isNaN(year) || !monthMap.hasOwnProperty(month)) {
            return res.status(400).json({ error: "Mês ou ano inválido!" });
        }

        if(!monthMap.hasOwnProperty(month)){
            return res.status(400).json({error: "Mes invalido!"})
        }
        
        const transactions = await readMonthPaidTransactionsService(userId, startDate, endDate);
        
        if(Array.isArray(transactions)){
            return res.status(200).json(transactions);
        }
        
    }catch(error){
        console.error('Erro ao tentar ler transacoes do mes', error);
        return res.status(500).json({error: "Erro ao tentar ler transacao"})
    }    
}

const readUnpaidTransactions = async(req, res) =>{
    try{
        const userId = req.user.id;
        
        const unpaidTransactions = await readUnpaidTransactionsService(userId);
        
        return res.status(200).json(unpaidTransactions)

    }catch(error){
        console.error("Erro ao tentar ler as transacoes nao pagas", error);
        return res.status(404).json({message: "Erro ao tentar ler as transacoes nao pagas"})
    }
}

const updateTransaction = async(req, res) =>{
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

const deleteTransaction = async(req, res) =>{
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

module.exports = {
    createTransaction,
    deleteTransaction,
    readPaidMonthTransactions,
    readUnpaidTransactions,
    updateTransaction
};