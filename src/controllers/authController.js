//Controlador responsável pelas operações de autenticação, como cadastro de usuário (sign-up) e verificacao de codigo

const bcrypt = require('bcrypt');   


const {createStagedUser, createUser, findUserByEmail, verifyCode, loginByEmailAndPassword} = require('../services/userService');
const {sendConfirmationEmail} = require('../services/emailService');
const {generateToken, verifyToken} = require('../services/authService');

const generateVerificationCode = () =>{
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const signUpController = async (req, res) => {
    try {
        
        const { email, name, password } = req.body;

        if (!email || !name || !password) {
            return res.status(400).json({ message: 'Por favor, preencha todos os campos' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const verificationCode = generateVerificationCode();

        const createdAt = new Date();
        const expiresAt = new Date(createdAt.getTime() + 1000 * 60 * 10);

        const newStagedUser = await createStagedUser({
            name: name,
            email: email,
            password: hashedPassword,
            createdAt: createdAt,
            expiresAt: expiresAt,
            verificationCode: verificationCode
        })

        if (newStagedUser.error) {
            return res.status(400).json({ message: newStagedUser.error + "Erro ao criar um novo registro em stagedUsers" });
        }

        await sendConfirmationEmail(newStagedUser.email, newStagedUser.verificationCode);

        res.status(201).json({ message: 'Usuário cadastrado com sucesso. Verifique o código de confirmação enviado por e-mail!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao cadastrar usuario.' });
    }
};

const verifyCodeController = async(req, res) =>{
    try{
        const {email, code} = req.body;

        if(!code){
            return res.status(404).json({message: "Codigo Invalido ou Expirado!"});
        }

        if(!email){
            return res.status(404).json({message: "E-mail invalido!"});
        }
        
        const user = await findUserByEmail(email);
        if (!user){
            return res.status(404).json({message: "Email do Usuario nao encontrado"});
        }

        const isValid = await verifyCode(user.id, code);
        if(!isValid){
            return res.status(404).json({message: "Codigo invalido ao expirado"});
        }

        const newUser = await createUser({
            email: user.email,
            name: user.name,
            password: user.password,
            createdAt: user.createdAt
        })
        if (newUser.error){
            return res.status(404).json({message: "Erro ao cadastrar na tabela de usuarios definitivos"});
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

        if(!email){
            return res.status(404).json({message: "Email é obrigatorio"})
        }

        if(!password){
            return res.status(404).json({message: "Senha é obrigatoria"})
        }

        //Se o email e a senha existirem no banco de dados, retorna true
        const user = await loginByEmailAndPassword(email, password);

        if(!user){
            return res.status(401).json({message: "Credenciais invalidas!"}) //401 - unauthorized
        }else{ //Email e senha existem no banco de dados. Sucesso!
            const token = generateToken(user);
            return res.status(200).json({message: "Logado com sucesso!", token}); //Token retornado para o client
        }

    }catch(error){
        console.error(error);
        res.status(500).json({message: "Erro interno ao servidor"});
    }

}

const verifyTokenController = (req, res) =>{
    //Tenta obter o token do cabeçalho de autorização da requisição HTTP  
    //?. -> encadeamento opcional. Retorna "undefined" se req.headers.authorization nao existir, ao inves de lancar um "Error"
    const token = req.headers.authorization?.split(' ')[1];
    if(!token){
        return res.status(401).json({message: "Token nao fornecido"});
    }
    const decoded = verifyToken(token);
    if(!decoded){
        return res.status(401).json({message: "Token invalido"});
    }
    return res.status(200).json({message:"Token valido. Sucesso!"})
}

module.exports ={
    signUpController,
    verifyCodeController,
    loginController,
    verifyTokenController
}