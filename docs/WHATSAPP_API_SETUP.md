# 📱 Guía de Configuración - WhatsApp Business API

## 🔧 Requisitos Previos

### 1. Cuenta Meta Business
- [ ] Crear cuenta en [Meta Business Suite](https://business.facebook.com/)
- [ ] Verificar identidad del negocio
- [ ] Configurar método de pago

### 2. Número de WhatsApp Business
- [ ] Obtener número dedicado (no personal)
- [ ] Instalar WhatsApp Business
- [ ] Verificar número en Meta Business

### 3. Aplicación Facebook
- [ ] Crear app en [Meta Developers](https://developers.facebook.com/)
- [ ] Configurar WhatsApp Business API
- [ ] Obtener Access Token y Phone Number ID

## 🚀 Configuración Paso a Paso

### Paso 1: Crear Aplicación Meta
```bash
# 1. Ir a https://developers.facebook.com/
# 2. Crear nueva aplicación
# 3. Seleccionar "Business"
# 4. Configurar nombre: "AgroMAE WhatsApp Agent"
# 5. Agregar "WhatsApp Business API"
```

### Paso 2: Configurar WhatsApp
```bash
# 1. En la app, ir a "WhatsApp" > "API Setup"
# 2. Seleccionar número de teléfono
# 3. Configurar webhook URL
# 4. Verificar dominio y webhook
```

### Paso 3: Obtener Credenciales
```json
{
  "PHONE_NUMBER_ID": "123456789012345",
  "WHATSAPP_BUSINESS_ACCOUNT_ID": "123456789012345",
  "ACCESS_TOKEN": "EAAJZC...token_largo...",
  "WEBHOOK_VERIFY_TOKEN": "agromae-whatsapp-2026",
  "APP_ID": "123456789012345"
}
```

## 🌐 Endpoints de la API

### Enviar Mensaje
```http
POST https://graph.facebook.com/v18.0/PHONE_NUMBER_ID/messages
```

### Webhook Receiver
```http
POST /api/whatsapp/webhook
GET /api/whatsapp/webhook?hub.verify_token=TOKEN
```

## 📝 Variables de Entorno

```env
# .env.local
REACT_APP_WHATSAPP_PHONE_ID=123456789012345
REACT_APP_WHATSAPP_ACCESS_TOKEN=EAAJZC...
REACT_APP_WEBHOOK_URL=https://tu-backend.com/api/whatsapp/webhook
REACT_APP_API_BASE_URL=https://tu-backend.com/api
```

## 🔐 Seguridad

- HTTPS obligatorio para webhook
- Validación de tokens
- Rate limiting
- Logging de eventos

## 📊 Costos

- **Conversaciones iniciadas:** ~$0.05 USD
- **Conversaciones respondidas:** Gratis (24h)
- **Mensajes de plantilla:** ~$0.01 USD
- **Límite gratuito:** 1,000 conversaciones/mes

## 🧪 Testing

### Sandbox Mode
- Usa el número de prueba de WhatsApp
- Mensajes gratuitos para desarrollo
- Limitaciones de funcionalidad

### Números de Prueba
```bash
# Test numbers (sandbox)
+14155238886  # WhatsApp test number
```

## 📚 Documentación Oficial

- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [Meta for Developers](https://developers.facebook.com/)
- [Webhooks Guide](https://developers.facebook.com/docs/graph-api/webhooks)
