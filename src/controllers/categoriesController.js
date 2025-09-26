const { createCategoryService, renameCategoryService, deleteCategoryService } = require("../services/categoryService");

const AppError = require("../utils/AppError");

const createCategory = async(req, res) =>{
    try{

        const {name, type} = req.body;

        const userId = req.user.id

        await createCategoryService(name, type, userId)

        return res.status(201).json({message: "Categoria criada com sucesso!"});

    }catch(error){

        console.error("Erro ao criar nova categoria", error);

        if (error instanceof AppError){
            return res.status(error.statusCode).json({message: error.message})
        }
        
        return res.status(500).json({message: "Erro interno ao criar categoria"})
    }
}

const renameCategory = async(req, res) =>{
    try{
        const {categoryId, newCategoryName} = req.body;

        const userId = req.user.id

        const newName = await renameCategoryService(userId, categoryId, newCategoryName);

        return newName ? res.status(200).json({message: "Nome da categoria alterado com sucesso"}) : res.status(404).json({message: "Erro ao alterar o nome da categoria"})
    }catch(error){

        console.error("Erro ao mudar o nome da categoria", error)

        if (error instanceof AppError){
            return res.status(error.statusCode).json({message: error.message})
        }

        return res.status(500).json({message: "Erro interno ao mudar o nome da cateroria"});
    }
}

const deleteCategory = async(req, res) =>{
    try{
       
        const {categoryId} = req.body;

        const userId = req.user.id;

        const deleteCategory = await deleteCategoryService(categoryId, userId)

        if (deleteCategory == "zero_transactions"){
            return res.status(200).json({message:"Não existem transações vinculada a esta categoria. Categoria deletada com sucesso!"})
        }
        
        return res.status(200).json({message: "Categoria deletada com sucesso!"});

    }catch(error){
        console.error("Erro ao deletar categoria", error);

        if (error instanceof AppError){
            return res.status(error.statusCode).json({message: error.message})
        }

        return res.status(500).json({message: "Erro interno ao deletar categoria"})
    }
}

module.exports = { createCategory, renameCategory, deleteCategory};