const express = require('express');
const usuarios = require('../models/usuarios');

const rotas = express.Router();

const {login} = require('../controllers/autecontrol');
rotas.post('/login', login);

const cadastroController = require('../controllers/cadastroController');
// Rota para iniciar cadastro (envia email)
rotas.post('/iniciar-cadastro', cadastroController.iniciarCadastro);
// Rota para verificar código e finalizar cadastro
rotas.post('/verificar-codigo', cadastroController.verificarCodigo);

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
rotas.post('/agendar', agendaController.criarAgendamento);

module.exports = rotas;