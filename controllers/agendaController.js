const Agenda = require('../models/agenda');


// Cria um novo agendamento
async function criarAgendamento(req, res) {
  // Supondo que req.user contém o usuário logado (via sessão/passport)
  const usuario = req.user;
  if (!usuario) return res.status(401).json({ error: 'Usuário não autenticado.' });

  const { data, horario, servico } = req.body;
  if (!data || !horario || !servico) {
    return res.status(400).json({ error: 'Dados obrigatórios faltando.' });
  }

  try {
    // Tenta criar o agendamento
    const novoAgendamento = await Agenda.create({
      nome: usuario.nome_completo || usuario.nome, // compatível com Google/local
      telefone: usuario.tel,
      data,
      horario,
      servico,
      usuarioId: usuario._id // Adiciona referência ao usuário
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
