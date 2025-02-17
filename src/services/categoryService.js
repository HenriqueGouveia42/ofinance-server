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


module.exports ={
    createCategory,
}