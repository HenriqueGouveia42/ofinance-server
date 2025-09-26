const bcrypt = require('bcryptjs');
const {prisma} = require('../config/prismaClient');
const AppError = require('../utils/AppError');

const {getAccountsByUserIdService} = require('./accountsServices');
const {getCategoriesByUserId} = require('./categoryService')


const getNameAndEmailByUserId = async(userId) =>{
    try{
    
        const _getNameAndEmail = await prisma.users.findUnique({
            select:{
                name: true,
                email: true,
            },
            where:{
                id: userId
            }
        })

        return _getNameAndEmail;
    }catch(error){
        console.error("Erro ao buscar nome e email do usuario", error);
        throw new Error('Erro ao buscar nome e email do usuario');
    }
}

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

const createStagedUserService = async ({ name, email, password, createdAt, expiresAt, verificationCode }) => {
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

const createUserService = async ({ email, name, password, createdAt }) => {
    try {
        const result = await prisma.$transaction(async (prisma)=>{
            
            const user = await prisma.users.create({
                data:{
                    email,
                    name,
                    password,
                    createdAt
                },
            });

            return {user};
        })
        return result;
    } catch (error) {
        console.error('Erro ao registrar usuario definitivo ou criar a moeda padrao no banco de dados', error);
        throw new Error('Erro ao registrar usuario definitivo ou criar a moeda padrao no banco de dados');
    }
    
};

const findStagedUserByEmailService = async(email) =>{
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

const verifyStagedUserCodeService = async(code, email) =>{
    try{

        const stagedUser = await prisma.stagedUsers.findFirst({
            where:{
                verificationCode: code,
                email: email
            }
        })

        const now = new Date();

        if (stagedUser.expiresAt <= now){ //expired stagedUser
            const deleteStagedUser = await prisma.stagedUsers.delete({
                where:{
                    email: email
                }
            })
            return false;
        }

        return stagedUser &&  stagedUser.expiresAt > now;

    }catch(error){
        console.error('Erro ao verificar codigo', error);
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

const deleteStagedUserService = async(email) =>{
    try{
        deleteStU = await prisma.stagedUsers.delete({
            where:{
                email: email
            }
        });
        return deleteStU;
    }
    catch(error){
        console.error('Erro ao deletar usuario temporario', error);
        throw new Error('Erro ao deletar usuario temporario');
    }
}

const getUserDataService = async (userId) => {

    //objeto que será retornado
    const userData = {
        name: null,
        email: null,
        accounts: null,
        categories: null
    };

    const nameAndEmail = await getNameAndEmailByUserId(userId);

    if(!nameAndEmail){
        throw new AppError('Erro ao buscar nome e email do usuario', 404, 'USER_ERROR')
    }

    const accounts = await getAccountsByUserIdService(userId);

    if (!accounts){
        throw new AppError('Erro ao buscar contas do usuario', 404, 'USER_ERROR')
    }

    const categories = await getCategoriesByUserId(userId);

    if (!categories){
        throw new AppError('Erro ao buscar categorias do usuario', 404, 'USER_ERROR')
    }

    userData.name = nameAndEmail.name;
    userData.email = nameAndEmail.email;
    userData.accounts = accounts;
    userData.categories = categories;

    return userData

}

module.exports = {
    getNameAndEmailByUserId,
    getDefaultCurrencyByCurrencyId,
    createStagedUserService,
    createUserService,
    findStagedUserByEmailService,
    verifyStagedUserCodeService,
    loginByEmailAndPassword,
    deleteStagedUserService,
    getUserDataService
};
