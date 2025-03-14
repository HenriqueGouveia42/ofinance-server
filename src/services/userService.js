//Servico responsavel por operações relacionadas ao usuario - criacao de usuario, salvamento de codigo de verificacao,

const bcrypt = require('bcryptjs');
const {sendConfirmationEmail} = require('../config/emailConfig');
const {prisma} = require('../config/prismaClient');

//A senha já chega aqui hasheada

//Criar usuario temporario na tabela stagedUsed
const createStagedUser = async ({ name, email, password, createdAt, expiresAt, verificationCode }) => {
    try {
        const user = await prisma.stagedUsers.create({
            data:{ 
                name: name,
                email: email,
                password: password,
                createdAt: createdAt,
                expiresAt: expiresAt,
                verificationCode: verificationCode
            },
        });
        return user;
    } catch (error) {
        console.log(error);
        return { error: 'Erro ao registrar usuario temporario no banco de dados' };
    }
};

//Criar usuario autenticado na tabela User
const createUser = async ({ email, name, password, createdAt }) => {
    
    try {
        const result = await prisma.$transaction(async (prisma)=>{
            //Criar user
            const user = await prisma.users.create({
                data:{
                    email,
                    name,
                    password,
                    createdAt
                },
            });

            //Criar a primeira moeda para o usuario criado
            const firstCurrency = await prisma.UsersCurrencies.create({
                data:{
                    userId: user.id,
                    name: 'Real Brasileiro',
                    symbol: 'BRL',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });

            //Atualizar o usuario para definir a moeda padrao
            const setFirstCurrency = await prisma.users.update({
                where:{
                    id: user.id
                },
                data:{
                    defaultCurrencyId: firstCurrency.id,
                }
            });

            return {user, firstCurrency, setFirstCurrency};
        })
        return result;
    } catch (error) {
        return { error: 'Erro ao registrar usuario definitivo ou criar a moeda padrao no banco de dados' };
    }
    
};

//Buscar usuario pelo e-mail
const findUserByEmail = async(email) =>{
    return await prisma.stagedUsers.findUnique({where:{email}});
}


//Verificar se o codigo é valido
const verifyCode = async(userId, code) =>{
    const user = await prisma.stagedUsers.findUnique({where:{id: userId}});

    if(!user || user.verificationCode !== code) return false;

    const now = new Date();

    if(user.expiresAt < now) return false;

    return true;
}

const loginByEmailAndPassword = async(email, password) =>{
    //Buscar o usuario pelo e-mail
    const user = await prisma.users.findUnique({
        where:{
            email: email
        }
    });

    if(!user){
        return false; //Usuario nao existe
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if(!isPasswordValid){
        return false; //Senha invalida
    }

    return user; //Login bem-sucedido, retorna os dados do usuario
}

//Retorna o "defaultCurrencyId" do modelo "Users" de um determinado "user_id"
const getDefaultCurrencyId = async(userId) =>{

try{
    const user = await prisma.users.findUnique({
        where: {id: userId},
        select: {defaultCurrencyId: true}
    })
    if(!user){
        throw new Error('Usuario nao encontrado');
    }
    return user.defaultCurrencyId;
}catch(error){
    console.error(error);
    console.log("Erro ao recuperar o defaultCurrencyId do usuario")
    throw error;
}
}

//Retorna o "name" do modelo "UsersCurrencies" de um determinado "defaultCurrencyId"
const getDefaultCurrencyById = async(defaultCurrencyId) =>{
    try{
        const currency = await prisma.usersCurrencies.findUnique({
            where: {id: defaultCurrencyId},
        });

        if(!currency){
            throw new Error('Moeda nao encontrada');
        }
        
        return currency;
    }catch(error){
        console.error(error);
        console.log("Erro ao recuperar o 'name' da moeda pelo id");
        throw error;
    }
}

const getAccountsByUserId = async(userId) =>{
    try{
        const accounts = await prisma.accounts.findMany({
            where:{
                userId: userId,
            },
        });
        return accounts; //Retorna um array vazio se nao houver contas cadastradas 
    }catch(error){
        console.error("Erro ao buscar contas do usuario", error);
        return null; //Retorna null apenas em casos de erro
    }
}

const getCurrenciesByUserId = async(userId) =>{
    try{
        const currencies = await prisma.usersCurrencies.findMany({
            where:{
                userId: userId
            },
        });
        return currencies;
    }catch(error){
        console.error("Erro ao retornar moedas cadadastradas do usuario: ", error);
        return null;
    }
}

const checkAccountId = async(accountId, user_id) =>{
    try{
        const account = await prisma.accounts.findUnique({
            where:{
                id: accountId,
            }
        });
        return account ? account.userId === user_id : false;
    }catch(error){
        console.error("Erro ao verificar se o id da conta é cadastrada e está em nome do referido usuario", error);
        return false;
    }
    
}

const updateAccountBalance = async(accountId, type, amount) => {
    try{
        const updateData =
            type === "expense"
            ? {balance: {decrement: amount}}
            : {balance: {increment: amount}};

        const newBalance = await prisma.accounts.update({
            where:{id: accountId},
            data:updateData,
        });

        return newBalance ? true : false;
    }catch(error){
        console.error("Erro ao atualizar o balanço da conta", error);
        return false;
    }
}

const getCategoriesById = async(userId) =>{
    try{
        const categories = await prisma.expenseAndRevenueCategories.findMany({
            select:{
                id: true,
                name: true,
                type: true
            },
            where:{
                userId: userId
            }
        });

        return categories.length == 0 ? [] : categories;
    }catch(error){
        console.error("Erro ao buscar categorias de receitas e despesas do usuario: ", error);
        return false;
    }
}

const checkIfAccountAlreadyExists = async(accountName, userId) =>{
    try{
        const account = await prisma.accounts.findFirst({
            where:{
                name: accountName,
                userId: userId
            }
        });
        
        if(account){
            return true
        }else{
            return false
        }
    }catch(error){
        console.error("Erro ao checar se a conta já existe", error);
        return null;
    }
}


module.exports = {
    createStagedUser,
    createUser,
    findUserByEmail,
    verifyCode,
    loginByEmailAndPassword,
    getDefaultCurrencyId,
    getDefaultCurrencyById,
    getAccountsByUserId,
    checkAccountId,
    updateAccountBalance,
    getCategoriesById,
    getCurrenciesByUserId,
    checkIfAccountAlreadyExists
};
