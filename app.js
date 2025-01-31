const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const signUpRoutes = require('./src/routes/signUpRoutes');
const loginRoutes = require('./src/routes/loginRoutes');
const transactionRoutes = require('./src/routes/transactionsRoutes');
const authMiddleware = require('./src/middlewares/authMiddleware');




dotenv.config(); // Carrega as variáveis do .env

const app = express();

app.use(express.json()); // Permite que o Express lide com dados JSON
app.use(cors()); // Habilita CORS para permitir requisições de outras origens

// Rotas
app.use('/signup', signUpRoutes);
app.use('/login', loginRoutes);
app.use('/transaction', authMiddleware, transactionRoutes); //Client -> POST(/transaction/create) -> authMiddleware -> transactionController -> Banco de dados/servicos externos -> response(JSON) -> Client
//app.use('/new-account', authMiddleware, newItemsRoutes);

// Iniciar o servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log('Servidor rodando na porta: ' + PORT);
});