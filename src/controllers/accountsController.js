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
        /*
            Algoritmo para deletar uma conta
            1) Descobrir todas as transações vinculadas a esta conta
            2) Somar todos os balanços, positivos se de receita, negativos se de despesa, de todas transações vinculadas a esta conta
            3) Verifica se existem transações recorrentes vinculadas a esta conta. Se existir, a conta não pode ser deletada
            4) Atualizar o novo valor de balanço da conta
            5) Deletar todas as transações vinculadas a esta conta
            6) Deletar a conta em si
        */
        const {accountId} = req.body;

        const {userId} = req.user.id;

        if(typeof accountId ==! "Number"){
            return res.status(400).json({message: "Id da conta a ser deletada invalido"})
        }

        const accountExists = await prisma.accounts.findUnique({
            where:{
                id: accountId,
                userId: req.user.id
            }
        })

        if(!accountExists){
            return res.status(404).json({message: "Erro ao apagar conta. Conta não existe para este usuario"});
        }

        //1)
        const allTransactionsByAccountId = await prisma.transactions.findMany({
            select:{
                type: true,
                amount: true,
            },
            where:{
                userId: userId,
                accountId: accountId
            }
        });

        if (allTransactionsByAccountId.length == 0){
            const delAcc = await prisma.accounts.delete({
                where:{
                    userId: userId,
                    id: accountId
                }
            })
            return res.status(200).json({message: "Não existem transacoes vinculadas a esta conta. Conta deletada com sucesso!"})
        }

        const typeAndTotalBalance = 
        [
            {type: "revenue", totalBalance: 0},
            {type: "expense", totalBalance : 0}
        ]

        //2)
        allTransactionsByAccountId.forEach(transaction =>{
    
            transaction.type === "revenue"
            ?   typeAndTotalBalance[0].totalBalance += transaction.amount
            :   typeAndTotalBalance[1].totalBalance += transaction.amount;
            
        })

        //3)
        const recurringTransactionsExists = await prisma.transactions.findFirst({
            where:{
                accountId: accountId,
                repeat: true
            }
        })

        if(recurringTransactionsExists){
            console.log("Esta conta tem transações recorrentes. Cancele ou transfira as transacoes recorrentes para outra conta");
            return res.status(404).json({message: "Esta conta tem transações recorrentes. Cancele ou transfira as transacoes recorrentes para outra conta"});
        }

        await prisma.$transaction(async (prisma) =>{
            //4)
            const balanceResult = typeAndTotalBalance[0].totalBalance - typeAndTotalBalance[1].totalBalance

            const adjustBalance = await prisma.accounts.update({
                where:{
                    id: accountId,
                    userId: userId,
                },
                data:{
                    balance: balanceResult < 0
                    ?   {decrement: Math.abs(balanceResult)}
                    :   {increment: Math.abs(balanceResult)}
                }
            })

            //5
            const deleteTransactionsByAccountId = await prisma.transactions.deleteMany({
                where:{
                    userId: userId,
                    accountId: accountId
                }
            });

            //6
            const deleteAccount = await prisma.accounts.delete({
                where:{
                    id: accountId,
                    userId: userId
                }
            })
        })
        
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