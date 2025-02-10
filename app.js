const express = require('express');
const cookieParser  = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');

const signUpRoutes = require('./src/routes/signUpRoutes');
const loginRoutes = require('./src/routes/loginRoutes');
const transactionRoutes = require('./src/routes/transactionsRoutes');
const accountsRoutes = require('./src/routes/accountsRoutes')
const userRoutes = require('./src/routes/userRoutes');
const authMiddleware = require('./src/middlewares/authMiddleware');

dotenv.config(); // Carrega as variáveis do .env

const app = express();

app.use(express.json()); //Middleware para permitir JSON no corpo da requisição

app.use(cookieParser()); //Middleware para permitir o uso de cookies

app.use(cors()); // Habilita CORS para permitir requisições de outras origens

app.use('/auth/signup', signUpRoutes); //Registro de usuarios
app.use('/auth/login', loginRoutes); // Login
app.use('/user', authMiddleware, userRoutes);
app.use('/transaction', authMiddleware, transactionRoutes);
app.use('/accounts', authMiddleware, accountsRoutes);

const PORT = process.env.PORT || 5000; // Iniciar o servidor
app.listen(PORT, () => {
    console.log('Servidor rodando na porta: ' + PORT);
});