const nodemailer = require('nodemailer');

// Configuração do transportador de email
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true para porta 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

async function sendEmail(to, subject, html) {
  // Verificar se está em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    console.log('📧 Email simulado em desenvolvimento:');
    console.log('Para:', to);
    console.log('Assunto:', subject);
    console.log('Conteúdo:', html);
    
    // Tentar enviar email real mesmo em desenvolvimento
    try {
      const info = await transporter.sendMail({
        from: `"Barbearia Lopez" <${process.env.EMAIL_FROM}>`,
        to,
        subject,
        html
      });
      
      console.log('✅ Email enviado com sucesso:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error.message);
      // Em desenvolvimento, continuar mesmo se falhar
      return { success: true, message: 'Email simulado (falha no envio real)' };
    }
  }

  // Para produção, tentar enviar email real
  try {
    const info = await transporter.sendMail({
      from: `"Barbearia Lopez" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html
    });
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return { success: false, error: error.message };
  }
}

// Exportação correta
module.exports = { sendEmail };