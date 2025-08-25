const mongoose = require('mongoose');

const agendaSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'usuarios', required: true },
  nome: { type: String, required: true },
  telefone: { type: String, required: true },
  data: { type: Date, required: true },
  horario: { type: String, required: true }, // Ex: '14:00'
  servico: { 
    type: String, 
    required: true, 
    enum: ['sombrancelha', 'barba', 'corte', 'cabelo-barba', 'pezinho'] // Adicionado 'corte'
  }
});

// Não permite dois agendamentos no mesmo horário para o mesmo dia
agendaSchema.index({ data: 1, horario: 1, telefone: 1 }, { unique: true });
// Indexa também por usuarioId para garantir unicidade por usuário, data e horário
agendaSchema.index({ data: 1, horario: 1, usuarioId: 1 }, { unique: true });

module.exports = mongoose.model('Agenda', agendaSchema);
