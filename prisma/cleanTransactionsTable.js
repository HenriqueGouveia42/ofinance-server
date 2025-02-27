require('dotenv').config({path:require('path').resolve(__dirname, '../.env')});

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanTransactionsTable() {
    try {
        // Deleta todos os registros da tabela Transactions
        await prisma.transactions.deleteMany();

        await prisma.accounts.updateMany({
            data:{
                balance: 0
            }
        });

        console.log('Tabela Transactions e balanços das contas limpos com sucesso!');
    } catch (error) {
        console.error('Erro ao limpar a tabela Transactions:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanTransactionsTable();

