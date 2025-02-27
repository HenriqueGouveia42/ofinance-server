const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanAllUsersData(){
    try{
        await prisma.transactions.deleteMany();

        await prisma.accounts.updateMany({
            data:{
                balance: 0
            }
        });

        await prisma.accounts.deleteMany(); //Deleta todos os registros da tabela Accounts

        await prisma.expenseAndRevenueCategories.deleteMany();

        await prisma.usersCurrencies.deleteMany();

        console.log("Todos os dados de todos os usuarios foram limpos com sucesso")
    }catch(error){
        console.error("Erro ao tentar limpar as contas, as categorias de receitas e despesas e as moedas dos usuarios: ", error);
    }
}

cleanAllUsersData();