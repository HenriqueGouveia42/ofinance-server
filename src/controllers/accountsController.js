const {prisma} = require('../config/prismaClient');
const { getAccountsByUserId, checkIfAccountAlreadyExists } = require('../services/userService');

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

const deleteAccount = async(req, res) =>{
    try{
        const {accountId} = req.body;

        //Passo 1: Verifica se o id é um numero
        if(typeof accountId ==! "Number"){
            return res.status(400).json({message: "Id da conta a ser deletada invalido"})
        }

        //Passo 2: Verifica se existe essa conta especifica para esse usuario especifico
        const accountExists = await prisma.accounts.findUnique({
            where:{
                id: accountId,
                userId: req.user.id
            }
        })

        if(!accountExists){
            return res.status(404).json({message: "Erro ao apagar conta. Conta não existe para este usuario"});
        }

        //Passo 3: Verifica se existem transacoes recorrentes associadas a esta conta
        const recurringTransactions = await prisma.transactions.findFirst({
            where:{
                accountId: accountId,
                repeat: true
            }
        })

        if(recurringTransactions){
            console.log("Esta conta tem transações recorrentes. Cancele ou transfira as transacoes recorrentes para outra conta");
            return res.status(404).json({message: "Esta conta tem transações recorrentes. Cancele ou transfira as transacoes recorrentes para outra conta"});
        }

        //Passo 4: Para deletar uma conta devemos, primeiro, deletar todas as transações associadas a essa conta
        await prisma.transactions.deleteMany({
            where:{accountId: accountId}
        });

        //Passo 5: Agora que as transações relacionadas a essa conta foram removidas, podemos deletar a conta propriamente dita, mantendo assim a integridade relacional do banco de dados
        await prisma.accounts.delete({
            where:{id: accountId}
        });

        return res.status(200).json({message: "Conta deletada com sucesso"});
    }catch(error){
        console.error("Erro ao tentar deletar conta", error);
        return res.status(404).json({message: "Erro ao tentar deletar conta"})
    }
}




module.exports = {createAccount, updateBalance, getAccounts, deleteAccount};