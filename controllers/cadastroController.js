// Controlador de cadastro com verificação de código por email
const Usuario = require('../models/usuarios');
const sendEmail = require('../utils/sendEmail');

// Armazenamento temporário dos códigos (em produção, use Redis ou banco)
const codigosPendentes = {};

// 1. Inicia cadastro: gera código, envia email e armazena temporariamente
async function iniciarCadastro(req, res) {
  const { nome_completo, username, password, tel, email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email é obrigatório.' });

  // Verifica se o email já existe
  try {
    const usuarioExistente = await Usuario.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({ error: 'Este email já está cadastrado.' });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao verificar email.' });
  }

  // Gere código de 6 dígitos
  const codigo = Math.floor(100000 + Math.random() * 900000).toString();
  codigosPendentes[email] = { 
    codigo, 
    dados: { nome_completo, username, password, tel, email },
    timestamp: Date.now() // para expiração
  };

  try {
    await sendEmail(email, codigo);
    res.json({ message: 'Código enviado por email.' });
  } catch (err) {
    console.error('Erro ao enviar email:', err);
    res.status(500).json({ error: 'Erro ao enviar email.' });
  }
}

// 2. Verifica código e finaliza cadastro
async function verificarCodigo(req, res) {
  const { email, codigo } = req.body;
  const pendente = codigosPendentes[email];
  
  if (!pendente || pendente.codigo !== codigo) {
    return res.status(400).json({ error: 'Código inválido.' });
  }

  // Verifica se o código não expirou (10 minutos)
  const agora = Date.now();
  const tempoExpiracao = 10 * 60 * 1000; // 10 minutos em millisegundos
  if (agora - pendente.timestamp > tempoExpiracao) {
    delete codigosPendentes[email];
    return res.status(400).json({ error: 'Código expirado.' });
  }

  // Cria usuário
  try {
    const usuario = await Usuario.create(pendente.dados);
    delete codigosPendentes[email];
    res.status(201).json({ message: 'Usuário cadastrado com sucesso!', usuario });
  } catch (err) {
    console.error('Erro ao cadastrar usuário:', err);
    res.status(500).json({ error: 'Erro ao cadastrar usuário.' });
  }
}

module.exports = { iniciarCadastro, verificarCodigo };
