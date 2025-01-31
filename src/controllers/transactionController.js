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

        const isoPayDay = convertToISO(payDay.endDate);

        console.log(isoPayDay);

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
        const userId = req.user.id; //Pega o id anexado pelo middleware

        if(!monthMap.hasOwnProperty(month)){
            return res.status(400).json({error: "Mes invalido!"});
        }
        const startDate = new Date(year, monthMap[month], 1);
        const endDate = new Date(year, monthMap[month] + 1, 1);

        //Busca e agrupa as transacoes por tipo
        const transactions = await prisma.transactions.groupBy({
            by: ['type'],
            _sum:{
                amount:true
            },
            where:{
                user_id: userId,
                payDay:{
                    gte: startDate,
                    lt: endDate
                }
            }
        });

        //Inicializa o objeto de resposta
        const result = {
            revenue: 0,
            expense: 0
        };

        transactions.forEach(transactions=>{
            if(transactions.type === 'revenue'){
                result.revenue = transactions._sum.amount || 0;
            } else if(transactions.type === 'expense'){
                result.expense = transactions._sum.amount || 0;
            }
        })
        res.json(result)
        
    }catch(error){
        console.error('Erro ao tentar ler transacao do mes', error);
        res.status(500).json({error: "Erro ao tentar ler transacao do mes"})
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