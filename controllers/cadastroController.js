const usuarios = require('../models/usuarios');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/sendEmail'); // Importação correta

// Função para gerar código de verificação
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Armazenar códigos temporariamente (em produção, use Redis ou banco de dados)
const verificationCodes = new Map();

const iniciarCadastro = async (req, res) => {
  try {
    const { nome_completo, username, password, tel, email } = req.body;

    // Verificar se o usuário já existe
    const existingUser = await usuarios.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Usuário já existe com este email' });
    }

    // Gerar código de verificação
    const verificationCode = generateVerificationCode();
    
    // Armazenar código temporariamente (expira em 10 minutos)
    verificationCodes.set(email, {
      code: verificationCode,
      userData: { nome_completo, username, password, tel, email },
      expires: Date.now() + 10 * 60 * 1000 // 10 minutos
    });

    // Se estiver em desenvolvimento, retornar o código diretamente
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔐 Código de verificação para ${email}: ${verificationCode}`);
      return res.status(200).json({
        message: 'Código de verificação gerado',
        codigo_dev: verificationCode, // Apenas em desenvolvimento
        email
      });
    }

    // Tentar enviar email
    try {
      const emailResult = await sendEmail(
        email,
        'Código de Verificação - Barbearia Lopez',
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">Bem-vindo à Barbearia Lopez!</h2>
          <p>Olá, <strong>${nome_completo}</strong>!</p>
          <p>Seu código de verificação é:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #1f2937; letter-spacing: 4px;">${verificationCode}</span>
          </div>
          <p>Este código expira em 10 minutos.</p>
          <p>Se você não solicitou este cadastro, ignore este email.</p>
          <br>
          <p>Atenciosamente,<br><strong>Equipe Barbearia Lopez</strong></p>
        </div>
        `
      );

      if (emailResult.success) {
        res.status(200).json({
          message: 'Código de verificação enviado por email',
          email
        });
      } else {
        throw new Error('Falha ao enviar email');
      }
    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError);
      
      // Em caso de erro no email, sempre retornar código para desenvolvimento/fallback
      console.log(`🔐 Código de verificação para ${email}: ${verificationCode}`);
      
      // Verificar se é erro de autenticação do Gmail
      if (emailError.code === 'EAUTH') {
        console.log('⚠️  Erro de autenticação Gmail. Verifique as configurações de email.');
        console.log('📧 Para corrigir:');
        console.log('   1. Ative a autenticação de 2 fatores no Gmail');
        console.log('   2. Gere uma "Senha de App" em https://myaccount.google.com/apppasswords');
        console.log('   3. Use a senha de app no EMAIL_PASS');
      }
      
      res.status(200).json({ 
        message: 'Sistema funcionando em modo de desenvolvimento. Use o código mostrado no console do servidor.',
        codigo_dev: verificationCode, // Sempre retornar em caso de erro
        email,
        debug: process.env.NODE_ENV === 'development' ? 'Email desabilitado para desenvolvimento' : 'Email temporariamente indisponível'
      });
    }
  } catch (error) {
    console.error('Erro no iniciar cadastro:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

const verificarCodigo = async (req, res) => {
  try {
    const { email, codigo } = req.body;

    // Verificar se o código existe e não expirou
    const storedData = verificationCodes.get(email);
    if (!storedData) {
      return res.status(400).json({ success: false, message: 'Código não encontrado ou expirado' });
    }

    if (Date.now() > storedData.expires) {
      verificationCodes.delete(email);
      return res.status(400).json({ success: false, message: 'Código expirado' });
    }

    if (storedData.code !== codigo) {
      return res.status(400).json({ success: false, message: 'Código incorreto' });
    }

    // Código válido, criar usuário
    const { nome_completo, username, password, tel, email: userEmail } = storedData.userData;
    const hashedPassword = await bcrypt.hash(password, 10);

    const novoUsuario = new usuarios({
      nome_completo,
      username,
      password: hashedPassword,
      tel,
      email: userEmail,
      verificado: true
    });

    await novoUsuario.save();

    // Remover código usado
    verificationCodes.delete(email);

    // Gerar token JWT
    const token = jwt.sign(
      { userId: novoUsuario._id, email: novoUsuario.email },
      process.env.JWT_SECRET || 'secreto_temporario',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Usuário cadastrado com sucesso',
      token,
      user: {
        id: novoUsuario._id,
        nome: novoUsuario.nome_completo,
        email: novoUsuario.email,
        telefone: novoUsuario.tel
      }
    });
  } catch (error) {
    console.error('Erro na verificação:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

const googleCallback = async (req, res) => {
  try {
    const { code, state } = req.body;
    
    if (!code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Código de autorização não encontrado' 
      });
    }
    
    // TODO: Implementar troca do código por token do Google
    // const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    //   body: new URLSearchParams({
    //     code,
    //     client_id: process.env.GOOGLE_CLIENT_ID,
    //     client_secret: process.env.GOOGLE_CLIENT_SECRET,
    //     redirect_uri: 'http://localhost:3000/auth/google/callback',
    //     grant_type: 'authorization_code'
    //   })
    // });
    
    // TODO: Buscar dados do usuário no Google
    // const userData = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    //   headers: { Authorization: `Bearer ${accessToken}` }
    // });
    
    // TODO: Criar/atualizar usuário no banco
    // TODO: Gerar JWT token
    
    // Por enquanto, retornar erro informativo
    res.status(501).json({ 
      success: false, 
      message: 'Google OAuth ainda não está totalmente implementado. Use o cadastro tradicional por enquanto.' 
    });
  } catch (error) {
    console.error('Erro no callback do Google:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
};

module.exports = { iniciarCadastro, verificarCodigo, googleCallback };