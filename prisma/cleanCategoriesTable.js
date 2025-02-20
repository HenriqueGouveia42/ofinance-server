require('dotenv').config({path:require('path').resolve(__dirname, '../.env')});
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanCategoriesTable(){
    try{
        await prisma.expenseAndRevenueCategories.deleteMany();
        console.log("Tabela de categorias de receitas e despesas limpa com sucesso");
    }catch(error){
        console.error("Erroa ao limpar a tabela de categorias", error);
    }
}

cleanCategoriesTable();