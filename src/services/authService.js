const jwt = require('jsonwebtoken');

//Gerar o token JWT
const generateToken = (user) =>{
    const payLoad ={
        id: user.id,
        name: user.name,
        email: user.email,
    }
    return jwt.sign(payLoad, process.env.JWT_SECRET, {expiresIn: '1h'});
}

//Verificar o token JWT
const verifyToken = (token) =>{
    try{
        return jwt.verify(token, process.env.JWT_SECRET); //Verifica o token usando a mesma chave secreta. Se for valido, retorna os dados DECODIFICADOS DO TOKEN
    }catch (error){
        console.error('Erro ao verificar token.', error);
        return null;
    }
}


module.exports = {generateToken, verifyToken}