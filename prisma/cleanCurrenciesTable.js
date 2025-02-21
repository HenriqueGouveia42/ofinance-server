require('dotenv').config({path:require('path').resolve(__dirname, '../.env')});
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanCurrenciesTable(){
    try{
        await prisma.usersCurrencies.deleteMany();
        console.log("Tabela de moedas limpa com sucesso");
    }catch(error){
        console.error("Erroa ao limpar a tabela de moedas", error);
    }
}

module.exports = {cleanCurrenciesTable}