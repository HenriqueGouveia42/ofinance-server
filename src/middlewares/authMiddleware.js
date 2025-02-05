const jwt = require("jsonwebtoken");

// O authMiddleware verifica se o token JWT armazenado no cookie é válido antes de permitir o acesso à rota protegida.
// Funciona como uma "ponte" entre o client e o server.
// Exemplo de fluxo: /localhost:5000/transaction -> authMiddleware -> transactionRoutes

const authMiddleware = (req, res, next) =>{
    
    const token = req.cookies.access_token;

    if(!token){
        return res.status(401).json({message: "Acesso negado. Token não fornecido"});
    }

    const validToken = jwt.verify(token, process.env.JWT_SECRET);
    
    if(!validToken){
        return res.status(401).json({message: "Token invalido ou expirado"});
    }

    req.user = validToken; //Anexa os dados do usuario ao objeto de requisição
    
    //Chama o proximo middleware ou controller na cadeia de execucao
    next(); 
}


module.exports = authMiddleware;