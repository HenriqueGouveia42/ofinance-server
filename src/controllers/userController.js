const {prisma} = require('../config/prismaClient');

const {getNameEmailAndCurrencyByUserId} = require('../services/userService');
const {getAccountsByUserId} = require('../services/accountsServices');
const {getCategoriesByUserId} = require('../services/categoryService');
const {getCurrenciesByUserId} = require('../services/currencyServices')

const getUserData = async(req, res) =>{
    try{
        const userId = req.user.id;

        const userData = {
            name: null,
            email: null,
            defaultCurrencyId: null,
            currencies: null,
            accounts: null,
            categories: null
        };
        
        const nameEmailAndDefaultCurrencyId = await getNameEmailAndCurrencyByUserId(userId);
        
        if(!nameEmailAndDefaultCurrencyId){
            return res.status(404).json({message: "Usuario nao encontrado"});
        }

        const accounts = await getAccountsByUserId(userId);

        const categories = await getCategoriesByUserId(userId);
        
        const currencies = await getCurrenciesByUserId(userId);
        
        userData.name = nameEmailAndDefaultCurrencyId.name;
        userData.email = nameEmailAndDefaultCurrencyId.email;
        userData.defaultCurrencyId = nameEmailAndDefaultCurrencyId.defaultCurrencyId;
        userData.currencies = currencies;
        userData.accounts = accounts;
        userData.categories = categories;

        return res.status(200).json(userData);
        
    }catch(error){
        console.error("Erro ao buscar os dados cadastrados do usuario: ", error);
        return res.status(404).json({message: "Erro ao buscar os dados cadastrados do usuario"});
    }
}

module.exports={
    getUserData
}