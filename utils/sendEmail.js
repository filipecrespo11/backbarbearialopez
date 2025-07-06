// Utilitário para envio de email usando Nodemailer
const nodemailer = require('nodemailer');

// Configuração do transportador de email
const transporter = nodemailer.createTransport({
  service: 'gmail', // ou outro provedor
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendEmail(to, code) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: to,
    subject: 'Código de Confirmação - Barbearia Lopez',
    html: `
      <h2>Código de Confirmação</h2>
      <p>Seu código de confirmação é: <strong>${code}</strong></p>
      <p>Este código expira em 10 minutos.</p>
      <p>Se você não solicitou este código, ignore este email.</p>
    `
  };

  return transporter.sendMail(mailOptions);
}

module.exports = sendEmail;
