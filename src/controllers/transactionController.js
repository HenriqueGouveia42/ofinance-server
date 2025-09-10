const {prisma} = require('../config/prismaClient');

const {checkIfTransactionTypeMatchesToCategoryType, createTransactionService, readMonthPaidTransactionsService, readUnpaidTransactionsService, updateTransactionService, deleteTransactionService, validateReqBody} = require('../services/transactionsServices')

const {updateAccountBalanceService} = require('../services/accountsServices');

const {invalidateAllKeysInCacheService} = require('../services/cacheService');
const { repeatEachOptions } = require('@prisma/client');

/*funcao que valida o objeto 'payDay' que vem no body*/
function isValidPayDay(payDay) {
    return (
        typeof payDay === 'object' &&
        payDay !== null &&
        typeof payDay.startDate === 'string' &&
        !isNaN(Date.parse(payDay.startDate)) &&
        typeof payDay.endDate === 'string' &&
        !isNaN(Date.parse(payDay.endDate))
    );
}

// Função para validar objeto recurrence mínimo
function validateRecurrence(recurrence) {
    if (!recurrence) {
        return "O objeto 'recurrence' é obrigatório dentro de 'fixedTransaction' ou 'repeatTransaction'.";
    }
    if (!recurrence.frequency) {
        return "O campo 'frequency' é obrigatório em 'recurrence'.";
    }
    if (typeof recurrence.interval !== "number" || recurrence.interval < 1) {
        return "O campo 'interval' em 'recurrence' deve ser um número inteiro positivo.";
    }
    return null; // OK
}


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
            5) Verifica se o tipo de transação ('revenue' ou 'expense') é compatível com o tipo de categoria escolhido ('revenue' ou 'expense')
            6) Revogar as keys do redis relacionadas a transacoes
            7) Atualização do balanço da conta
            8) Criar a nova transação
            
        */
        const {
            amount,
            type,
            paid_out,
            payDay,
            description,
            attachment,
            remindMe,
            categoryId,
            accountId,
            repeatTransaction
        } = req.body;

        const userId = req.user.id;

        const transactionData = {
            amount,
            type,
            paid_out,
            payDay: new Date(payDay),
            description,
            attachment,
            remindMe: remindMe ? new Date(remindMe) : null,
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: userId,
            categoryId,
            accountId,
            repeatTransaction: repeatTransaction ?
            {
                repeatTransactionDetails:{
                    repeatEvery: repeatTransaction.repeatEvery,
                    repeatEachOptions: repeatTransaction.repeatEachOptions,
                    repeatOnDayOfMonth: repeatTransaction.repeatOnDayOfMonth,
                    ends: repeatTransaction.ends,
                    endsAt: repeatTransaction.endsAt,
                    endsAfterOccurencies: repeatTransaction.endsAfterOccurencies,

                    repeatEachWeekdays:{
                        connect: repeatTransaction.daysOfWeek.map((day) => ({
                            name: day
                        }))
                    }

                }
            } :

            undefined
        };

        return res.status(200).json(transactionData)


        const isReqBodyValid = validateReqBody(transactionData)

        

        if(fixedTransaction && repeatTransaction){
            return res.status(400).json({message: "Uma transacao nao pode ter os atributos 'fixedTransaction' e 'repeatTransaction' ao mesmo tempo!"})
        }

        if (fixedTransaction){

            const error = validateRecurrence(fixedTransaction.recurrence)
            if (error){
                return res.status(400).json({message: error})
            }

            //aqui vou criar a logica de criar um registro na tabela 'ransactionRecurrence' e depois na tabela 'fixedTransactions' ou 'repeatTransactions'
            const {recurrence} = fixedTransaction;

            //1. Criar a TransactionRecurrence
            const createdRecurrence = await prisma.transactionRecurrence.create({
                data:{
                    frequency: recurrence.frequency,
                    interval: recurrence.interval,
                    dayOfMonth: recurrence.dayOfMonth || null,
                    weekOfMonth: recurrence.weekOfMonth || null,
                    dayOfWeek: recurrence.dayOfWeek || null,
                    endsAfter: recurrence.endsAfter || null,
                    endsAt: recurrence.endsAt || null,
                    neverEnds: recurrence.neverEnds || false,
                    recurrenceDays:{
                        create: recurrence.recurrenceDays?.map(day =>({
                            day: day
                        })) || []
                    }
                }
            });

        }

        if (repeatTransaction){
            const error = validateRecurrence(repeatTransaction.recurrence)
            if (error){
                return res.status(400).json({message: error})
            }
        }
        
        //1)
        if(typeof amount != 'number' ||
            !(['expense', 'revenue'].includes(type)) ||
            !(isValidPayDay(payDay)) ||
            typeof description != 'string' ||
            typeof attachment != 'string')
            {
                return res.status(400).json({message: 'Algum campo está ausente ou incorreto!'})
            }

        //2)
        if(description && description.length > 200){
            return res.status(400).json({message: "Descrição com mais de 200 caracteres"})
        }

        //3) 
        if(attachment && attachment.length > 200){
            return res.status(400).json({message: "Attachment com mais de 200 caracteres"})
        }

        //4)
        if(amount > 100000000000 || amount < 0.01){
            return res.status(404).json({message: "Valor inserido acima do maximo permitido de 100 bilhões ou abaixo do minimo permitido de 1 centavo"})
        }


        //5)
        const isTransactionsTypeCorrect = await checkIfTransactionTypeMatchesToCategoryType(userId, type, categoryId);

       const isoPayDay = convertToISO(payDay.startDate);

        await prisma.$transaction(async () =>{

            //6)
            //const invalidateAllKeysInCache = await invalidateAllKeysInCacheService('transactions');

            //7) - Balanço da conta so será alterado se a transacao for 'paga'
            const newBalance = await updateAccountBalanceService(accountId, type, amount, paid_out);

            const now = new Date();
            const createdAt = now;
            const updatedAt =  now;

            //8)
            const transaction = await createTransactionService(req.body)

            if (!transaction){
                return res.status(404).json({message: "Erro ao criar transacao"})
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