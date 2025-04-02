const {prisma} = require('../config/prismaClient');

const createCurrency = async(userId, currencyName, currencySymbol) =>{
    try{
        const currency = await prisma.usersCurrencies.create({
            data:{
                userId: userId,
                name: currencyName,
                symbol: currencySymbol
            }
        });
        if(currency){
            return true;
        }else{
            return false;
        }
    }catch(error){
        console.error("Erro ao tentar criar nova moeda", error);
        return false;
    }
}

const checkIfCurrencyAlreadyExists = async(name, userId) =>{
    try{
        const currencyAlreadyExists = await prisma.usersCurrencies.findFirst({
            where:{
                name,
                userId
            }
        });

        if(currencyAlreadyExists){
            return true;
        }else{
            return false;
        }
    }catch(error){
        console.error("Erro ao checar a moeda já existe para esse usuario", error);
        return null;
    }
}

const checkIfCurrencyBelongsToUser = async(userId, currencyId) => {
    try{
        const currencyExists = await prisma.usersCurrencies.findFirst({
            where:{
                userId: userId,
                id: currencyId
            }
        });

        return currencyExists ? true : false

    }catch(error){
        console.error("Erro ao checar se a moeda pertence ao usuario");
        return null;
    }
}

const updateCurrency = async(userId, newDefaultCurrencyId) =>{
    try{

        //Verifica se o atributo 'newDefaultCurrencyId' realmente pertence ao usuario com id = 'userId'
        const currencyIdExists = await prisma.usersCurrencies.findFirst({
            where:{
                id: newDefaultCurrencyId,
                userId: userId
            }
        });
        if(!currencyIdExists){
            return null;
        }

        const currency = await prisma.users.update({
            where:{
                id: userId
            },
            data:{
                defaultCurrencyId: newDefaultCurrencyId
            }
        })
        if(!currency){
            return false;
        }else{
            return true;
        }
    }catch(error){
        console.log("Erro ao tentar atualizar o id da moeda padrao", error);
        return null;
    }
}

const checkIfRecurringTransactionsExists = async (currencyId) =>{
    try{
        const reccuringTransactionsExists = await prisma.transactions.findFirst({
            where:{
                currencyId: currencyId,
                repeat: true
            }
        })

        return reccuringTransactionsExists ? true : false
    }catch(error){
        console.error("Erro ao checar se existem transacoes recorrentes associadas a essa moeda", error)
        return null;
    }
}

const deleteAllTransactionsForCurrency = async(currencyId) =>{
    try{
        const dell = await prisma.transactions.deleteMany({
            where:{
                currencyId: currencyId
            }
        });
        return dell ? true : false
    }catch(error){
        console.error("Erro ao tentar deletar todas as transacoes relacionadas a uma determinada moeda", error);
        return null;
    }
}

const dellCurrency = async (userId, currencyId) =>{
    try{
        const dCurr = await prisma.usersCurrencies.delete({
            where:{
                userId: userId,
                id: currencyId
            }
        });
        return dCurr;
    }catch(error){
        console.error("Erro ao tentar deletar moeda", error);
        return null;
    }
}

//check cache first
const getCurrenciesByUserId = async(userId) =>{
    try{
        const currencies = await prisma.usersCurrencies.findMany({
            where:{
                userId: userId
            },
        });
        return currencies;
    }catch(error){
        console.error("Erro ao retornar moedas cadadastradas do usuario", error);
        throw new Error('Erro ao retornar moedas cadadastradas do usuario');
    }
}

module.exports = {
    createCurrency,
    checkIfCurrencyAlreadyExists,
    checkIfCurrencyBelongsToUser,
    updateCurrency,
    checkIfRecurringTransactionsExists,
    deleteAllTransactionsForCurrency,
    dellCurrency,
    getCurrenciesByUserId
}