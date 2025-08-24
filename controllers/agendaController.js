const Agenda = require('../models/agenda');


// Cria um novo agendamento
async function criarAgendamento(req, res) {
  // O usuário vem do middleware de autenticação (req.user)
  const usuario = req.user;
  if (!usuario) return res.status(401).json({ error: 'Usuário não autenticado.' });

  const { data, horario, servico, nome: nomeInput, telefone: telefoneInput, tel: telInput } = req.body;
  if (!data || !horario || !servico) {
    return res.status(400).json({ error: 'Dados obrigatórios faltando.' });
  }

  try {
    // Buscar dados completos do usuário no banco
    const usuarioCompleto = await require('../models/usuarios').findById(usuario.id || usuario.userId);
    if (!usuarioCompleto) {
      return res.status(401).json({ error: 'Usuário não encontrado.' });
    }

    // Usar nome/telefone enviados no body quando fornecidos; fallback para dados do usuário logado
    const nomeFinal = (typeof nomeInput === 'string' && nomeInput.trim()) ? nomeInput.trim() : usuarioCompleto.nome_completo;
    const telefoneFinalOrig = (typeof telefoneInput === 'string' && telefoneInput.trim())
      ? telefoneInput.trim()
      : (typeof telInput === 'string' && telInput.trim()) ? telInput.trim() : usuarioCompleto.tel;

    if (!telefoneFinalOrig) {
      return res.status(400).json({ error: 'Telefone é obrigatório.' });
    }

    // Normalização simples de telefone: remover espaços
    const telefoneFinal = telefoneFinalOrig.replace(/\s+/g, '');

    // Tenta criar o agendamento
    const novoAgendamento = await Agenda.create({
      nome: nomeFinal,
      telefone: telefoneFinal,
      data: new Date(data),
      horario,
      servico,
      usuarioId: usuarioCompleto._id
    });
    // Resposta compatível com o front: inclui success e id/_id
    res.status(201).json({ 
      success: true,
      message: 'Agendamento criado com sucesso!', 
      agendamento: {
        id: novoAgendamento._id,
        _id: novoAgendamento._id,
        nome: novoAgendamento.nome,
        telefone: novoAgendamento.telefone,
        servico: novoAgendamento.servico,
        data: novoAgendamento.data instanceof Date ? novoAgendamento.data.toISOString().slice(0,10) : novoAgendamento.data,
        horario: novoAgendamento.horario
      }
    });
  } catch (err) {
    if (err.code === 11000) {
      // Erro de índice único: já existe agendamento nesse horário
      return res.status(409).json({ error: 'Já existe um agendamento para este horário.' });
    }
    if (err.name === 'ValidationError') {
      // Erro de validação do Mongoose
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Erro ao criar agendamento.' });
  }
}

module.exports = { criarAgendamento };
