const {prisma} = require('../config/prismaClient');


const newAccountController = async(req, res) =>{
    try{
        const {accountName} = req.body;
        if(!accountName){
            return res.status(400).json({error: "Nome da conta é obrigatorio!"})
        }
        const userId = req.user.id;
    }catch(error){
        console.error("Erro ao criar nova conta ", error);
        console.log("Erro ao criar nova conta")
    }
}
module.exports = {newAccountController};