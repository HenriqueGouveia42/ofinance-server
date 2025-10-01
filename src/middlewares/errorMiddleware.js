const AppError = require('../utils/AppError');

const errorMiddleware = (error, req, res, next) => {
    //Log do erro no console do servidor para depuração
    console.error(error); 

    //Se o erro for uma instância de AppError, é um erro conhecido e controlado
    if (error instanceof AppError) {
        return res.status(error.statusCode).json({
            status: 'error',
            message: error.message,
            code: error.code //Opcional, mas útil
        });
    }

    //Se for um erro inesperado (não AppError), retorna um erro genérico 500
    return res.status(500).json({
        status: 'error',
        message: 'Erro interno do servidor.'
    });
};

module.exports = errorMiddleware;