require('dotenv').config({path:require('path').resolve(__dirname, '../.env')});
const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanAccountsTable(){
    try{
        await prisma.accounts.deleteMany(); //Deleta todos os registros da tabela Accounts
        console.log("Tabela Accounts limpa com sucesso!");
    }catch(error){
        console.error("Erro ao limpar a tabela Accounts:", error);
    }finally{
        prisma.$disconnect();
    }
}

cleanAccountsTable();