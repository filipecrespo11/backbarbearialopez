const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  // Verificar múltiplos formatos de token
  const authHeader = req.headers['authorization'];
  const xAccessToken = req.headers['x-access-token'];
  const queryToken = req.query && (req.query.token || req.query.access_token);
  const cookieHeader = req.headers['cookie'];
  
  let token = null;
  
  // Tentar pegar token do header Authorization (Bearer format)
  if (authHeader) {
    const trimmed = authHeader.trim();
    const lower = trimmed.toLowerCase();
    if (lower.startsWith('bearer ')) {
      token = trimmed.slice(7);
    } else if (lower.startsWith('token ')) {
      token = trimmed.slice(6);
    } else {
      // Aceita Authorization com o token puro (sem Bearer)
      token = trimmed;
    }
  } else if (xAccessToken) {
    // Fallback para x-access-token header
    token = xAccessToken;
  } else if (typeof queryToken === 'string' && queryToken.length > 0) {
    // Fallback via query string
    token = queryToken;
  } else if (typeof cookieHeader === 'string' && cookieHeader.includes('token=')) {
    // Fallback via cookie simples (token=<jwt>)
    const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
    if (match) token = decodeURIComponent(match[1]);
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