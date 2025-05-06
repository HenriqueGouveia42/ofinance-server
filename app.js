const express = require('express');
const cookieParser  = require('cookie-parser');
const cors = require('cors');

const dotenv = require('dotenv');
dotenv.config(); // Carrega as variáveis do .env

const signUpRoutes = require('./src/routes/signUpRoutes');
const loginRoutes = require('./src/routes/loginRoutes');
const logoutRoutes = require('./src/routes/logoutRoutes');
const transactionRoutes = require('./src/routes/transactionsRoutes');
const accountsRoutes = require('./src/routes/accountsRoutes');
const categoriesRoutes = require('./src/routes/categoriesRoutes');
const userRoutes = require('./src/routes/userRoutes.js');

const authMiddleware = require('./src/middlewares/authMiddleware');

const app = express();

app.use(express.json()); //Middleware para permitir JSON no corpo da requisição

app.use(cookieParser()); //Middleware para permitir o uso de cookies

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true, // Permite o envio de cookies
})); // Habilita CORS para permitir requisições de outras origens

app.use('/auth/signup', signUpRoutes);
app.use('/auth/login', loginRoutes);
app.use('/auth/logout', logoutRoutes);
app.use('/user', authMiddleware, userRoutes);
app.use('/transaction', authMiddleware, transactionRoutes);
app.use('/accounts', authMiddleware, accountsRoutes);
app.use('/category', authMiddleware, categoriesRoutes);

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log('Servidor rodando na porta: ' + PORT);
});