const { ZodError } = require('zod');
const AppError = require('../utils/AppError');

const validate = (schema) => (req, res, next) => {
    
  try {

    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    
    next();

  } catch (error) {

    console.log(error)
    
    if (error instanceof ZodError){
      const errorMessages = error.issues.map((iss) =>({
        path: iss.path.join('.'),
        message: iss.message
      }))

      return res.status(400).json({message: "Erro de validação nos dados enviados.", errors: errorMessages})
    }

    //para outros erros inesperados
    next(new AppError("Erro interno no middleware de validação", 500, "VALIDATION_MIDDLEWARE_ERROR"));
  }
};

module.exports = validate;