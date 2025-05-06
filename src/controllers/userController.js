const {prisma} = require('../config/prismaClient');

const {getNameAndEmailByUserId} = require('../services/userService');
const {getAccountsByUserId} = require('../services/accountsServices');
const {getCategoriesByUserId} = require('../services/categoryService');

const getUserData = async(req, res) =>{
    try{
        const userId = req.user.id;

        const userData = {
            name: null,
            email: null,
            accounts: null,
            categories: null
        };
        
        const nameAndEmail = await getNameAndEmailByUserId(userId);
        
        if(!nameAndEmail){
            return res.status(404).json({message: "Usuario nao encontrado"});
        }

        const accounts = await getAccountsByUserId(userId);

        const categories = await getCategoriesByUserId(userId);
                
        userData.name = nameAndEmail.name;
        userData.email = nameAndEmail.email;
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