//Serviço responsavel por enviar e-mails de confirmação. Utiliza a configuração de e-mail
//definida em emailConfig.js

const nodemailer = require("nodemailer");

//Configuracao do transporte de e-mail com MailTrap
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});
//Funcao para enviar codigo de confirmacao ao usuario
const sendConfirmationEmail = async(to, code) =>{
    try{
        const mailOptions = {
            from: process.env.EMAIL_FROM, //Remetente
            to: to, //Destinatariao
            subject: "Codigo de confirmação para cadastro Ofinance:",
            text: "Ola! Seu codigo de confirmação é: " + code + " Ele é válido por 10 minutos.",
        };

        await transporter.sendMail(mailOptions);
    }catch(error){
        console.error("Erro ao enviar e-mail: ", error);
        throw new Error("Falha ao enviar o e-mail de confirmação");
    }

}

module.exports ={
    sendConfirmationEmail,
}


