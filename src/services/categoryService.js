const {prisma} = require('../config/prismaClient');
const AppError = require('../utils/AppError');

const checkIfCategoryAlreadyExists = async(name, userId, type) =>{
    try{
        const categoryAlreadyExists = await prisma.expenseAndRevenueCategories.findFirst({
            where:{
                name,
                userId,
                type
            }
        });
        if(categoryAlreadyExists){
            return true
        }else{
            return false
        }
    }catch(error){
        console.error("Erro ao verificar se a categoria criada é válida");
        return null;
    }
}


const createCategoryService = async(name, type, userId) =>{
    

    //Verifica se o tipo é válido
    if(!['revenue', 'expense'].includes(type)){
        throw new AppError('Tipo de categoria invalido', 400, 'CATEGORY_ERROR')
    }

    //Verifica se o nome é valido
    if(typeof name !== "string" || !/^[a-zA-Z]/.test(name)){
        throw new AppError('Nome da categoria invalido', 400, 'CATEGORY_ERROR')
    }

    const categoryAlreadyExists = await checkIfCategoryAlreadyExists(name, userId, type);

    if(categoryAlreadyExists){
        throw new AppError('Essa categoria já existe', 400, 'CATEGORY_ERROR')
    }

    const toTitleCase = (str) => {
        return str
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const titleCaseName = toTitleCase(name);

    const category = await prisma.expenseAndRevenueCategories.create({
        data:{
            name: titleCaseName,
            type: type,
            userId: userId
        }
    })

    if(!category){
        throw new AppError('Erro ao criar nova categoria', 400, 'CATEGORY_ERROR')
    }
}

const checkIfCategoryExists = async(userId, categoryId) => {
    try{
        const checkIfExists = await prisma.expenseAndRevenueCategories.findUnique({
            where:{
                userId: userId,
                id: categoryId
            }
        })
        return true;
    }catch(error){
        console.error("Erro ao verificar se essa categoria existe", error);
    }
}

const renameCategoryService = async(userId, categoryId, newCategoryName) => {
    
        
    if(typeof userId ==! "number" || typeof categoryId ==! "number" || typeof newCategoryName ==! "string"){
        throw new AppError('Algum parametro da renomeacao esta incorreto', 404, 'CATEGORY_ERROR')
    }

    const newAccName = await prisma.expenseAndRevenueCategories.update({
        where:{
            userId: userId,
            id: categoryId
        },
        data:{
            name: newCategoryName
        }
    })
    
    if (!newAccName){
        throw new AppError('Erro ao tentar renomear categoria')
    }
    
}

//check cache first
const getCategoriesByUserId = async(userId) =>{
    try{
        const categories = await prisma.expenseAndRevenueCategories.findMany({
            select:{
                id: true,
                name: true,
                type: true
            },
            where:{
                userId: userId
            }
        });
        return categories;
    }catch(error){
        console.error("Erro ao buscar categorias de receitas e despesas do usuario: ", error);
        throw new Error('Erro ao buscar categorias de receitas e despesas do usuario');
    }
}

const deleteCategoryService = async(categoryId, userId) => {

     /*
        Algoritmo para deletar uma categoria
        1) Descobrir todas as transações vinculadas a esta categoria
        2) Somar todos os balanços, positivos se de receita, negativos se de despesa, de todas transações vinculadas a esta categoria
        3) Atualizar os novos valores dos balanços das contas
        4) Deletar todas as transações vinculadas a esta categoria
        5) Deletar a categoria em si
    */

    const categoryType = await prisma.expenseAndRevenueCategories.findUnique({
        select:{
            type: true
        },
        where:{
            userId: userId,
            id: categoryId
        }
    })

    if (!categoryType){
        throw new AppError('Erro ao buscar o tipo da categoria a ser deletado', 400, 'CATEGORY_ERROR')
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

    if (!allTransactionsByCategoryId){
        throw new AppError('Erro ao buscar todas as transacoes vinculadas a essa categoria', 404, 'CATEGORY_ERROR')
    }

    if(allTransactionsByCategoryId.length == 0){

        const delCat = await prisma.expenseAndRevenueCategories.delete({
            where:{
                userId: userId,
                id: categoryId 
            }
        })

        if (!delCat){
            throw new AppError('Erro ao deletar as categorias quando nao existem transacoes vinculadas a esta categoria', 404, 'CATEGORY_SERVICE')
        }

        return "zero_transactions"
    }

    //1)
        //allTranscationsByCategoryId = [
        //  {accountId: 5, type: "revenue", amount: 1500},
        //  {accountId: 6, type: "expense", amount: 750},
        //  {accountId: 5, type: "revenue", amount: 600},
        //  {accountId: 7, type: "expense", amount: 3500} ...
        //]


    let accountIdsAndTotalBalance = [];

    //2)
        //Array de objetos do tipo
        //accountsIdsAndTotalBalance = [
        // {accountId: 5, totalBalance: -750},
        // {accountId: 6, totalBalance: -1500},
        // {accountId: 7, totalBalance: 5600} ...
        //
    //]

    allTransactionsByCategoryId.forEach(transaction =>{

        let existingAccount = accountIdsAndTotalBalance.find(obj => obj.accountId === transaction.accountId)

        //Já existe uma conta com o id do elemento da iteração atual = transactions.id
        if(existingAccount){
            transaction.type === 'revenue' ? 
            existingAccount.totalBalance += transaction.amount :
            existingAccount.totalBalance -= transaction.amount
        }else{
            accountIdsAndTotalBalance.push({
                accountId: transaction.accountId,
                totalBalance: transaction.type === 'revenue' ? transaction.amount : -transaction.amount,
            })
        }
    })

    //Os passos 3 e 4 e 5 precisam vir dentro de um bloco 'transaction', pois, caso uma chamada assíncrona falhe, todas as outras feitas anteriormente serão desfeitas, mantendo assim a atomicidade do banco de dados
    const cascadeOperationsPrismaTransaction = await prisma.$transaction(async (prisma) =>{
        //3)
        for(const account of accountIdsAndTotalBalance){

            const updateAccount = await prisma.accounts.update({

                where:{
                    userId: userId,
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
                userId: userId,
                categoryId: categoryId
            }
        })

        //5)
        const deleteCat = await prisma.expenseAndRevenueCategories.delete({
            where:{
                userId: userId,
                id: categoryId
            }
        })
    })

}

module.exports ={
    createCategoryService,
    checkIfCategoryAlreadyExists,
    deleteCategoryService,
    renameCategoryService,
    checkIfCategoryExists,
    getCategoriesByUserId 
}