const usuarios = require('../models/usuarios');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/sendEmail'); // Importação correta
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

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
    const { code, state, redirect_uri } = req.body;
    
    console.log('🔵 Google callback recebido:', { code: code?.substring(0, 20) + '...', state });
    
    if (!code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Código de autorização não encontrado' 
      });
    }

    if (!redirect_uri) {
      return res.status(400).json({ 
        success: false, 
        message: 'redirect_uri é obrigatório' 
      });
    }
    
    // Trocar código por token - usa o redirect_uri fornecido pelo cliente
    const { tokens } = await client.getToken({
      code: code,
      redirect_uri: redirect_uri // Flexível - vem do frontend
    });
    
    // Verificar o token ID
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    console.log('🔵 Dados do Google:', payload);
    
    // Verificar se usuário já existe
    let usuario = await usuarios.findOne({ 
      $or: [
        { email: payload.email },
        { google_id: payload.sub },
        { googleId: payload.sub }
      ]
    });
    
    if (!usuario) {
      // Criar novo usuário
      usuario = new usuarios({
        nome_completo: payload.name,
        username: payload.email,
        email: payload.email,
        password: await bcrypt.hash('google_oauth_' + payload.sub, 10), // Senha segura para OAuth
        tel: '', // Vazio por enquanto
        google_id: payload.sub,
        googleId: payload.sub, // compatibilidade
        avatar_url: payload.picture,
        foto: payload.picture,
        verificado: true // Google já verificou o email
      });
      
      await usuario.save();
      console.log('🔵 Novo usuário criado via Google:', usuario.email);
    } else {
      // Atualizar dados se necessário
      if (!usuario.google_id) {
        usuario.google_id = payload.sub;
        usuario.googleId = payload.sub;
        usuario.verificado = true;
        await usuario.save();
      }
      console.log('🔵 Usuário existente logado via Google:', usuario.email);
    }
    
    // Gerar JWT token
    const jwtToken = jwt.sign(
      {
        id: usuario._id,
        userId: usuario._id,
        username: usuario.username,
        email: usuario.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      message: 'Login Google realizado com sucesso',
      token: jwtToken,
      usuario: {
        id: usuario._id,
        nome_completo: usuario.nome_completo,
        username: usuario.username,
        email: usuario.email,
        avatar_url: usuario.avatar_url || usuario.foto
      }
    });
    
  } catch (error) {
    console.error('❌ Erro no Google OAuth:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno no servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro de autenticação'
    });
  }
};

module.exports = { iniciarCadastro, verificarCodigo, googleCallback };