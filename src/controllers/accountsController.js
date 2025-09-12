const {prisma} = require('../config/prismaClient');

const{ createAccountService, getAccountsByUserId, deleteAccountService} 
= require('../services/accountsServices');
const AppError = require('../utils/AppError');


const createAccountController = async(req, res) =>{
    try{
        const {accountName} = req.body;

        const userId = req.user.id

        await createAccountService(userId, accountName)

        return res.status(201).json({message:"Conta criada com sucesso!"})

    }catch(error){

        console.error("Erro ao criar nova conta: ", error);
        
        if (error instanceof AppError){
            return res.status(error.statusCode).json({message: error.message})
        }

        return res.status(500).json({message:"Erro interno ao criar uma conta"})
    }
}

const getAccounts = async(req, res) =>{
    try{
        accounts = await getAccountsByUserId(req.user.id);
        res.status(200).json(accounts);
    }catch(error){
        console.error("Erro ao recuperar as contas do usuario");
        res.status(404).json({message: "Erro ao recuperar contas cadastradas do usuarios"})
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

const deleteAccount = async(req, res) =>{
   
    try{

        const {accountId} = req.body;
        const {userId} = req.user.id;

        const delAcc = await deleteAccountService(userId, accountId);

        return res.status(200).json({message: "Conta deletada com sucesso"});
    }catch(error){
        console.error("Erro ao tentar deletar conta", error);
        return res.status(404).json({message: "Erro ao tentar deletar conta"})
    }

}

const renameAccount = async(req, res) =>{
    try{
        const {accountId, accountNewName} = req.body;

        if(typeof accountId ==! "number" || typeof accountNewName ==! "string"){
            return res.status(404).json({message: "Tipos de entrada incorretos"})
        }

        const renameAccount = await prisma.accounts.update({
            where:{
                id: accountId,
                userId: req.user.id
            },
            data:{
                name: accountNewName
            }
        })
        return res.status(200).json({message: "Nome atualizado com sucesso"});
    }catch(error){
        console.error("Erro ao renomear conta");
        return res.status(404).json({message: "Erro ao renomear conta: ", error});
    }
}


module.exports = {createAccountController, updateBalance, getAccounts, deleteAccount, renameAccount};