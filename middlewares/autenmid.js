const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  // Verificar múltiplos formatos de token
  const authHeader = req.headers['authorization'];
  const xAccessToken = req.headers['x-access-token'];
  
  let token = null;
  
  // Tentar pegar token do header Authorization (Bearer format)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }
  // Fallback para x-access-token header
  else if (xAccessToken) {
    token = xAccessToken;
  }
  
  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Token de acesso requerido' 
    });
  }

  try {
    // Verificar e decodificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    req.isAdmin = decoded.isAdmin === true; // Adiciona flag explícita
    next();
  } catch (error) {
    console.error('Erro na verificação do token:', error);
    return res.status(401).json({ 
      success: false,
      message: 'Token inválido ou expirado' 
    });
  }
};

// Manter compatibilidade com o nome antigo
const protect = authenticateToken;

module.exports = { authenticateToken, protect };