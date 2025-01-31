const {verifyToken} = require('../services/authService');

//A função authMiddleware é projetada para verificar a autenticidade do token, e, em seguida, permitir que a requisição
//continue para o proximo middleware ou controller.
//O middleware funciona como uma "ponte" entre o client e o server
//client - middleware - server
//nessa caso: /localhost:5000/transaction -> authMiddleware -> transactionRoutes

const authMiddleware = (req, res, next) =>{
    //req.headers.authorization obtem o valor do cabecalho 'Authorization' da requisição HTTP, através do qual o client envia o token JWT
    //.slipt('') divide a string em um array utilizando o espaco como elemento delimitador.
    //Nesse exemplo, a string sera dividida em ["Bearer", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."]
    //[1] acessa o elemento de index = 1 do array, que é justamente o token JWT
    const token = req.headers.authorization.split(' ')[1];

    if(!token){
        return res.status(401).json({message: "Acesso negado. Token não fornecido"});
    }

    const decoded = verifyToken(token);
    
    if(!decoded){
        return res.status(401).json({message: "Acesso negado. Token invalido"});
    }

    req.user = decoded; //Anexa os dados do usuario ao objeto de requisição
    
    //Chama o proximo middleware ou controller na cadeia de execucao
    next(); 
}


module.exports = authMiddleware;