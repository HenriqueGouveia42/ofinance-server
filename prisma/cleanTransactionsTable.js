const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanTransactionsTable() {
    try {
        await prisma.transactions.deleteMany(); // Deleta todos os registros da tabela User
        console.log('Tabela transactions limpa com sucesso!');
    } catch (error) {
        console.error('Erro ao limpar a tabela transactios:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanTransactionsTable();
