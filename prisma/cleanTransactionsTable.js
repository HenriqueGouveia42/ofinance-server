const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanTransactionsTable() {
    try {
        await prisma.transactions.deleteMany(); // Deleta todos os registros da tabela Transactions
        console.log('Tabela Transactions limpa com sucesso!');
    } catch (error) {
        console.error('Erro ao limpar a tabela Transactions:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanTransactionsTable();
