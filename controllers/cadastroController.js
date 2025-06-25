// Controlador de cadastro com verificação de código SMS
const Usuario = require('../models/usuarios');
const sendSms = require('../utils/sendSms'); // Você precisa criar este utilitário

// Armazenamento temporário dos códigos (em produção, use Redis ou banco)
const codigosPendentes = {};

// 1. Inicia cadastro: gera código, envia SMS e armazena temporariamente
async function iniciarCadastro(req, res) {
  const { nome_completo, username, password, tel, email } = req.body;
  if (!tel) return res.status(400).json({ error: 'Telefone é obrigatório.' });

  // Gere código de 6 dígitos
  const codigo = Math.floor(100000 + Math.random() * 900000).toString();
  codigosPendentes[tel] = { codigo, dados: { nome_completo, username, password, tel, email } };

  try {
    await sendSms(tel, codigo);
    res.json({ message: 'Código enviado por SMS.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao enviar SMS.' });
  }
}

// 2. Verifica código e finaliza cadastro
async function verificarCodigo(req, res) {
  const { tel, codigo } = req.body;
  const pendente = codigosPendentes[tel];
  if (!pendente || pendente.codigo !== codigo) {
    return res.status(400).json({ error: 'Código inválido.' });
  }
  // Cria usuário
  try {
    const usuario = await Usuario.create(pendente.dados);
    delete codigosPendentes[tel];
    res.status(201).json({ message: 'Usuário cadastrado com sucesso!', usuario });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao cadastrar usuário.' });
  }
}

module.exports = { iniciarCadastro, verificarCodigo };
