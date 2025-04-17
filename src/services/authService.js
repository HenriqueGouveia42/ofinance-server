const jwt = require('jsonwebtoken');

//Gerar o token JWT
const generateToken = (user) =>{
    const payLoad ={
        id: user.id,
        defaultCurrencyId: user.defaultCurrencyId
    }
    return jwt.sign(payLoad, process.env.JWT_SECRET,{
        expiresIn: "3h",
        }
    );
}

module.exports = {generateToken}