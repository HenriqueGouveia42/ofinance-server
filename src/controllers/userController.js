const {prisma} = require('../config/prismaClient');

const {getDefaultCurrencyId, getCategoriesById, getCurrenciesByUserId} = require('../services/userService');
const {getAccountsByUserId} = require('../services/accountsServices');

const getUserData = async(req, res) =>{
    try{
        const userId = req.user.id;

        const userData = {
            name: null,
            email: null,
            currencies: null,
            defaultCurrencyId: null,
            accounts: null,
            categories: null
        };
        
        const nameAndEmail = await prisma.users.findUnique({
            where:{id: userId},
            select: {name:true, email: true}
        });

        if(!nameAndEmail){
            return res.status(404).json({message: "Usuario nao encontrado"});
        }

        const defaultCurrencyId = await getDefaultCurrencyId(userId);

        const accounts = await getAccountsByUserId(userId);

        const categories = await getCategoriesById(userId);

        const currencies = await getCurrenciesByUserId(userId);

        userData.name = nameAndEmail.name;
        userData.email = nameAndEmail.email;
        userData.currencies = currencies;
        userData.defaultCurrencyId = defaultCurrencyId;
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