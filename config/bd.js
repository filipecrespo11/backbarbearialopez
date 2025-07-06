const mongoose = require("mongoose");

const conectar = async () => {
  try {
    // Debug: verificar se MONGO_URI está carregada
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI não está definida no arquivo .env");
    }
    
    console.log("Tentando conectar ao MongoDB...");
    await mongoose.connect(process.env.MONGO_URI, {

    });
    console.log("Conectado ao MongoDB com sucesso!");
  } catch (error) {  
    console.error("Erro ao conectar ao MongoDB:", error.message);
    process.exit(1);
  }
};

module.exports = conectar;