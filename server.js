require('dotenv').config();

// Debug: verificar variáveis de ambiente
console.log("=== DEBUG VARIÁVEIS DE AMBIENTE ===");
console.log("MONGO_URI:", process.env.MONGO_URI ? "✅ Definida" : "❌ Não definida");
console.log("PORT:", process.env.PORT || "3001");
console.log("NODE_ENV:", process.env.NODE_ENV || "development");
console.log("=====================================");

const express = require('express');
const cors = require('cors');
const session = require('express-session'); 
const passport = require('passport'); 
const GoogleStrategy = require('passport-google-oauth20').Strategy; 
const autecontrol = require('./controllers/autecontrol');
const auterota = require('./rotas/auterota');
const bd = require('./config/bd');
const Usuario = require('./models/usuarios');
const app = express();

// Configuração da sessão
const sessionConfig = {
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only em produção
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
};

// Em produção, adicionar configurações adicionais
if (process.env.NODE_ENV === 'production') {
  sessionConfig.cookie.secure = true; // Require HTTPS
  sessionConfig.name = 'sessionId'; // Nome personalizado do cookie
}

app.use(session(sessionConfig));

// Inicialização do passport
app.use(passport.initialize());
app.use(passport.session());

// Serialização do usuário (pode ser customizada)
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Estratégia Google
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  async function(accessToken, refreshToken, profile, done) {
    try {
      // Procura usuário pelo googleId
      let usuario = await Usuario.findOne({ googleId: profile.id });
      if (!usuario) {
        // Cria novo usuário se não existir
        usuario = await Usuario.create({
          googleId: profile.id,
          nome: profile.displayName,
          email: profile.emails[0].value,
          foto: profile.photos[0].value
        });
      }
      return done(null, usuario);
    } catch (err) {
      return done(err, null);
    }
  }
));

// Configuração do middleware
app.use(cors());
app.use(express.json());

//banco de dados
// Conexão com o banco de dados MongoDB
bd();

//rota para autenticação de usuários
app.use('/auterota', auterota);


     

const PORT = process.env.PORT || 3001; // Porta padrão ou porta definida no ambiente
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});


module.exports = app;



