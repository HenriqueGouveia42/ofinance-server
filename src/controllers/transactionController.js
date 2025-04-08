const {prisma} = require('../config/prismaClient');

const {checkIfTransactionTypeMatchesToCategoryType, newTransaction} = require('../services/transactionsServices')

const {updateAccountBalance} = require('../services/accountsServices');
const { redisClient, expireKeyTime } = require('../config/redis');

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
            fixed,
            repeat,
            typeRepeat,
            remindMe,
            categoryId,
            accountId,
            currencyId
        } = req.body;

        const userId = req.user.id;
        
        //1)
        if(!amount || !type || !payDay){
            return res.status(400).json({message: 'Campos obrigatorios estao ausentes!'})
        }

        //2)
        if(typeof description == "string" && (description.length > 200)){
            return res.status(400).json({message: "Descrição com mais de 200 caracteres"})
        }

        //3) 
        if(typeof attachment == "string" && (attachment.length > 200)){
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
            const newBalance = await updateAccountBalance(accountId, type, amount);
            if(!newBalance){
                return res.status(404).json({message: "Erro ao atualizar o balaço da conta"});
            }

            const now = new Date();
            const createdAt = now;
            const updatedAt =  now;

            //8)
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
                currencyId 
            )

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

const readMonthTransactions = async(req, res) =>{
    try{
        const {month, year} = req.query;

        // Validação do mês e ano
        if (!month || !year || isNaN(year) || !monthMap.hasOwnProperty(month)) {
            return res.status(400).json({ error: "Mês ou ano inválido!" });
        }

        const userId = req.user.id;
        
        if(!monthMap.hasOwnProperty(month)){
            return res.status(400).json({error: "Mes invalido!"})
        }

        const cacheKey = `transactions:${userId}:${month}:${year}`;

        const cachedData = await redisClient.get(cacheKey);

        if(cachedData){
            return res.status(200).json(JSON.parse(cachedData));
        }

        const startDate = new Date(year, monthMap[month], 1);
        const endDate = new Date(year, monthMap[month]+1, 1);

        const transactions = await prisma.transactions.groupBy({
            by: ['type', 'paid_out'],
            _sum: {
                amount: true
            },
            _count: {
                id: true
            },
            where: {
                userId: userId,
                payDay:{
                    gte: startDate,
                    lt: endDate
                }
            }
        });
        
        if(Array.isArray(transactions)){
            redisClient.setEx(cacheKey, expireKeyTime, JSON.stringify(transactions));
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
        const unpaidTransactions = await prisma.transactions.findMany({
            where:{
                userId: userId,
                paid_out: false
            }
        })
        
        return res.status(200).json(unpaidTransactions)

    }catch(error){
        console.error("Erro ao tentar ler as transacoes nao pagas", error);
        return res.status(404).json({message: "Erro ao tentar ler as transacoes nao pagas"})
    }
}

const getAllTransactions = async (req, res) =>{
    try{
        const allTransactions = await prisma.transactions.findMany({
            where:{
                userId: req.user.id
            }
        })
        return allTransactions ? res.status(200).json(allTransactions) : []
    }catch(error){
        console.error("Erro ao tentar buscar todas as transacoes do usuario")
        return res.status(404).json({message: "Erro"})
    }
}

module.exports = {
    createTransaction,
    readMonthTransactions,
    readUnpaidTransactions,
    getAllTransactions
};