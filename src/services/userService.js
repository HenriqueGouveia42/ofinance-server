//Servico responsavel por operações relacionadas ao usuario - criacao de usuario, salvamento de codigo de verificacao,

const bcrypt = require('bcrypt');
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
}finally{
    await prisma.$disconnect();
}
}

//Retorna o "name" do modelo "UsersCurrencies" de um determinado "defaultCurrencyId"
const getDefaultCurrencyNameById = async(defaultCurrencyId) =>{
    try{
        const currency = await prisma.usersCurrencies.findUnique({
            where: {id: defaultCurrencyId},
            select: {name: true},
        });

        if(!currency){
            throw new Error('Moeda nao encontrada');
        }
        return currency.name;
    }catch(error){
        console.error(error);
        console.log("Erro ao recuperar o 'name' da moeda pelo id");
        throw error;
    }finally{
        await prisma.$disconnect();
    }
}

module.exports = {
    createStagedUser,
    createUser,
    findUserByEmail,
    verifyCode,
    loginByEmailAndPassword,
    getDefaultCurrencyId,
    getDefaultCurrencyNameById
};
