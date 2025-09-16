const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const AppError = require('../utils/AppError');
const {createUserService, createStagedUserService, findStagedUserByEmailService, verifyStagedUserCodeService, deleteStagedUserService, loginByEmailAndPassword} = require('./userService');
const {sendConfirmationCodeToEmailService} = require('./emailService');



const generateVerificationCode = () =>{
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const signUpService = async (email, name, password) =>{

    if (typeof email != 'string' || typeof name != 'string' || typeof password != 'string') {
        throw new AppError('Algum campo ausente ou não é string', 400, 'SIGN_UP_ERROR')
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = generateVerificationCode();
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + 1000 * 60 * 10);

    const stagedUser = await createStagedUserService({
        name: name,
        email: email,
        password: hashedPassword,
        createdAt: createdAt,
        expiresAt: expiresAt,
        verificationCode: verificationCode
    });

    if (!stagedUser){
        throw new AppError('Erro ao cadastrar novo usuario na tabela de usuarios temporarios', 400, 'AUTH_ERROR')
    }

    try{

        const confirmationCodeSent = await sendConfirmationCodeToEmailService(
            stagedUser.email,
            stagedUser.verificationCode
        )

        if (!confirmationCodeSent){
            throw new AppError('Erro ao enviar o codigo de confirmação para o email', 400, 'AUTH_ERROR')
        }

        return stagedUser

    }catch(err){
        //rollback
        await deleteStagedUserService(email);

        // repropaga o erro original (se já era AppError mantém, se não, envelopa)
        if (err instanceof AppError) throw err;
        throw new AppError('Erro ao enviar o codigo de confirmação para o email', 400, 'AUTH_ERROR');
    
    }

    

}

const verifyCodeService = async (email, code) =>{

    if(typeof code != 'string' || typeof email != 'string'){
        throw new AppError('Email ou codigo vazios ou invalidos', 400, 'AUTH_ERROR')
    }

    const stagedUser = await findStagedUserByEmailService(email)

    if (!stagedUser){
        throw new AppError('Erro ao encontrar usuario temporario pelo email', 400, 'AUTH_ERROR')
    }

    const isCodeValid = await verifyStagedUserCodeService(code, email);

    if(!isCodeValid){
        throw new Error('Codigo invalido ou expirado', 400, 'AUTH_ERROR')
    }

    const newUser = await createUserService({
        email: stagedUser.email,
        name: stagedUser.name,
        password: stagedUser.password,
        createdAt: stagedUser.createdAt
    })

    if (!newUser){
        throw new AppError('Erro ao cadastrar na tabela de usuarios definitivos', 400, 'AUTH_ERROR')
    }

    const deleteStagedUser = await deleteStagedUserService(email);

    if(!deleteStagedUser){
        throw new AppError('Erro ao deletar usuario temporario', 404, 'AUTH_ERROR')
    }


}

//Gerar o token JWT
const generateToken = (user) =>{

    const payLoad ={
        id: user.id,
        defaultCurrencyId: user.defaultCurrencyId
    }

    return jwt.sign(payLoad, process.env.JWT_SECRET,{
        expiresIn: "3h",
        }
    );
}

const loginService = async(email, password) =>{

    if(typeof email != 'string' || typeof password != 'string'){
        throw new AppError('Algum campo está ausente ou é inválido', 404, 'AUTH_ERROR')
    }

    const user = await loginByEmailAndPassword(email, password)

    if(!user){
        throw new AppError('Credenciais invalidas', 401, 'AUTH_ERROR')
    }

    const token = generateToken(user)

    return {user, token}

}

const logoutService = async() =>{

    try{

        return {
        cookieName: 'access_token',
        cookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(0)
        },
        message: "Logout realizado com sucesso"

    }

    }catch(error){
        console.error("Erro ao preparar logou: ", error)
        
        throw new AppError('Erro ao preparar logout', 400, 'AUTH_ERROR')
    }

}

const checkAuthStatusService = async(req) =>{

    const token = req.cookies.access_token; //Acessa o token do cookie

    if (!token){
        throw new AppError('Usuario nao autenticado', 401, 'AUTH_ERROR')
    }

    const isTokenValid = jwt.verify(token, process.env.JWT_SECRET, (err, decoded) =>{
        if (err){
            throw new AppError('Token expirado', 401, 'AUTH_ERROR')              
        }else{
            return decoded
        }
    }); //verifica o token
    
}




module.exports = {
    signUpService,
    verifyCodeService,
    generateToken,
    loginService,
    checkAuthStatusService,
    logoutService
}