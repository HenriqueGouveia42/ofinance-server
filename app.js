const express = require('express');
const cookieParser  = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');

const signUpRoutes = require('./src/routes/signUpRoutes');
const loginRoutes = require('./src/routes/loginRoutes');
const transactionRoutes = require('./src/routes/transactionsRoutes');
const authMiddleware = require('./src/middlewares/authMiddleware');
const createItemsRoutes = require('./src/routes/createItemsRoutes');




dotenv.config(); // Carrega as variáveis do .env

const app = express();
//Middleware para permitir JSON no corpo da requisição
app.use(express.json());

//Middleware para permitir o uso de cookies
app.use(cookieParser());

// Habilita CORS para permitir requisições de outras origens
app.use(cors()); 

// Rotas
app.use('/signup', signUpRoutes);
app.use('/login', loginRoutes);
app.use('/transaction', authMiddleware, transactionRoutes); //Client -> POST(/transaction/create) -> authMiddleware -> transactionController -> Banco de dados/servicos externos -> response(JSON) -> Client
app.use('/create', authMiddleware, createItemsRoutes);

// Iniciar o servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log('Servidor rodando na porta: ' + PORT);
});