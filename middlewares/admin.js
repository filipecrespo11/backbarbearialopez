const jwt = require('jsonwebtoken');

function autenticaAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }
  if (!token) {
    return res.status(401).json({ success: false, message: 'Token de acesso requerido.' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload || !payload.isAdmin) {
      return res.status(403).json({ success: false, message: 'Acesso restrito a administradores.' });
    }
    req.usuario = payload;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token inválido ou expirado.' });
  }
}

module.exports = { autenticaAdmin };
