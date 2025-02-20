const {prisma} = require('../config/prismaClient');
const { getAccountsByUserId, checkIfAccountAlreadyExists } = require('../services/userService');

const createAccount = async(req, res) =>{
    try{
        const {accountName} = req.body;

        //Verifica se o nome é válido
        if(typeof accountName !== "string" || !/^[a-zA-Z]/.test(accountName)){
            return res.status(400).json({message: "Nome invalido. Deve ser uma string e comecar com uma letra"})
        }

        //Verifica se já não existe
        const accountAlreadyExists = await checkIfAccountAlreadyExists(accountName, req.user.id);

        if(accountAlreadyExists){
            return res.status(400).json({message: "Usuario já tem uma conta com esse nome!"})
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




module.exports = {createAccount, updateBalance, getAccounts};