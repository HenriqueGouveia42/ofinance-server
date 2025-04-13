const bcrypt = require('bcryptjs');
const {sendConfirmationEmail} = require('../config/emailConfig');
const {prisma} = require('../config/prismaClient');
const {redisClient} = require('../config/redis')


const getNameEmailAndCurrencyByUserId = async(userId) =>{
    try{
    
        const _getNameEmailAndCurrencyId = await prisma.users.findUnique({
            select:{
                name: true,
                email: true,
                defaultCurrencyId: true
            },
            where:{
                id: userId
            }
        })

        return _getNameEmailAndCurrencyId
    }catch(error){
        console.error("Erro ao buscar nome e email do usuario", error);
        throw new Error('Erro ao buscar nome e email do usuario');
    }
}

//CACHE - OK
const getDefaultCurrencyByCurrencyId = async(defaultCurrencyId) =>{
    try{
        
        const defaultCurrency = await prisma.usersCurrencies.findUnique({
            where: {id: defaultCurrencyId},
        });

        if(!defaultCurrency){
            throw new Error('Moeda nao encontrada');
        }

        
        return defaultCurrency;
    }catch(error){
        console.error('Erro ao recuperar o nome da moeda pelo seu id', error);
        throw new Error('Erro ao recuperar o nome da moeda pelo seu id');
    }
}

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
        console.error('Erro ao registrar usuario temporario no banco de dados', error);
        throw new Error("Erro ao registrar usuario temporario no banco de dados");
    }
};

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
        console.error('Erro ao registrar usuario definitivo ou criar a moeda padrao no banco de dados', error);
        throw new Error('Erro ao registrar usuario definitivo ou criar a moeda padrao no banco de dados');
    }
    
};

const findUserByEmail = async(email) =>{
    try{
        const stagedUser =  await prisma.stagedUsers.findUnique({
            where:{
                email: email
            }
        });

        return stagedUser;        
    }catch(error){
        console.error('Erro ao buscar usuario pelo email: ', error);
        throw new Error('Erro ao buscar usuario pelo email');
    }
}

const verifyCode = async(userId, code) =>{
    try{
        const user = await prisma.stagedUsers.findUnique({where:{id: userId}});

        if(!user || user.verificationCode !== code) return false;

        const now = new Date();

        if(user.expiresAt < now) return false;

        return true;
    }catch(error){
        console.error('Erro ao verificar codigo');
        throw new Error('Erro ao verificar codigo');
    }
}

const loginByEmailAndPassword = async(email, password) =>{

    try{
        const user = await prisma.users.findUnique({
            where:{
                email: email
            }
        });

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if(!isPasswordValid){
            return false; //Senha invalida
        }

        return user;

    }catch(error){
        console.error('Erro ao fazer login', error);
        throw new Error('Erro ao fazer login');
    }
}



module.exports = {
    getNameEmailAndCurrencyByUserId,
    getDefaultCurrencyByCurrencyId,
    createStagedUser,
    createUser,
    findUserByEmail,
    verifyCode,
    loginByEmailAndPassword
};
