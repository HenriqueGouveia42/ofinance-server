const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanUserTable() {
    try {

        await prisma.UsersCurrencies.deleteMany();
        console.log("Tabela UsersCurrencies limpa com sucesso!");
        await prisma.Users.deleteMany(); // Deleta todos os registros da tabela User
        console.log('Tabela Users limpa com sucesso!');
    } catch (error) {
        console.error('Erro ao limpar a tabela User:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanUserTable();
