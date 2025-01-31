//Configuração do transporte de e-mail usando o Nodemailer. Aqui define-ne
//host
//porta
//autenticacao



const nodemailer = require("nodemailer");

const emailConfig = nodemailer.createTransport({
    host: process.env.EMAIL_HOST, //live.smtp.mailtrap.io
    port: process.env.EMAIL_PORT, //587
    secure: false, // STARTTLS na porta 587 -> secure deve ser 'false'
    auth:{
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

module.exports = emailConfig;