const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const AppError = require('../utils/AppError');
const {createStagedUserService} = require('./userService');
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

    const newStagedUser = await createStagedUserService({
        name: name,
        email: email,
        password: hashedPassword,
        createdAt: createdAt,
        expiresAt: expiresAt,
        verificationCode: verificationCode
    });

    if (!newStagedUser){
        throw new Error('Erro ao cadastrar novo usuario na tabela de usuarios temporarios', 400, 'AUTH_ERROR')
    }

    const confirmationCodeSent = await sendConfirmationCodeToEmailService(
        newStagedUser.email,
        newStagedUser.verificationCode
    )

    if (!confirmationCodeSent){
        throw new Error('Erro ao enviar o codigo de confirmação para o email', 400, 'AUTH_ERROR')
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

module.exports = {signUpService, generateToken}