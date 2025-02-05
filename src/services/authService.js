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

//Retorna os dados decodificados do usuario a partir do token JWT enviado pelos cookies
const getUserFromToken = (token) =>{
    try{
        decoded = jwt.verify(token, process.env.JWT_SECRET); //Verifica o token usando a mesma chave secreta. Se for valido, retorna os dados DECODIFICADOS DO TOKEN
        return decoded;
    }catch (error){
        console.error('Erro no authService ao validar o token ou retornar dados decodificados do usuario presentes no token JWT.', error);
        return null;
    }
}

module.exports = {generateToken, getUserFromToken}