//Controlador responsável pelas operações de autenticação, como cadastro de usuário (sign-up) e verificacao de codigo

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');  // Adicione essa linha para importar o JWT


const {createStagedUserService, createUserService, findStagedUserByEmailService, verifyStagedUserCodeService, loginByEmailAndPassword, deleteStagedUserService} = require('../services/userService');
const {sendConfirmationCodeToEmailService} = require('../services/emailService');
const {generateToken, verifyToken} = require('../services/authService');

const generateVerificationCode = () =>{
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const signUpController = async (req, res) => {
    try {
        
        const { email, name, password } = req.body;

        if (typeof email != 'string' || typeof name != 'string' || typeof password != 'string') {
            return res.status(400).json({ message: 'Algum campo ausente ou não é string' });
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

        await sendConfirmationCodeToEmailService(newStagedUser.email, newStagedUser.verificationCode);

        res.status(201).json({ message: "Usuário cadastrado com sucesso. Verifique o código de confirmação enviado por e-mail!" });

    } catch (error) {
        console.error('Erro ao registrar usuario', error);
        res.status(500).json({ message: 'Erro ao cadastrar usuario.' });
    }
};

const verifyCodeController = async(req, res) =>{
    try{
        const {email, code} = req.body;

        if(typeof code != 'string' || typeof email != 'string'){
            return res.status(404).json({message: "Email ou codigo vazios ou invalidos"});
        }
        
        const stagedUser = await findStagedUserByEmailService(email);

        if (!stagedUser){
            return res.status(404).json({message: "Email do Usuario nao encontrado"});
        }

        const isCodeValid = await verifyStagedUserCodeService(code, email);

        if(!isCodeValid){
            return res.status(404).json({message: "Codigo invalido ao expirado"});
        }

        const newUser = await createUserService({
            email: stagedUser.email,
            name: stagedUser.name,
            password: stagedUser.password,
            createdAt: stagedUser.createdAt
        })

        if (newUser.error){
            return res.status(404).json({message: "Erro ao cadastrar na tabela de usuarios definitivos"});
        }

        const deleteStagedUser = await deleteStagedUserService(email);

        if(!deleteStagedUser){
            return res.status(404).json({message: "Erro ao deletar usuario temporario"});
        }

        return res.status(201).json({message: "Codigo verificado com sucesso! Usuario Cadastrado na tabela de usuarios definitivos!"});

    }catch(error){

        console.error(error);

        res.status(500).json({message: "Erro ao verificar codigo"});
    }
}

const loginController = async(req, res) =>{
    try{
        const {email, password} = req.body;

        if(typeof email != 'string' || typeof password != 'string'){
            return res.status(404).json({message: 'Algum campo está ausente ou é inválido'});
        }

        const user = await loginByEmailAndPassword(email, password);

        if(!user){
            return res.status(401).json({message: "Credenciais invalidas!"}) //401 - unauthorized
        }

        const token = generateToken(user);

        const isProduction = process.env.NODE_ENV === 'production';

        //Configura o cookie HttpOnly com o token
        res.cookie("access_token", token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'strict' : 'lax', //Mais flexivel em desenvolvimento
            maxAge: 60 * 60 * 300 //Expira em 03 horas
        });

        return res.status(200).json({message: "Logado com sucesso!"});
    
    }catch(error){
        console.error(error);
        res.status(500).json({message: "Erro interno ao servidor"});
    }

}

const checkAuthStatusController = async(req, res) =>{
    try{
        const token = req.cookies.access_token; //Acessa o token do cookie
        if (!token){
            return res.status(401).json({message:"Usuario nao autenticado"});
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET); //verifica o token

        return res.status(200).json({
            message: "Usuario autenticado!"
        });

    }catch(error){
        console.error("Erro ao verificar se o usuario está autenticado", error);
        return res.status(404).json({message: "Erro ao verificar se o usuario está autenticado. Token invalido ou expirado"});
    }
}

const logoutController = async(req, res) =>{
    try{
        res.cookie('access_token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'development',
            sameSite: 'Strict',
            expires: new Date(0) //Define a data de expiração no passado
        });
        res.json({message: "Token JWT enviado via cookie http-only com expiração no passado com sucesso"})
    }catch(error){
        console.error("Erro ao enviar token JWT via cookie http only com expiração no passado", error);
        throw new Error('Erro ao enviar token JWT via cookie http only com expiração no passado');
    }
}

module.exports ={
    signUpController,
    verifyCodeController,
    loginController,
    checkAuthStatusController,
    logoutController
}