const jwt = require('jsonwebtoken');

//Gerar o token JWT
const generateToken = (user) =>{
    const payLoad ={
        id: user.id,
        name: user.name,
        email: user.email,
        defaultCurrencyId: user.defaultCurrencyId
    }
    return jwt.sign(payLoad, process.env.JWT_SECRET, {expiresIn: '1h'});
}

module.exports = {generateToken}