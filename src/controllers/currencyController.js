const {createCurrency, checkIfCurrencyAlreadyExists, updateCurrency} = require('../services/currencyServices')

const newCurrency = async(req, res) =>{
    try{
        const {currencyName, currencySymbol = ''} = req.body;

        //'currnecyName' e 'currencySymbol' não são variaveis independentes, mas sim valores
        //extraídos do  OBJETO req.body através da desestruturação, não existindo
        //como variaveis independents

        //Por esse motivo, caso o client não envie um 'currencySymbol', ele assume um valor padrao
        //de string vazia dentro da propria desestruturacao

        console.log(typeof currencySymbol);

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

const updateDefaultCurrency = async(req, res) =>{

    const {newDefaultCurrencyId} = req.body;

    const updateDefaultCurrencyId = await updateCurrency(req.user.id, newDefaultCurrencyId);

    if(!updateDefaultCurrencyId){
        return res.status(400).json({message: "Erro ao atualizar id da moeda padrao"});
    }
    
    return res.status(200).json({message: "id da moeda padrao alterado com sucesso"});
}

module.exports = {
    newCurrency,
    updateDefaultCurrency
}