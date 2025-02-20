const {prisma} = require('../config/prismaClient');

const createCategory = async(name, type, userId) =>{
    try{
        const category = await prisma.expenseAndRevenueCategories.create({
            data:{
                name,
                type,
                userId
            }
        })
        if(category){
            return category;
        }else{
            return null;
        }
    }catch(error){
        console.error("Erro no serviço de criar categoria");
        return null;
    }
}

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

module.exports ={
    createCategory,
    checkIfCategoryAlreadyExists
}