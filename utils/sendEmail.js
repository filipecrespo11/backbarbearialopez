const nodemailer = require('nodemailer');

// Verificar se as configurações de email estão disponíveis
const emailConfigured = process.env.EMAIL_USER && 
                        process.env.EMAIL_PASS && 
                        process.env.EMAIL_USER !== 'seu_email@gmail.com' &&
                        process.env.EMAIL_PASS !== 'sua_senha_de_app';

let transporter = null;

if (emailConfigured) {
  // Configuração do transportador de email
  transporter = nodemailer.createTransport({
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
}

async function sendEmail(to, subject, html) {
  // Se email não está configurado ou está em desenvolvimento, simular
  if (!emailConfigured || process.env.NODE_ENV === 'development') {
    console.log('📧 Email simulado (configuração não disponível):');
    console.log('Para:', to);
    console.log('Assunto:', subject);
    console.log('Conteúdo:', html);
    
    // Retornar sucesso simulado
    return { 
      success: true, 
      message: 'Email simulado - Configure EMAIL_USER e EMAIL_PASS no .env para envio real' 
    };
  }

  // Para produção ou quando email está configurado
  try {
    const info = await transporter.sendMail({
      from: `"Barbearia Lopez" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    
    console.log('✅ Email enviado com sucesso:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error.message);
    
    // Mensagem específica para erro de autenticação do Gmail
    if (error.message.includes('Username and Password not accepted')) {
      console.error('⚠️  CONFIGURAÇÃO NECESSÁRIA:');
      console.error('   1. Ative a verificação em 2 etapas no Gmail');
      console.error('   2. Gere uma senha de app em: https://myaccount.google.com/apppasswords');
      console.error('   3. Use a senha de app (não sua senha normal) na variável EMAIL_PASS');
      return { 
        success: false, 
        error: 'Erro de autenticação Gmail. Configure senha de app.' 
      };
    }
    
    return { success: false, error: error.message };
  }
}

// Exportação correta
module.exports = { sendEmail };