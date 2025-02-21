const {cleanAccountsTable} = require('./cleanAccountsTable');
const {cleanCategoriesTable} = require('./cleanCategoriesTable');
const {cleanCurrenciesTable} = require('./cleanCurrenciesTable');

async function cleanAllUsersData(){
    try{
        await cleanAccountsTable();
        await cleanCategoriesTable();
        await cleanCurrenciesTable();
        console.log("Todos os dados de todos os usuarios foram limpos com sucesso")
    }catch(error){
        console.error("Erro ao tentar limpar as contas, as categorias de receitas e despesas e as moedas dos usuarios: ", error);
    }
}

cleanAllUsersData();