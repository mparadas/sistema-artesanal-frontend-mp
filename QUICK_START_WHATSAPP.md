# 🚀 Quick Start - AgroMAE WhatsApp Agent

## ⚡ Configuración Rápida (5 minutos)

### 📋 Requisitos:
- Node.js 16+
- Cuenta Meta Business
- Número WhatsApp Business

### 🛠️ Paso 1: Obtener Credenciales

#### 1.1 Meta Business Suite
1. Ve a [business.facebook.com](https://business.facebook.com)
2. Crea cuenta o inicia sesión
3. Configura tu negocio "AgroMAE"

#### 1.2 Meta Developers
1. Ve a [developers.facebook.com](https://developers.facebook.com)
2. "Crear aplicación" → "Business"
3. Nombre: "AgroMAE WhatsApp Agent"
4. Agrega "WhatsApp Business API"

#### 1.3 Obtener credenciales:
- **Phone Number ID:** En WhatsApp > Configuración
- **Access Token:** En API > Generar token
- **Business Account ID:** En Configuración > Cuenta
- **App Secret:** En Configuración > Básico

### 🔧 Paso 2: Configurar Backend

#### 2.1 Editar archivo .env
```bash
cd backend
nano .env
```

#### 2.2 Pegar tus credenciales:
```env
WHATSAPP_PHONE_ID=123456789012345
WHATSAPP_ACCESS_TOKEN=EAAJZC...tu_token_completo...
WHATSAPP_BUSINESS_ACCOUNT_ID=123456789012345
WHATSAPP_VERIFY_TOKEN=agromae-whatsapp-2026
WHATSAPP_APP_SECRET=tu_app_secret
```

### 🚀 Paso 3: Iniciar Servidor

#### 3.1 Iniciar backend
```bash
cd backend
npm start
```

#### 3.2 Verificar que funciona
```bash
curl http://localhost:3000/health
```

### 🌐 Paso 4: Configurar Webhook

#### 4.1 En Meta Developers:
1. Ve a WhatsApp > Configuración
2. Webhook URL: `http://localhost:3000/webhook`
3. Verify Token: `agromae-whatsapp-2026`
4. Suscribir a eventos: `messages`

#### 4.2 Probar webhook:
```bash
curl "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=agromae-whatsapp-2026&hub.challenge=test"
```

### 📱 Paso 5: Probar WhatsApp

#### 5.1 Enviar mensaje de prueba:
1. Abre WhatsApp normal
2. Busca tu número Business
3. Envía: "hola agromae"

#### 5.2 Respuesta esperada:
```
¡Hola [Nombre]! 👋 Bienvenido a AgroMAE 🌱

¿En qué puedo ayudarte hoy?

🥩 Ver productos
🛒 Hacer pedido
💰 Consultar precios
🕐 Ver horario
👥 Hablar con agente
```

### 🎯 Paso 6: Probar Frontend

#### 6.1 Iniciar frontend
```bash
cd ..
npm run dev
```

#### 6.2 Ir a WhatsApp Agent:
1. Abre http://localhost:5173
2. Inicia sesión
3. Ve a "WhatsApp Agent" en el menú

### ✅ Verificación Final

#### Test completo:
```bash
node scripts/test-whatsapp.js
```

#### Checklist:
- [ ] Backend corriendo en puerto 3000
- [ ] Frontend corriendo en puerto 5173
- [ ] Webhook verificado
- [ ] Mensaje de prueba respondido
- [ ] Dashboard de WhatsApp Agent funciona

### 🔧 Si algo falla:

#### Error 401:
```bash
# Access Token inválido
# Genera nuevo token en Meta Developers
```

#### Error 403:
```bash
# Verify Token incorrecto
# Verifica "agromae-whatsapp-2026" en webhook
```

#### Mensajes no llegan:
```bash
# Usa ngrok para exponer localmente
npm install -g ngrok
ngrok http 3000
# Actualiza webhook URL con ngrok
```

### 📚 Documentación completa:
- [Guía detallada](docs/WHATSAPP_CREDENTIALS_GUIDE.md)
- [Documentación API](docs/WHATSAPP_API_SETUP.md)
- [Troubleshooting](backend/README.md)

### 🆘 Soporte:
- **WhatsApp:** +58 424-1234567
- **Email:** soporte@agromae.com
- **Issues:** GitHub Issues

---

**🎉 ¡Listo! Tu AgroMAE WhatsApp Agent está funcionando.**
