const {prisma} = require('../config/prismaClient');
const {checkAccountId, updateAccountBalance} = require('../services/userService');
const {checkIfTransactionTypeMatchesToCategoryType} = require('../services/transactionService')

const convertToISO = (dateString) =>{
    const date = new Date(dateString);
    return date.toISOString();
}

const createTransaction = async (req, res) =>{
    try{
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
            currencyId
        } = req.body;
        
        //Verifica a presença de campos obrigatorios
        if(!amount || !type || !payDay){
            return res.status(400).json({message: 'Campos obrigatorios estao ausentes!'})
        }

        //Verifica a validade do tipo de transacao enviado
        if (!['revenue', 'expense'].includes(type)){
            return res.status(400).json({message: "Apenas são permitidos os tipos 'revenue' ou 'expense'"})
        }

        const isTransactionsTypeCorrect = await checkIfTransactionTypeMatchesToCategoryType(type, categoryId);

        if(!isTransactionsTypeCorrect){
            return res.status(404).json({message: "Tipo da transacao não bate com a categoria escolhida"})
        }

        const isoPayDay = convertToISO(payDay.startDate);

        //Validação do accountId passado como argumento        
        const acc = await checkAccountId(accountId, req.user.id);
        if(!acc){
            return res.status(400).json({message: "Conta não existente, não cadastrada em nome do usuario ou do tipo incorreto"});
        }

        //Atualização do balanço da conta
        const newBalance = await updateAccountBalance(accountId, type, amount);
        if(!newBalance){
            return res.status(404).json({message: "Erro ao atualizar o balaço da conta"});
        }

        const now = new Date();
        const createdAt = now;
        const updatedAt =  now;

        const transaction = await prisma.transactions.create({ 
            data: {
                amount: amount,
                type: type,
                paid_out: paid_out,
                payDay: isoPayDay,
                description: description,
                attachment: attachment,
                fixed: fixed,
                repeat: repeat,
                typeRepeat: typeRepeat,
                remindMe: remindMe,
                createdAt: createdAt,
                updatedAt: updatedAt,

                userId: req.user.id, 
                categoryId: categoryId,
                accountId: accountId,
                currencyId: currencyId,
            }
        });
        
        res.status(201).json({message:"Transacao criada com sucesso!"});
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

const readMonthTransactions = async(req, res) =>{
    try{
        const {month, year} = req.query;
        const userId = req.user.id;
        
        if(!monthMap.hasOwnProperty(month)){
            return res.status(400).json({error: "Mes invalido!"})
        }

        const startDate = new Date(year, monthMap[month], 1);
        const endDate = new Date(year, monthMap[month]+1, 1);

        const transactions = await prisma.transactions.groupBy({
            by: ['type'],
            _sum: {
                amount: true
            },
            _count: {
                id: true
            },
            where: {
                user_id: userId,
                payDay:{
                    gte: startDate,
                    lt: endDate
                }
            }
        });

        //Inicializa o objeto de resposta
        const transactionsResult = {
            sumMonthRevenue: 0,
            sumMonthExpense: 0,
        };

        transactions.forEach(transaction =>{
            if(transaction.type === 'revenue'){
                transactionsResult.sumMonthRevenue = transaction._sum.amount || 0;
            }else if(transaction.type === 'expense'){
                transactionsResult.sumMonthExpense = transaction._sum.amount || 0;
            }
        })
        return res.status(200).json({message: "Dados do mes lidos com sucesso", transactionsResult});
    }catch(error){
        console.error('Erro ao tentar ler transacoes do mes', error);
        return res.status(500).json({error: "Erro ao tentar ler transacao"})
    }    
}

const readUnpaidTransactions = async(req, res) =>{
    try{
        const userId = req.user.id;

    }catch(error){
        console.error(error);
        console.log("Erro ao tentar ler as transacoes nao pagas");
        return res.status(404).json({message: "Erro ao tentar ler as transacoes nao pagas"})
    }
}

const getAllTranscations = async(req, res) =>{
    try{
        return res.status(201).json({message: "Rota funcionando!"})
    }catch(error){
        console.error("Erro ao tentar buscar todas as transacoes do usuario")
        return res.status(404).json({message: "Erro"})
    }
}

module.exports = { createTransaction, readMonthTransactions, readUnpaidTransactions, getAllTranscations };