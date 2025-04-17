const {prisma} = require('../config/prismaClient');

const 
        {
            getAccountsByUserId,
            checkIfAccountAlreadyExists,
            deleteAccountById,
            checkIfrecurringTransactionsExists,
            deleteAccountService
        } = require('../services/accountsServices')


const createAccount = async(req, res) =>{
    try{
        const {accountName} = req.body;

        //Passo 1 Verifica se o nome é válido
        if(typeof accountName !== "string" || !/^[a-zA-Z]/.test(accountName)){
            return res.status(400).json({message: "Nome invalido. Deve ser uma string e comecar com uma letra"})
        }

        //Passo 2: Verifica se já não existe
        const accountAlreadyExists = await checkIfAccountAlreadyExists(accountName, req.user.id);

        if(accountAlreadyExists){
            return res.status(400).json({message: "Usuario já tem uma conta com esse nome!"})
        }

        const toTitleCase = (str) => {
            return str
              .toLowerCase()
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
        };

        const titleCaseAccountName = toTitleCase(accountName)

        const account = await prisma.accounts.create({
            data:{
                userId: req.user.id,
                name: titleCaseAccountName,
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

const deleteAccount = async(req, res) =>{
   
    try{

        const {accountId} = req.body;
        const {userId} = req.user.id;

        if(typeof accountId ==! "number"){
            return res.status(400).json({message: "Id da conta a ser deletada invalido"})
        }

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


module.exports = {createAccount, updateBalance, getAccounts, deleteAccount, renameAccount};