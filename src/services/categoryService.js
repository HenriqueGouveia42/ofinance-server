const {prisma} = require('../config/prismaClient');
const { newCategory } = require('../controllers/categoriesController');

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

//check cache first
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

const updateCategoryName = async(userId, categoryId, newCategoryName) => {
    try{
        
        if(typeof userId ==! "number" || typeof categoryId ==! "number" || typeof newCategoryName ==! "string"){
            return false;
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
        return true;
    }catch(error){
        console.error("Erro ao atualizar o nome da !!!!!!!!!!!!!!!");
        return false;
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

module.exports ={
    createCategory,
    checkIfCategoryAlreadyExists,
    updateCategoryName,
    checkIfCategoryExists,
    getCategoriesByUserId 
}