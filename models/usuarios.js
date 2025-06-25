const mongoose = require("mongoose");

const usuariosSchema = new mongoose.Schema({
  nome_completo: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  tel: { type: String, required: true },
  email: { type: String , unique: true, sparse: true  },
  googleId: { type: String, sparse: true, unique: true },
  foto:{ type: String, unique: true, sparse: true },
});

module.exports = mongoose.model("usuarios", usuariosSchema);