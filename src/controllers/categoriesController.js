const { createCategory } = require("../services/categoryService");

const newCategory = async(req, res) =>{
    try{
        const {name, type} = req.body;

        if(!['revenue', 'expense'].includes(type)){
            return res.status(400).json({message: "Tipo de categoria invalido"})
        }

        if(typeof name !== "string" || !/^[a-zA-Z]/.test(name)){
            return res.status(400).json({message: "Nome invalido. Deve ser uma string e comecar com uma letra"})
        }

        const category = await createCategory(name, type, req.user.id);

        if(!category){
            return res.status(400).json({message: "Erro na criação da categoria"});
        }

        return res.status(201).json({message: "Categoria criada com sucesso!", category})

    }catch(error){
        console.error("Erro ao criar nova categoria");
        return res.status(500).json({message: "Erro interno ao criar categoria"})
    }
}

module.exports = { newCategory};