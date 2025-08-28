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

// Fallback: atualizar agendamento sem :id usando combinação única (data+horario+telefone)
rotas.put('/agendar', authenticateToken, async (req, res) => {
  try {
    const { nome, telefone, servico, data, horario } = req.body;
    if (!telefone || !data || !horario) {
      return res.status(400).json({ success: false, message: 'Telefone, data e horário são obrigatórios.' });
    }
    const Agenda = require('../models/agenda');
    const query = { telefone, horario, data: new Date(data) };
    const agendamento = await Agenda.findOne(query);
    if (!agendamento) return res.status(404).json({ success: false, message: 'Agendamento não encontrado' });

    // Permissões: admin ou dono do agendamento
    const userId = (req.user && (req.user.id || req.user.userId)) || null;
    const isOwner = userId && agendamento.usuarioId && agendamento.usuarioId.toString() === String(userId);
    if (!req.isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Permissão negada' });
    }

    if (nome !== undefined) agendamento.nome = nome;
    if (telefone !== undefined) agendamento.telefone = telefone;
    if (servico !== undefined) agendamento.servico = servico;
    if (data !== undefined) agendamento.data = new Date(data);
    if (horario !== undefined) agendamento.horario = horario;

    await agendamento.save();
    res.status(200).json({
      success: true,
      agendamento: {
        id: agendamento._id,
        _id: agendamento._id,
        nome: agendamento.nome,
        telefone: agendamento.telefone,
        servico: agendamento.servico,
        data: agendamento.data instanceof Date ? agendamento.data.toISOString().slice(0,10) : agendamento.data,
        horario: agendamento.horario
      }
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Conflito: já existe um agendamento nesse horário' });
    }
    res.status(500).json({ success: false, message: 'Erro ao atualizar agendamento', error });
  }
});

// Fallback: deletar agendamento sem :id usando combinação única (data+horario+telefone)
rotas.delete('/agendar', authenticateToken, async (req, res) => {
  try {
    const { telefone, data, horario } = req.body || {};
    if (!telefone || !data || !horario) {
      return res.status(400).json({ success: false, message: 'Telefone, data e horário são obrigatórios.' });
    }
    const Agenda = require('../models/agenda');
    const query = { telefone, horario, data: new Date(data) };
    const agendamento = await Agenda.findOne(query);
    if (!agendamento) return res.status(404).json({ success: false, message: 'Agendamento não encontrado' });

    // Permissões: admin ou dono do agendamento
    const userId = (req.user && (req.user.id || req.user.userId)) || null;
    const isOwner = userId && agendamento.usuarioId && agendamento.usuarioId.toString() === String(userId);
    if (!req.isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Permissão negada' });
    }

    await agendamento.deleteOne();
    res.status(200).json({ success: true, message: 'Agendamento excluído' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao deletar agendamento', error });
  }
});

// Rota para listar todos os agendamentos (inclui id/_id)
rotas.get('/agendamentos', async (req, res) => {
  try {
    const agendamentos = await require('../models/agenda').find({}, { nome: 1, telefone: 1, servico: 1, data: 1, horario: 1 });
    // Formata data para YYYY-MM-DD
    const agendamentosFormatados = agendamentos.map(a => ({
      id: a._id,
      _id: a._id,
      nome: a.nome,
      telefone: a.telefone,
      servico: a.servico,
      data: a.data instanceof Date ? a.data.toISOString().slice(0, 10) : a.data,
      horario: a.horario
    }));
    res.status(200).json({ success: true, data: agendamentosFormatados });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao consultar agendamentos', error });
  }
});

// Rota para atualizar agendamento por ID
rotas.put('/agendar/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, telefone, servico, data, horario } = req.body;
    const Agenda = require('../models/agenda');

    const agendamento = await Agenda.findById(id);
    if (!agendamento) return res.status(404).json({ success: false, message: 'Agendamento não encontrado' });

    // Permissões: admin ou dono do agendamento
    const userId = (req.user && (req.user.id || req.user.userId)) || null;
    const isOwner = userId && agendamento.usuarioId && agendamento.usuarioId.toString() === String(userId);
    if (!req.isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Permissão negada' });
    }

    if (nome !== undefined) agendamento.nome = nome;
    if (telefone !== undefined) agendamento.telefone = telefone;
    if (servico !== undefined) agendamento.servico = servico;
    if (data !== undefined) agendamento.data = new Date(data);
    if (horario !== undefined) agendamento.horario = horario;

    await agendamento.save();

    const resposta = {
      id: agendamento._id,
      _id: agendamento._id,
      nome: agendamento.nome,
      telefone: agendamento.telefone,
      servico: agendamento.servico,
      data: agendamento.data instanceof Date ? agendamento.data.toISOString().slice(0,10) : agendamento.data,
      horario: agendamento.horario
    };

    res.status(200).json({ success: true, agendamento: resposta });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Conflito: já existe um agendamento nesse horário' });
    }
    res.status(500).json({ success: false, message: 'Erro ao atualizar agendamento', error });
  }
});

// Rota para deletar agendamento por ID (no padrão requisitado)
rotas.delete('/agendar/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const Agenda = require('../models/agenda');

    const agendamento = await Agenda.findById(id);
    if (!agendamento) return res.status(404).json({ success: false, message: 'Agendamento não encontrado' });

    // Permissões: admin ou dono do agendamento
    const userId = (req.user && (req.user.id || req.user.userId)) || null;
    const isOwner = userId && agendamento.usuarioId && agendamento.usuarioId.toString() === String(userId);
    if (!req.isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Permissão negada' });
    }

    await agendamento.deleteOne();
    res.status(200).json({ success: true, message: 'Agendamento excluído' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao deletar agendamento', error });
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

router.put('/atualizar-telefone', autenticaUsuario, atualizarTelefone);

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
    res.status(201).json({ 
      message: 'Administrador criado com sucesso',
      admin: {
        id: novoAdmin._id,
        nome_completo: novoAdmin.nome_completo,
        username: novoAdmin.username,
        email: novoAdmin.email,
        tel: novoAdmin.tel,
        isAdmin: novoAdmin.isAdmin // Inclui isAdmin na resposta
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar administrador', error });
  }
});

module.exports = rotas;