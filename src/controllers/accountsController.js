const {prisma} = require('../config/prismaClient');

const createAccount = async(req, res) =>{
    try{
        const {accountName} = req.body;
        if(!accountName || typeof accountName != "string" ){
            return res.status(400).json({error: "Nome da conta nulo ou não é uma string!"})
        }
        const account = await prisma.accounts.create({
            data:{
                userId: req.user.id,
                name: accountName,
                balance: 0
            }
        });
        return res.status(201).json({message:"Conta criada com sucesso!"})
    }catch(error){
        console.error("Erro ao criar nova conta: ", error);
        return res.status(500).json({ error: "Erro interno ao criar nova conta" });
    }
}

const updateBalance = async(req, res) =>{
    try{
        const {accountId, newBalance} = req.body;
        const updateBalance = await prisma.accounts.update({
            where:{
                id: accountId
            },
            data:{
                balance: newBalance
            }
        });
        return res.status(200).json({message: "Balanço da conta alterado com sucesso"})
    }catch(error){
        console.error("Erro ao atualizar o balanço da conta.", error);
        return res.status(304).json({message:"Erro ao modificar o balanço da conta"})
    }
}

const getCurrentBalanceById = async(req, res) =>{
    try{
        const {accountId} = req.query;
    }catch(error){
        console.error("Erro ao recuperar o balanço atual da conta");
        res.status(400).json({message: "Erro ao recuperar o balanço atual da conta"})
    }
}
module.exports = {createAccount, updateBalance};