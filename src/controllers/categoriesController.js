const { createCategory, checkIfCategoryAlreadyExists, updateCategoryName } = require("../services/categoryService");

const {prisma} = require('../config/prismaClient');

const newCategory = async(req, res) =>{
    try{
        const {name, type} = req.body;

        //Verifica se o tipo é válido
        if(!['revenue', 'expense'].includes(type)){
            return res.status(400).json({message: "Tipo de categoria invalido"})
        }

        //Verifica se o nome é valido
        if(typeof name !== "string" || !/^[a-zA-Z]/.test(name)){
            return res.status(400).json({message: "Nome invalido. Deve ser uma string e comecar com uma letra"})
        }

        const categoryAlreadyExists = await checkIfCategoryAlreadyExists(name, req.user.id, type);

        if(categoryAlreadyExists){
            return res.status(400).json({message: 'Usuario já tem uma categoria de receita ou despesa com esse nome!'});
        }

        const category = await createCategory(name, type, req.user.id);

        if(!category){
            return res.status(400).json({message: "Erro na criação da categoria"});
        }

        return res.status(201).json({message: "Categoria criada com sucesso!"});

    }catch(error){
        console.error("Erro ao criar nova categoria");
        return res.status(500).json({message: "Erro interno ao criar categoria"})
    }
}

const renameCategory = async(req, res) =>{
    try{
        const {categoryId, newCategoryName} = req.body;

        const newName = await updateCategoryName(req.user.id, categoryId, newCategoryName);

        return newName ? res.status(200).json({message: "Nome da categoria alterado com sucesso"}) : res.status(404).json({message: "Erro ao alterar o nome da categoria"})
    }catch(error){

        console.error("Erro ao mudar o nome da categoria")
        return res.status(404).json({message: "Erro ao mudar o nome da cateroria: ", error});
    }
}


const deleteCategory = async(req, res) =>{
    try{
        /*
            Algoritmo para deletar uma categoria
            1) Descorbrir todas as transações vinculadas a esta categoria
            2) Somar todos os balanços, positivos se de receita, negativos se de despesa, de todas transações vinculadas a esta categoria
            3) Atualizar os novos valores dos balanços das contas
            4) Deletar todas as transações vinculadas a esta categoria
            5) Deletar a categoria em si
        */
        const {categoryId} = req.body;
        const userId = req.user.id;

        const categoryType = await prisma.expenseAndRevenueCategories.findUnique({
            select:{
                type: true
            },
            where:{
                userId: userId,
                id: categoryId
            }
        })

        if(!categoryType){
            return res.status(404).json({message: "Usuario nao possui categoria com esse id"});
        }

        //1)
        const allTransactionsByCategoryId = await prisma.transactions.findMany({
            select:{
                accountId: true,
                type: true,
                amount: true,
            },
            where:{
                userId: userId,
                categoryId: categoryId
            }
        })

        if(allTransactionsByCategoryId.length == 0){
            const delCat = await prisma.expenseAndRevenueCategories.delete({
                where:{
                    userId: userId,
                    id: categoryId 
                }
            })
            return res.status(200).json({message:"Não existem transações vinculada a esta categoria. Categoria deletada com sucesso!"})
        }

        //allTranscationsByCategoryId = [
        //  {accountId: 5, type: "revenue", amount: 1500},
        //  {accountId: 6, type: "expense", amount: 750},
        //  {accountId: 5, type: "revenue", amount: 600},
        //  {accountId: 7, type: "expense", amount: 3500} ...
        //]



        //2)
        //Array de objetos do tipo
        //accountsIdsAndTotalBalance = [
        // {accountId: 5, totalBalance: -750},
        // {accountId: 6, totalBalance: -1500},
        // {accountId: 7, totalBalance: 5600} ...
        //]  
        let accountIdsAndTotalBalance = [];
        
        allTransactionsByCategoryId.forEach(transaction =>{

            let existingAccount = accountIdsAndTotalBalance.find(obj => obj.accountId === transaction.accountId)

            //Já eaxiste uma conta com o id do elemento da iteração atual = transactions.id
            if(existingAccount){
                transaction.type === 'revenue' ? 
                existingAccount.totalBalance += transaction.amount :
                existingAccount.totalBalance -= transaction.amount
            }else{
                accountIdsAndTotalBalance.push({
                    accountId: transaction.accountId,
                    totalBalance: transaction.type === 'revenue' ? transaction.amount : -transaction.amount,
                    type: transaction.type
                })
            }
        })

        //return res.status(200).json({message: "So far so good!"});

        //Os passos 3 e 4 e 5 precisam vir dentro de um bloco 'transaction', pois, caso uma chamada assíncrona falhe, todas as outras feitas anteriormente serão desfeitas, mantendo assim a atomicidade do banco de dados
        await prisma.$transaction(async (prisma) =>{
            //3)
            for(const account of accountIdsAndTotalBalance){

                const updateAccount = await prisma.accounts.update({
                    where:{
                        userId: req.user.id,
                        id: account.accountId
                    },
                    data:{
                        balance: account.totalBalance <= 0
                        ? {increment: Math.abs(account.totalBalance)}
                        : {decrement: Math.abs(account.totalBalance)}
                    }
                });
            }
            //4)
            const deleteTransactionsByCategory = await prisma.transactions.deleteMany({
                where:{
                    userId: req.user.id,
                    categoryId: categoryId
                }
            })
            //5)
            const deleteCat = await prisma.expenseAndRevenueCategories.delete({
                where:{
                    userId: req.user.id,
                    id: categoryId
                }
            })
        })

        return res.status(200).json({message: "Categoria deletada com sucesso!"});

    }catch(error){
        console.error("Erro ao deletar categoria", error);
        return res.status(404).json({message: "Erro ao deletar categoria"})
    }
}

module.exports = { newCategory, renameCategory, deleteCategory};