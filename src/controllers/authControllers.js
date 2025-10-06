const {
    signUpService,
    verifyCodeService,
    loginService,
    checkAuthStatusService,
    logoutService
} = require('../services/authService');

const AppError = require('../utils/AppError');

const signUpController = async (req, res) => {
    try {
        
        const { email, name, password } = req.body

        await signUpService(email, name, password)

        res.status(201).json({ message: "Usuário cadastrado com sucesso. Verifique o código de confirmação enviado por e-mail!" });

    } catch (error) {

        console.error('Erro ao registrar usuario', error);

        if (error instanceof AppError){
            return res.status(error.statusCode).json({message: error.message})
        }

        res.status(500).json({ message: 'Erro interno ao cadastrar usuario.' });
    }
};

const verifyCodeController = async(req, res) =>{
    try{

        const {email, code} = req.body;

        const verifiedCode = await verifyCodeService(email, code)

        return res.status(201).json({message: "Codigo verificado com sucesso! Usuario Cadastrado na tabela de usuarios definitivos!"});

    }catch(error){

        console.error(error);

        if (error instanceof AppError){
            return res.status(error.statusCode).json({message: error.message})
        }

        res.status(500).json({message: "Erro interno ao verificar codigo"});
    }
}

const loginController = async(req, res) =>{
    try{

        const {email, password} = req.body;

        const {user, token} = await loginService(email, password)

        const isProduction = process.env.NODE_ENV === 'production';

        //Configura o cookie HttpOnly com o token
        res.cookie("access_token", token, {
            httpOnly: true,
            //secure: isProduction,
            secure: isProduction ? true : false,
            sameSite: isProduction ? 'strict' : 'lax', //Mais flexivel em desenvolvimento
            maxAge: 1000 * 60 * 60 * 3 //Expira em 03 horas
        });

        
        return res.status(200).json({message: "Logado com sucesso!"});
    
    }catch(error){
        console.error(error);

        if (error instanceof AppError){
            return res.status(error.statusCode).json({message: error.message})
        }

        res.status(500).json({message: "Erro interno ao logar"});
    }

}

const checkAuthStatusController = async(req, res) =>{
    try{
       
        const isLoggedIn = await checkAuthStatusService(req)
        
        return res.status(200).json({
            message: "Usuario autenticado!"
        });

    }catch(error){
        console.error("Erro ao verificar se o usuario está autenticado", error);

        if (error instanceof AppError){
            return res.status(error.statusCode).json({message: error.message})
        }
        return res.status(404).json({message: "Erro interno ao verificar se o usuario está autenticado."});
    }
}

const logoutController = async(req, res) =>{
    try{

        const {cookieName, cookieOptions, message} = logoutService()

        //remove o cookie de autenticação
        res.clearCookie(cookieName, cookieOptions);

        return res.status(200).json({message})
    }catch(error){

        console.error("Erro no logout", error);

        if (error instanceof AppError){
            return res.status(error.statusCode).json({message: error.message})
        }

        return res.status(500).json({message: "Erro interno ao fazer logout"})
    }
}

module.exports ={
    signUpController,
    verifyCodeController,
    loginController,
    checkAuthStatusController,
    logoutController
}