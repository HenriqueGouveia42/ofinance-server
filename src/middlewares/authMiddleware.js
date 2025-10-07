const jwt = require("jsonwebtoken");
const { errorMonitor } = require("nodemailer/lib/xoauth2");

// O authMiddleware verifica se o token JWT enviado via cookie é valido
// localhost:5000/transaction -> authMiddleware -> transactionRoutes

const authMiddleware = (req, res, next) =>{
    
    const token = req.cookies.access_token;

    //console.log("Token que chegou no authMiddleware: " + token)

    if(!token || token.trim() === ''){
        return res.status(401).json({message: "Acesso negado. Token não fornecido"});
    }

    try{
        const validToken = jwt.verify(token, process.env.JWT_SECRET);
        req.user = validToken; //Anexa os dados do usuario ao objeto de requisição
        next(); 
    }catch(err){
        console.error("Erro na verificação do token JWT: ", err.message)
        return res.status(403).json({message: "Token inválido ou expirado"})
    }
 
    //Chama o proximo middleware ou controller na cadeia de execucao
}


module.exports = authMiddleware;