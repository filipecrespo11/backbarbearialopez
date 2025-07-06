require('dotenv').config();

console.log("=== TESTE DE VARIÁVEIS DE AMBIENTE ===");
console.log("MONGO_URI:", process.env.MONGO_URI);
console.log("PORT:", process.env.PORT);
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "Definido" : "Não definido");
console.log("=====================================");

// Teste de conexão
const mongoose = require('mongoose');

async function testarConexao() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI não está definida");
    }
    
    console.log("Testando conexão com MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Conexão com MongoDB bem-sucedida!");
    
    // Fechar conexão
    await mongoose.disconnect();
    console.log("Conexão fechada.");
  } catch (error) {
    console.error("❌ Erro na conexão:", error.message);
  }
}

testarConexao();
