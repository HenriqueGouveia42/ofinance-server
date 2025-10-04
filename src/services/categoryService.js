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
        console.error("Erro ao verificar se a categoria criada é válida", error);
        throw new AppError('Erro ao verificar se a categoria criada é válida', 404, 'CATEGORY_ERROR')
    }
}

const createCategoryService = async(name, type, userId) =>{
    
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

    const category = await prisma.expenseAndRevenueCategories.findFirst({
        where: {
            id: categoryId,
            userId: userId
        }
    });

    if (!category){
        throw new AppError("Este usuario nao tem uma categoria com esse 'id'", 404, "CATEGORY_ERROR")
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

    return prisma.$transaction(async (tx) => {

        //1 - encontra a categoria que vai ser deletada
        const categoryToDelete = await tx.expenseAndRevenueCategories.findFirst({
            where:{
                id: categoryId,
                userId: userId
            }
        })

        if (!categoryToDelete){
            throw new AppError("Categoria para este 'categoryId' e 'userId' nao encontrada", 400, "CATEGORY_ERROR")
        }

        //2 - verifica se existem transacoes a serem migradas para a categoria generica
        const relatedTransactionsCounter = await tx.transactions.count({
            where:{
                categoryId
            }
        })

        //se nao houver transacoes relacionadas, simplesmente delete a categoria
        if (relatedTransactionsCounter === 0){

            const deletedCategory = await tx.expenseAndRevenueCategories.delete({
                where:{
                    id: categoryId,
                    userId: userId
                }
            })

            return true
        }

        //3 - determinar o nome e o tipo da categoria generica de destino
        const generalCategoryName = categoryToDelete.type === 'revenue' ? "Receitas Gerais" : "Despesas Gerais";
        const generalCategoryType = categoryToDelete.type;

        
        //4 - upsert tenta atualizar um registro, se nao encontrar ele o cria
        const generalCategory = await tx.expenseAndRevenueCategories.upsert({
            where:{
                userId_type_name:{
                    userId: userId,
                    type: generalCategoryType,
                    name: generalCategoryName
                }
            },
            update: {}, //ja existe, nao atualiza nada
            create:{
                userId: userId,
                name: generalCategoryName,
                type: generalCategoryType
            }
        })

        //5 - atualiza todas as transacoes de uma so vez  
        await tx.transactions.updateMany({
            where:{
                categoryId: categoryId,
                userId: userId
            },
            data:{
                categoryId: generalCategory.id
            }
        })

        //6 - por fim, deleta a categoria original
        await tx.expenseAndRevenueCategories.delete({
            where:{id: categoryId}
        })
    })

    

}

module.exports ={
    createCategoryService,
    deleteCategoryService,
    renameCategoryService,
    checkIfCategoryExists,
    getCategoriesByUserId 
}