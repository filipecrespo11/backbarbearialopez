// Middleware para otimização de memória
const compression = require('compression');

// Configuração de compressão para reduzir o tamanho das respostas
const compressionMiddleware = compression({
  filter: (req, res) => {
    // Não comprimir se a solicitação incluir o header no-compression
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Comprimir todas as respostas por padrão
    return compression.filter(req, res);
  },
  level: 6, // Nível de compressão (1-9, onde 6 é um bom equilíbrio)
});

// Middleware para limpeza de memória
const memoryCleanup = (req, res, next) => {
  // Adicionar headers para controle de cache
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  // Executar garbage collection periodicamente (apenas em produção)
  if (process.env.NODE_ENV === 'production' && global.gc) {
    // Executar GC a cada 100 requests
    if (!global.requestCount) global.requestCount = 0;
    global.requestCount++;
    
    if (global.requestCount % 100 === 0) {
      global.gc();
      console.log(`🧹 Garbage collection executado. Requests: ${global.requestCount}`);
    }
  }
  
  next();
};

// Middleware para monitoramento de memória
const memoryMonitor = (req, res, next) => {
  const memUsage = process.memoryUsage();
  
  // Log de memória apenas se estiver acima de um limite
  if (memUsage.heapUsed > 100 * 1024 * 1024) { // 100MB
    console.log('🚨 Uso de memória:', {
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`
    });
  }
  
  next();
};

module.exports = {
  compressionMiddleware,
  memoryCleanup,
  memoryMonitor
};
