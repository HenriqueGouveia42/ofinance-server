const {
        createCurrency,
        checkIfCurrencyAlreadyExists,
        updateCurrency,
        checkIfCurrencyBelongsToUser,
        checkIfRecurringTransactionsExists,
        dellCurrency
    } = require('../services/currencyServices')

const {getAllTransactionsByCurrencyId} = require('../services/transactionsServices');

const {prisma} = require('../config/prismaClient');

const newCurrency = async(req, res) =>{
    try{
        const {currencyName, currencySymbol = ''} = req.body;

        //'currnecyName' e 'currencySymbol' não são variaveis independentes, mas sim valores
        //extraídos do  OBJETO req.body através da desestruturação, não existindo
        //como variaveis independents

        //Por esse motivo, caso o client não envie um 'currencySymbol', ele assume um valor padrao
        //de string vazia dentro da propria desestruturacao

        if(typeof currencySymbol === "undefined"){
            currencySymbol = ''
        }

        //Verifica se o currencyName é válido
        if(typeof currencyName !== "string" || !/^[a-zA-Z]/.test(currencyName)){
            return res.status(400).json({message: "Nome invalido. Deve ser uma string e comecar com uma letra"})
        }

        const currencyAlreadyExists = await checkIfCurrencyAlreadyExists(currencyName, req.user.id);

        //Verifica se moeda já existe
        if(currencyAlreadyExists){
            return res.status(400).json({message: "Usuario já possui uma conta com esse nome!"});
        }

        //Verifica se o currencySymbol é válido, ou seja, se é uma string
        if(typeof currencySymbol !== "string"){
            return res.status(400).json({message: "Nome do simbolo invalido. Deve ser uma string"})
        }

        

        const currency = await createCurrency(req.user.id, currencyName, currencySymbol);

        if(currency){
            return res.status(201).json({message: "Moeda criada com sucesso!"});
        }else{
            return res.status(400).json({message: "Erro ao criar moeda"})
        }
    }catch(error){
        console.error("Erro ao criar nova moeda", error);
        return res.status(400).json({message:"Erro ao tentar criar nova moeda"})
    }
}

const updateDefaultCurrency = async (req, res) =>{

    const {newDefaultCurrencyId} = req.body;

    const updateDefaultCurrencyId = await updateCurrency(req.user.id, newDefaultCurrencyId);

    if(!updateDefaultCurrencyId){
        return res.status(400).json({message: "Erro ao atualizar id da moeda padrao"});
    }
    
    return res.status(200).json({message: "id da moeda padrao alterado com sucesso"});
}

const deleteCurrency = async (req, res) =>{
    /*
        Algoritmo para deletar uma moeda
        1) Descobrir todas as transações vinculadas a esta moeda
        2) Somar todos os balanços, positivos se de receita, negativos se de despesa, de todas transações vinculadas a esta moeda
        3) Verificar se existem transações recorrentes vinculadas a esta moeda. Se existir, a moeda não pode ser deletada
        4) Atualizar os novos valores de balanço das contas que tinham transações vinculadas a esta moeda
        5) Deletar todas as transações vinculadas a esta moeda
        6) Deletar a moeda em si
    */
    try{

        const {currencyId} = req.body;
        const {userId} = req.user.id;

        if(typeof currencyId !== "number"){
            return res.status(404).json({message: "currencyId invalido. Deve ser do tipo 'Number'"})
        }
    
        //Passo 2: Verifica se existe essa moeda especifica para esse usuario especifico
        const belongsToUser = await checkIfCurrencyBelongsToUser(req.user.id, currencyId);

        if(!belongsToUser){
            return res.status(404).json({message: "Este usuario nao possui esta moeda cadastrada"})
        }

    
        //1)
        const allTransactionsByCurrencyId = await getAllTransactionsByCurrencyId(userId, currencyId);
    
        if(!allTransactionsByCurrencyId){
            return res.status(404).json({message: "Erro ao buscar transacoes vinculadas a esta moeda"});
        }

        if(allTransactionsByCurrencyId.lenght === 0){
            const dellCurr = await dellCurrency(userId, currencyId);
            return res.status(200).json({message: "Não foram encontradas transações vinculadas a esta moeda. Moeda deletada com sucesso!"})
        }

        //2)
        var accountIdsAndTotalBalance = [];

        allTransactionsByCurrencyId.forEach(transaction =>{

            let existingCurrency = accountIdsAndTotalBalance.find(obj => obj.accountId === transaction.accountId)

            if(existingCurrency){
                transaction.type === "revenue"
                ?   existingCurrency.totalBalance += transaction.amount
                :   existingCurrency.totalBalance -= transaction.amount
            }else{
                accountIdsAndTotalBalance.push({
                    accountId: transaction.accountId,
                    totalBalance: transaction.type === "revenue" ? transaction.amount : -transaction.amount
                })
            }

        })

        //3)
        const recurringTransactions = await checkIfRecurringTransactionsExists(currencyId);

        if(recurringTransactions){
            return res.status(404).json({message: "Existem transacoes recorrentes para essa moeda. Apague as transações recorrentes ou transfira as transações para outra moeda"})
        }

        await prisma.$transaction(async (prisma) =>{
            //4)
            for(const acc of accountIdsAndTotalBalance){
                const updateAccount = await prisma.accounts.update({
                    where:{
                        userId: userId,
                        accountId: acc.accountId
                    },
                    data:{
                        balance: acc.totalBalance <= 0
                        ? {increment: Math.abs(acc.totalBalance)}
                        : {decrement: Math.abs(acc.totalBalance)}

                    }
                })
            }
            //5
            const deleteTransactionsByCurrencyId = await prisma.transactions.deleteMany({
                where:{
                    userId: userId,
                    currencyId: currencyId
                }
            })
            //6
            const dellCurr = await dellCurrency(currencyId);
        })

        if(!dellCurr){
            return res.status(404).json({message: "Erro ao deletar moeda"});
        }

        return res.status(201).json({message: "Moeda deletada com sucesso"});

    }
    catch(error){
        console.error("Erro ao tentar deletar a moeda", error);
        return res.status(404).json({message: "Erro ao tentar deletar a moeda"})
    }
}

module.exports = {
    newCurrency,
    updateDefaultCurrency,
    deleteCurrency
}