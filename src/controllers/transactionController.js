const {prisma} = require('../config/prismaClient');
const {getDefaultCurrencyId, getDefaultCurrencyNameById} = require('../services/userService');

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
            category,
            account,
            attachment,
            fixed,
            repeat,
            typeRepeat,
            remindMe
        } = req.body; //Acessa diretamente as propriedades de 'req.body'

        if(!amount || !type || !payDay){
            return res.status(400).json({message: 'Campos obrigatorios estao ausentes!'})
        }

        const isoPayDay = convertToISO(payDay.startDate);

        const user_id = req.user.id; //Pnter user_id do token decodificado

        const currencyId = await getDefaultCurrencyId(user_id);
        
        const currencyName = await getDefaultCurrencyNameById(currencyId);
        
        const now = new Date();
        const createdAt = now;
        const updatedAt =  now;

        
        
        const transaction = await prisma.transactions.create({
            data: {
                user_id: user_id,
                currency: currencyName,
                createdAt: createdAt,
                updatedAt: updatedAt,
                
                amount: amount,
                type: type,
                paid_out: paid_out,
                payDay: isoPayDay,
                description: description,
                category: category,
                account: account,
                attachment: attachment,
                fixed: fixed,
                repeat: repeat,
                typeRepeat: typeRepeat,
                remindMe: remindMe
            },
        });

        if(transaction.paid_out === false){
            try{
                const unpaidTransaction = await prisma.unpaidTransactions.create({
                    data:{
                        userId: user_id,
                        transactionId: transaction.id,
                        amount: transaction.amount,
                        type: transaction.type
                    }
                })
            }catch(error){
                console.error(`Erro ao criar registro na tabela UnpaidTransactions para transactionId: ${transaction.id}`, error)
                console.log("Erro ao criar registro na tabela UnpaidTransacations")
            }
        }
        
        res.status(201).json(transaction);
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

        const paidTransactions = await prisma.transactions.groupBy({
            by: ['type'],
            _sum: {
                amount: true
            },
            _count: {
                id: true
            },
            where: {
                user_id: userId,
                paid_out: true, //Ignora as transacoes nao pagas
                payDay:{
                    gte: startDate,
                    lt: endDate
                }
            }
        });

        //Inicializa o objeto de resposta
        const paidTransactionsResult = {
            sumMonthRevenue: 0,
            sumMonthExpense: 0,
        };

        paidTransactions.forEach(transaction =>{
            if(transaction.type === 'revenue'){
                paidTransactionsResult.sumMonthRevenue = transaction._sum.amount || 0;
            }else if(transaction.type === 'expense'){
                paidTransactionsResult.sumMonthExpense = transaction._sum.amount || 0;
            }
        })
        res.json(paidTransactionsResult);
    }catch(error){
        console.error('Erro ao tentar ler transacoes do mes', error);
        res.status(500).json({error: "Erro ao tentar ler transacao"})
    }    
}

const readNotificationsContent = async(req, res) =>{
    try{
        const {month, year} = req.body;
        const userId = req.user.id;
        if(!monthMap.hasOwnProperty(month)){
            return res.status(400).json({error: "Mes invalido!"})
        }
    }catch(error){
        console.error(error);
        console.log("Erro ao tentar ler o conteudo das notificacoes do mes")
    }
}

module.exports = { createTransaction, readMonthTransactions };