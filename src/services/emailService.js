//Serviço responsavel por enviar e-mails de confirmação. Utiliza a configuração de e-mail
//definida em emailConfig.js

const nodemailer = require("nodemailer");
const AppError = require("../utils/AppError");
const { errorMonitor } = require("nodemailer/lib/xoauth2");

//Funcao para enviar codigo de confirmacao ao usuario
const sendConfirmationCodeToEmailService = async(to, code) =>{
    

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });
        
    const mailOptions = {
        from: process.env.EMAIL_FROM, //Remetente
        to: to, //Destinatariao
        subject: "Codigo de confirmação para cadastro Ofinance:",
        text: "Ola! Seu codigo de confirmação é: " + code + " Ele é válido por 10 minutos.",
    };

    try{
        const info = await transporter.sendMail(mailOptions);
        return info
    }catch(err){
        throw new AppError('Erro ao enviar email: ' + err.message, 400, 'EMAIL_ERROR')
    }
    
}

module.exports ={
    sendConfirmationCodeToEmailService,
}


