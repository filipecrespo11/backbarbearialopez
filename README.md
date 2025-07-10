# API Backend - Barbearia

Backend independente para sistemas de agendamento de barbearia com autenticação JWT e Google OAuth.

## 🚀 Características

- ✅ **Backend independente** - Não depende de frontend específico
- ✅ **Autenticação JWT** - Login tradicional com email/senha
- ✅ **Google OAuth** - Login com Google (flexível)
- ✅ **Sistema de agendamento** - Evita conflitos de horário
- ✅ **Verificação por email** - Código de confirmação
- ✅ **Otimizado para produção** - MongoDB session store, compressão

## 📋 Endpoints Principais

### Autenticação
```
POST /auterota/login
POST /auterota/iniciar-cadastro
POST /auterota/verificar-codigo
POST /auterota/auth/google/callback
GET  /auterota/google-config
```

### Agendamento
```
POST /auterota/agendar (requer autenticação)
```

## 🔧 Configuração

### 1. Variáveis de Ambiente (.env)
```env
MONGO_URI=sua_url_mongodb
JWT_SECRET=sua_chave_secreta
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret
```

### 2. Google OAuth Setup
1. Vá para [Google Console](https://console.cloud.google.com/apis/credentials)
2. Configure as URIs autorizadas para SEU frontend:
   - `http://localhost:3000/auth/google/callback` (desenvolvimento)
   - `https://seudominio.com/auth/google/callback` (produção)

## 📖 Como usar com qualquer Frontend

### 1. Login Tradicional
```javascript
// Frontend envia
POST /auterota/login
{
  "email": "user@email.com",
  "password": "senha123"
}

// Backend retorna
{
  "token": "jwt_token_aqui",
  "usuario": { ... }
}
```

### 2. Cadastro com Email
```javascript
// 1. Iniciar cadastro
POST /auterota/iniciar-cadastro
{
  "nome_completo": "João Silva",
  "username": "joao",
  "password": "senha123",
  "tel": "11999999999",
  "email": "joao@email.com"
}

// 2. Verificar código recebido no email
POST /auterota/verificar-codigo
{
  "email": "joao@email.com",
  "codigo": "123456"
}
```

### 3. Login com Google (Flexível)
```javascript
// 1. Frontend obtém configuração
GET /auterota/google-config
// Retorna: { "clientId": "..." }

// 2. Frontend faz OAuth com Google (usando sua própria URL)
// 3. Frontend envia código + sua própria redirect_uri
POST /auterota/auth/google/callback
{
  "code": "codigo_do_google",
  "redirect_uri": "https://SEU_FRONTEND/auth/google/callback"
}

// Backend retorna JWT independente do frontend
{
  "token": "jwt_token_aqui",
  "usuario": { ... }
}
```

### 4. Fazer Agendamento
```javascript
POST /auterota/agendar
Headers: { "Authorization": "Bearer jwt_token_aqui" }
{
  "data": "2025-01-15",
  "horario": "14:00",
  "servico": "cabelo"
}
```

## 🔄 Vantagens da Arquitetura

### ✅ **Autonomia Total**
- Qualquer frontend pode usar este backend
- React, Vue, Angular, app mobile, etc.
- Cada frontend configura sua própria URL de callback

### ✅ **Flexibilidade**
- Frontend define onde quer receber o callback do Google
- Backend apenas valida e retorna JWT
- Sem dependências entre front e back

### ✅ **Escalabilidade**
- Múltiplos frontends podem usar o mesmo backend
- Fácil de trocar ou atualizar frontend
- Backend permanece estável

### ✅ **Segurança**
- JWT stateless
- Senhas criptografadas
- Validação de tokens Google

## 🚀 Deploy

```bash
# Produção com PM2
npm run pm2:start

# Desenvolvimento
npm run dev
```

## 📱 Exemplos de Uso

Este backend pode ser usado com:
- **Web**: React, Vue, Angular
- **Mobile**: React Native, Flutter
- **Desktop**: Electron
- **Outros**: Qualquer cliente HTTP

**O importante é que cada frontend configure sua própria URL de callback no Google Console!**
