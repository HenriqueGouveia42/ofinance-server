const AppError = require('../utils/AppError');


const{ createAccountService, getAccountsByUserIdService, renameAccountService, deleteAccountService, updateAccountBalanceService} 
= require('../services/accountsServices');

const createAccountController = async(req, res) =>{
    try{
        const {accountName, initialBalance} = req.body;

        const userId = req.user.id

        await createAccountService(userId, accountName, initialBalance)

        return res.status(201).json({message:"Conta criada com sucesso!"})

    }catch(error){

        console.error("Erro ao criar nova conta: ", error);
        
        if (error instanceof AppError){
            return res.status(error.statusCode).json({message: error.message})
        }

        return res.status(500).json({message:"Erro interno ao criar uma conta"})
    }
}

const getAccountsController = async(req, res) =>{
    try{
        userId = req.user.id

        accounts = await getAccountsByUserIdService(userId);

        res.status(200).json(accounts);
    }catch(error){

        console.error("Erro ao recuperar as contas do usuario: ", error);

        if (error instanceof AppError){
            return res.status(error.statusCode).json({message: error.message})
        }

        return res.status(500).json({message: "Erro interno ao tentar buscar as contas deste usuario"})
    }
}

const updateBalanceController = async(req, res) =>{
    try{

        const userId = req.user.id

        const {accountId, newAccountBalance, changeInitialBalanceOrCreateTransaction, categoryId} = req.body;

        await updateAccountBalanceService(userId, accountId, newAccountBalance, changeInitialBalanceOrCreateTransaction, categoryId)

        return res.status(200).json({message: "Balanço da conta alterado com sucesso"})

    }catch(error){

        console.error("Erro ao atualizar o balanço da conta.", error);

        if (error instanceof AppError){
            return res.status(error.statusCode).json({message: error.message})
        }

        return res.status(500).json({message:"Erro interno ao modificar o balanço da conta"})
    }
}

const renameAccountController = async(req, res) =>{
    try{
        const userId = req.user.id

        const {accountId, accountNewName} = req.body;

        await renameAccountService(userId, accountId, accountNewName)

        return res.status(200).json({message: "Nome atualizado com sucesso"});
    }catch(error){
        console.error("Erro ao renomear conta: ", error);

        if (error instanceof AppError){
            return res.status(error.statusCode).json({message: error.message})
        }

        return res.status(500).json({message: "Erro interno ao renomear conta"});
    }
}

const deleteAccountController = async(req, res) =>{
   
    try{
        const {accountId} = req.body;

        const userId = req.user.id;

        const delAcc = await deleteAccountService(userId, accountId);

        return res.status(200).json({message: "Conta deletada com sucesso"});
    }catch(error){

        console.log("Erro ao deletar esta conta", error)

        if (error instanceof AppError){
            return res.status(error.statusCode).json({message: error.message})
        }

        return res.status(500).json({message: "Erro interno ao tentar deletar conta"})
    }

}


module.exports = {createAccountController, updateBalanceController, getAccountsController, deleteAccountController, renameAccountController};