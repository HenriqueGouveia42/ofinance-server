const AppError = require('../utils/AppError');
const {getUserDataService} = require('../services/userService')

const getUserData = async(req, res) =>{
    try{
        const userId = req.user.id;

        const userData = await getUserDataService(userId)

        return res.status(200).json(userData);
        
    }catch(error){
        console.error("Erro ao buscar os dados cadastrados do usuario: ", error);

        if (error instanceof AppError){
            res.status(error.statusCode).json({message: error.message})
        }

        return res.status(500).json({message: "Erro interno ao buscar os dados cadastrados do usuario"});
    }
}

module.exports={
    getUserData
}