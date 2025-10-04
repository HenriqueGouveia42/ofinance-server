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

const createStagedUserService = async ({ name, email, password, createdAt, expiresAt, verificationCode }) => {
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
};

const createUserService = async ({ email, name, password, createdAt }) => {
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
};

const findStagedUserByEmailService = async(email) =>{

    const stagedUser =  await prisma.stagedUsers.findUnique({
        where:{
            email: email
        }
    });

    if (!stagedUser){
        throw new AppError('Erro ao buscar usuario temporario pelo email', 404, 'USER_ERROR')
    }

    return stagedUser;        
}

const verifyStagedUserCodeService = async(code, email) =>{

    const stagedUser = await prisma.stagedUsers.findFirst({
        where:{
            verificationCode: code,
            email: email
        }
    })

    if (!stagedUser){
        throw new AppError("Erro ao buscar usuario temporario", 404, "USER_ERROR")
    }

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

}

const loginByEmailAndPassword = async(email, password) =>{

    const user = await prisma.users.findUnique({
        where:{
            email: email
        }
    });

    if (!user){
        throw new AppError("Usuario com este email nao encontrado", 400, "USER_ERROR")
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if(!isPasswordValid){
        return false;
    }

    return user;

}

const deleteStagedUserService = async(email) =>{

    try{

        deleteStU = await prisma.stagedUsers.delete({
            where:{
                email: email
            }
        });

        return deleteStU;


    }catch(error){
        console.log("Erro: ", error)
        throw new AppError('Erro ao deletar usuario temporario', 400, "USER_ERROR")
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
    createStagedUserService,
    createUserService,
    findStagedUserByEmailService,
    verifyStagedUserCodeService,
    loginByEmailAndPassword,
    deleteStagedUserService,
    getUserDataService
};
