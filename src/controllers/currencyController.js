const {
        createCurrency,
        checkIfCurrencyAlreadyExists,
        updateCurrency,
        checkIfCurrencyBelongsToUser,
        checkIfRecurringTransactionsExists,
        deleteAllTransactionsForCurrency,
        dellCurrency
    } = require('../services/currencyServices')

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

    const {currencyId} = req.body;

    //Passo 1: Verifica se o currnecyId é um numero
    if(typeof currencyId !== "number"){
        return res.status(404).json({message: "currencyId invalido. Deve ser do tipo 'Number'"})
    }
    
     //Passo 2: Verifica se existe essa moeda especifica para esse usuario especifico
    const belongsToUser = await checkIfCurrencyBelongsToUser(req.user.id, currencyId);

    if(!belongsToUser){
        return res.status(404).json({message: "Este usuario nao possui esta moeda cadastrada"})
    }

    //Passo 3: Verifica se existem transacoes recorrentes associadas a esta moeda
    const recurringTransactions = await checkIfRecurringTransactionsExists(currencyId);

    if(recurringTransactions){
        return res.status(404).json({message: "Existem transacoes recorrentes para essa moeda. Apague as transações recorrentes ou transfira as transações para outra moeda"})
    }

    //Passo 4: Para deletar uma moeda devemos, primeiro, deletar todas as transações associadas a essa moeda
    const transactionsDell = await deleteAllTransactionsForCurrency(currencyId)

    if(!transactionsDell){
        return res.status(404).json({message: "Erro ao deletar as transacoes relacionadas a esta moeda"})
    }

    //Passo 5: Agora que as transações relacionadas a essa moeda foram removidas, podemos deletar a moeda propriamente dita, mantendo assim a integridade relacional do banco de dados
    const dellCurr = await dellCurrency(currencyId);

    if(!dellCurr){
        return res.status(404).json({message: "Erro ao deletar moeda"});
    }

    return res.status(201).json({message: "Moeda deletada com sucesso"});
    
}

module.exports = {
    newCurrency,
    updateDefaultCurrency,
    deleteCurrency
}