const express = require('express');
const usuarios = require('../models/usuarios');
const { authenticateToken } = require('../middlewares/autenmid');
const { autenticaAdmin } = require('../middlewares/admin');

const rotas = express.Router();

const {login} = require('../controllers/autecontrol');
rotas.post('/login', login);

const cadastroController = require('../controllers/cadastroController');
// Rota para iniciar cadastro (envia email)
rotas.post('/iniciar-cadastro', cadastroController.iniciarCadastro);
// Rota para verificar código e finalizar cadastro
rotas.post('/verificar-codigo', cadastroController.verificarCodigo);
// Rota para callback do Google OAuth
rotas.post('/auth/google/callback', cadastroController.googleCallback);

// Rota para criar um novo usuário
rotas.post('/criausuarios', async (req, res) => {
    const { nome_completo, username, password, tel, email } = req.body;
    try {
        const novoUsuario = new usuarios({
            nome_completo,
            username,
            password,
            tel,
            email
        });
        await novoUsuario.save();
        res.status(201).json({ message: 'Usuário criado com sucesso' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao criar usuário', error });
    }
}
);

// Rota para consultar usuários
rotas.get('/usuarios', async (req, res) => {
    try {
        const listaUsuarios = await usuarios.find({});
        res.status(200).json(listaUsuarios);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao consultar usuários', error });
    }
});

const agendaController = require('../controllers/agendaController');
// Rota para criar agendamento (usuário precisa estar autenticado)
rotas.post('/agendar', authenticateToken, agendaController.criarAgendamento);

// Rota para listar todos os agendamentos
rotas.get('/agendamentos', async (req, res) => {
  try {
    const agendamentos = await require('../models/agenda').find({}, { data: 1, horario: 1, servico: 1, nome: 1, telefone: 1, usuarioId: 1 });
    res.status(200).json(agendamentos);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao consultar agendamentos', error });
  }
});

// Rota para obter configurações do Google OAuth
rotas.get('/google-config', (req, res) => {
  res.json({
    clientId: process.env.GOOGLE_CLIENT_ID,
    // Não incluir client_secret por segurança
    // O frontend deve enviar o redirect_uri no callback
  });
});

// Rota protegida para criar admin
rotas.post('/criar-admin', autenticaAdmin, async (req, res) => {
  try {
    const { nome_completo, username, password, tel, email } = req.body;
    // Cria usuário admin
    const novoAdmin = new usuarios({
      nome_completo,
      username,
      password,
      tel,
      email,
      isAdmin: true // Marca como admin
    });
    await novoAdmin.save();
    res.status(201).json({ message: 'Administrador criado com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar administrador', error });
  }
});

module.exports = rotas;