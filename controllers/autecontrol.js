const usuarios = require("../models/usuarios");
const jwt = require("jsonwebtoken");

const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const usuario = await usuarios.findOne({ username, password });
    if (!usuario) {
      return res.status(401).json({ message: "Usuário ou senha inválidos" });
    }
    const token = jwt.sign({ id: usuario._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    }); // Token expira em 1 hora
    res.status(200).json({ token });
    } catch (error) {
res.status(500).json({ message: "Erro ao autenticar usuário" });
  }
};

module.exports = {  login};  