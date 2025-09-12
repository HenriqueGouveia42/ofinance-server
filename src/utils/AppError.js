class AppError extends Error {

  constructor(message, statusCode = 400, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isAppError = true;
  }

}

module.exports = AppError;
