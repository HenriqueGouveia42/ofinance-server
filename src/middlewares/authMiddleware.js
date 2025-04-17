const jwt = require("jsonwebtoken");

// O authMiddleware verifica se o token JWT enviado via cookie é valido
// localhost:5000/transaction -> authMiddleware -> transactionRoutes

const authMiddleware = (req, res, next) =>{
    
    const token = req.cookies.access_token;

    if(!token){
        return res.status(401).json({message: "Acesso negado. Token não fornecido"});
    }

    const validToken = jwt.verify(token, process.env.JWT_SECRET);
    
    if(!validToken){
        return res.status(403).json({message: "Token invalido ou expirado"});
    }

    req.user = validToken; //Anexa os dados do usuario ao objeto de requisição
    
    //Chama o proximo middleware ou controller na cadeia de execucao
    next(); 
}


module.exports = authMiddleware;