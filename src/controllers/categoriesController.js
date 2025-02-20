const { createCategory, checkIfCategoryAlreadyExists } = require("../services/categoryService");

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

module.exports = { newCategory};