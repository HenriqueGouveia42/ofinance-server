const {prisma} = require('../config/prismaClient');


//const newAccountController = async(req, res) =>{
//    try{
//        const {accountName} = req.body;
//        if(!accountName){
//            return res.status(400).json({error: "Nome da conta é obrigatorio!"})
//        }
//        const userId = req.user.id;
//    }catch(error){
//        console.error("Erro ao criar nova conta ", error);
//        console.log("Erro ao criar nova conta")
//    }
//}

const newAccountController = async(req, res) =>{
    try{
        const {accountName} = req.body;
        if(!accountName || typeof accountName != "string" ){
            return res.status(400).json({error: "Nome da conta nulo ou não é uma string!"})
        }
        return res.status(201).json({message: "Valor recebido é uma string! Sucesso!"})
    }catch(error){
        console.error("Erro ao criar nova conta: ", error);
        return res.status(500).json({ error: "Erro interno ao criar nova conta" });
    }
}
module.exports = {newAccountController};