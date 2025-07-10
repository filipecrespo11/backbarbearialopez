const Agenda = require('../models/agenda');


// Cria um novo agendamento
async function criarAgendamento(req, res) {
  // O usuário vem do middleware de autenticação (req.user)
  const usuario = req.user;
  if (!usuario) return res.status(401).json({ error: 'Usuário não autenticado.' });

  const { data, horario, servico } = req.body;
  if (!data || !horario || !servico) {
    return res.status(400).json({ error: 'Dados obrigatórios faltando.' });
  }

  try {
    // Buscar dados completos do usuário no banco
    const usuarioCompleto = await require('../models/usuarios').findById(usuario.id || usuario.userId);
    if (!usuarioCompleto) {
      return res.status(401).json({ error: 'Usuário não encontrado.' });
    }

    // Tenta criar o agendamento
    const novoAgendamento = await Agenda.create({
      nome: usuarioCompleto.nome_completo,
      telefone: usuarioCompleto.tel,
      data,
      horario,
      servico,
      usuarioId: usuarioCompleto._id
    });
    res.status(201).json({ message: 'Agendamento criado com sucesso!', agendamento: novoAgendamento });
  } catch (err) {
    if (err.code === 11000) {
      // Erro de índice único: já existe agendamento nesse horário
      return res.status(409).json({ error: 'Já existe um agendamento para este horário.' });
    }
    res.status(500).json({ error: 'Erro ao criar agendamento.' });
  }
}

module.exports = { criarAgendamento };
