const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanStagedUserTable() {
    try {
        await prisma.stagedUsers.deleteMany(); // Deleta todos os registros da tabela User
        console.log('Tabela stagedUsers limpa com sucesso!');
    } catch (error) {
        console.error('Erro ao limpar a tabela User:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanStagedUserTable();
