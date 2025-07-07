const usuarios = require("../models/usuarios");
const jwt = require("jsonwebtoken");

const login = async (req, res) => {
  const { email, username, password } = req.body;

  try {
    // Permite login por email ou username
    const query = email ? { email, password } : { username, password };
    const usuario = await usuarios.findOne(query);
    
    if (!usuario) {
      return res.status(401).json({ message: "Usuário ou senha inválidos" });
    }
    
    const token = jwt.sign({ id: usuario._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    }); // Token expira em 1 hora
    
    // Retorna token e dados do usuário (sem a senha)
    const usuarioSemSenha = {
      id: usuario._id,
      nome_completo: usuario.nome_completo,
      username: usuario.username,
      email: usuario.email,
      tel: usuario.tel,
      foto: usuario.foto,
      verificado: usuario.verificado
    };
    
    res.status(200).json({ 
      token, 
      usuario: usuarioSemSenha 
    });
    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({ message: "Erro ao autenticar usuário" });
  }
};

module.exports = {  login};  