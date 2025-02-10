const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanTransactionsTable() {
    try {
        // Deleta todos os registros da tabela unpaidTransactions, a fim de manter a integidade referencial do banco de dados
        await prisma.unpaidTransactions.deleteMany();

        // Deleta todos os registros da tabela Transactions
        await prisma.transactions.deleteMany();
        console.log('Tabela Transactions limpa com sucesso!');
    } catch (error) {
        console.error('Erro ao limpar a tabela Transactions:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanTransactionsTable();
