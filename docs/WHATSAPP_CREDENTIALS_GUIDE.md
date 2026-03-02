# 🔐 Guía de Configuración de Credenciales WhatsApp Business API

## 📋 Paso 1: Crear Cuenta Meta Business

### 1.1 Registrar cuenta
1. Ve a [Meta Business Suite](https://business.facebook.com/)
2. Haz clic en "Crear cuenta"
3. Ingresa tu información empresarial
4. Verifica tu identidad (documento o teléfono)

### 1.2 Configurar negocio
- **Nombre del negocio:** AgroMAE
- **Categoría:** Tienda de alimentos
- **Dirección:** Tu dirección comercial
- **Teléfono:** +58 424-1234567

## 📱 Paso 2: Obtener Número WhatsApp Business

### 2.1 Descargar WhatsApp Business
1. Descarga [WhatsApp Business](https://play.google.com/store/apps/details?id=com.whatsapp.w4b)
2. Instala con un número **diferente** al personal
3. Verifica el número con código SMS

### 2.2 Configurar perfil
- **Nombre del negocio:** AgroMAE
- **Categoría:** Alimentos y Bebidas
- **Dirección:** Calle Principal #123
- **Descripción:** Productos frescos y artesanales
- **Horario:** 8:00 AM - 6:00 PM

## 🛠️ Paso 3: Crear Aplicación Meta

### 3.1 Ir a Meta Developers
1. Visita [Meta for Developers](https://developers.facebook.com/)
2. Haz clic en "Crear aplicación"
3. Selecciona tipo: **"Business"**
4. Nombre de la app: **"AgroMAE WhatsApp Agent"**

### 3.2 Configurar aplicación
```
Nombre: AgroMAE WhatsApp Agent
Email: tu-email@agromae.com
Negocio: AgroMAE
```

### 3.3 Agregar WhatsApp Business API
1. Busca "WhatsApp Business API" en productos
2. Haz clic en "Configurar"
3. Selecciona tu número de teléfono

## 🔑 Paso 4: Obtener Credenciales

### 4.1 Phone Number ID
Dentro de WhatsApp Business API:
```
1. Ve a "Configuración" > "Número de teléfono"
2. Copia el "Phone Number ID"
Formato: 123456789012345
```

### 4.2 Access Token (Permanente)
```
1. Ve a "Configuración" > "API"
2. Haz clic en "Generar token"
3. Selecciona "App-based"
4. Copia el token generado
Formato: EAAJZC... (largo)
```

### 4.3 Business Account ID
```
1. Ve a "Configuración" > "Cuenta de negocio"
2. Copia el "Business Account ID"
Formato: 123456789012345
```

### 4.4 App Secret
```
1. Ve a "Configuración" > "Básico"
2. Haz clic en "Mostrar" junto a App Secret
3. Copia el valor
Formato: abc123def456...
```

## 🌐 Paso 5: Configurar Webhook

### 5.1 URL del Webhook
```
Desarrollo: http://localhost:3000/webhook
Producción: https://tu-backend.com/webhook
```

### 5.2 Verify Token
```
Valor: agromae-whatsapp-2026
```

### 5.3 Suscribir a eventos
Selecciona estos eventos:
- ✅ `messages` - Mensajes entrantes
- ✅ `message_reactions` - Reacciones a mensajes
- ✅ `message_edits` - Mensajes editados

## 📝 Paso 6: Configurar Archivo .env

### 6.1 Crear archivo .env
```bash
cd backend
cp .env.example .env
```

### 6.2 Editar .env con tus credenciales
```env
# Configuración del Servidor
PORT=3000
NODE_ENV=development

# Configuración de WhatsApp Business API
WHATSAPP_PHONE_ID=123456789012345
WHATSAPP_ACCESS_TOKEN=EAAJZC...token_completo_aqui...
WHATSAPP_BUSINESS_ACCOUNT_ID=123456789012345
WHATSAPP_VERIFY_TOKEN=agromae-whatsapp-2026
WHATSAPP_APP_SECRET=tu_app_secret_aqui

# URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
AGROMAE_API_URL=https://agromae-b.onrender.com/api

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

## 🧪 Paso 7: Verificar Configuración

### 7.1 Iniciar backend
```bash
cd backend
npm start
```

### 7.2 Probar webhook
```bash
curl "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=agromae-whatsapp-2026&hub.challenge=test123"
```

**Respuesta esperada:** `test123`

### 7.3 Health check
```bash
curl http://localhost:3000/health
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-01T...",
  "uptime": 123.45,
  "environment": "development"
}
```

## 📱 Paso 8: Probar con WhatsApp

### 8.1 Enviar mensaje de prueba
1. Abre WhatsApp normal (no Business)
2. Busca tu número Business de AgroMAE
3. Envía: "Hola AgroMAE"

### 8.2 Verificar respuesta
- **Bot debería responder:** "¡Hola! 👋 Bienvenido a AgroMAE 🌱..."
- **Backend debería mostrar logs** en consola
- **Conversación debería guardarse** en memoria

## 🔧 Paso 9: Solución de Problemas

### 9.1 Error 401 Unauthorized
**Causa:** Access Token inválido
**Solución:** Generar nuevo token en Meta Developers

### 9.2 Error 403 Forbidden
**Causa:** Verify Token incorrecto
**Solución:** Verificar token en configuración de webhook

### 9.3 Mensajes no llegan
**Causa:** Webhook no verificado
**Solución:** Revisar URL y token de verificación

### 9.4 Error de conexión
**Causa:** Firewall o red bloqueada
**Solución:** Usar ngrok para desarrollo local

## 🌍 Paso 10: Exponer Localmente (Opcional)

### 10.1 Usar ngrok
```bash
# Instalar ngrok
npm install -g ngrok

# Exponer puerto 3000
ngrok http 3000

# Copiar URL HTTPS
# https://abc123.ngrok.io -> usar en webhook
```

### 10.2 Actualizar webhook
1. Ve a Meta Developers > WhatsApp > Configuración
2. Actualiza webhook URL con ngrok
3. Vuelve a verificar

## 📋 Checklist Final

- [ ] Cuenta Meta Business creada y verificada
- [ ] Número WhatsApp Business configurado
- [ ] Aplicación Meta creada
- [ ] WhatsApp Business API agregado
- [ ] Phone Number ID copiado
- [ ] Access Token generado
- [ ] Business Account ID copiado
- [ ] App Secret copiado
- [ ] Webhook configurado
- [ ] Archivo .env creado y configurado
- [ ] Backend iniciado sin errores
- [ ] Webhook verificado exitosamente
- [ ] Mensaje de prueba enviado y respondido

## 🚀 Listo para Producción

Una vez configurado todo:

1. **Desplegar backend** en servidor (Heroku, Railway, etc.)
2. **Actualizar webhook URL** a producción
3. **Configurar dominio HTTPS** (obligatorio)
4. **Monitorear logs** regularmente
5. **Configurar alerts** para errores

## 📞 Soporte

- **Meta Developers:** [developers.facebook.com](https://developers.facebook.com)
- **WhatsApp Business API:** [developers.facebook.com/docs/whatsapp](https://developers.facebook.com/docs/whatsapp)
- **Soporte AgroMAE:** +58 424-1234567

---

*¡Listo! Tu AgroMAE WhatsApp Agent está configurado y funcionando.* 🌱✅
