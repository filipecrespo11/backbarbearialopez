const mongoose = require("mongoose");

const usuariosSchema = new mongoose.Schema({
  nome_completo: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  tel: { type: String }, // telefone não é mais obrigatório
  email: { type: String, required: true, unique: true }, // email agora é obrigatório
  googleId: { type: String, sparse: true, unique: true },
  google_id: { type: String, sparse: true, unique: true }, // compatibilidade
  foto: { type: String, sparse: true },
  avatar_url: { type: String, sparse: true }, // para URL do avatar do Google
  verificado: { type: Boolean, default: false }, // campo para verificação de email
});

module.exports = mongoose.model("usuarios", usuariosSchema);