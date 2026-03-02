# 🚀 Backend AgroMAE WhatsApp Agent

Backend para el sistema de atención al cliente de AgroMAE a través de WhatsApp Business API.

## 📋 Características

- ✅ **WhatsApp Business API** integración completa
- ✅ **Webhook** para recibir mensajes en tiempo real
- ✅ **Chatbot inteligente** con NLP básico
- ✅ **Gestión de conversaciones** en memoria
- ✅ **API REST** para comunicación con frontend
- ✅ **Logging** estructurado con Winston
- ✅ **Seguridad** con Helmet y CORS
- ✅ **Integración** con API principal de AgroMAE

## 🛠️ Instalación

### Prerrequisitos
- Node.js 16+
- npm o yarn
- Credenciales de WhatsApp Business API

### Pasos de instalación

1. **Clonar e instalar dependencias:**
```bash
cd backend
npm install
```

2. **Configurar variables de entorno:**
```bash
cp .env.example .env
```

3. **Editar el archivo `.env`:**
```env
WHATSAPP_PHONE_ID=tu_phone_number_id
WHATSAPP_ACCESS_TOKEN=tu_access_token
WHATSAPP_VERIFY_TOKEN=agromae-whatsapp-2026
```

4. **Iniciar el servidor:**
```bash
npm start
```

## 🌐 Endpoints

### WhatsApp Webhook
- `GET /webhook` - Verificación de webhook
- `POST /webhook` - Recepción de mensajes

### API REST
- `GET /api/conversations` - Obtener todas las conversaciones
- `GET /api/conversations/:phone/messages` - Mensajes de una conversación
- `POST /api/conversations/:phone/messages` - Enviar mensaje
- `GET /api/stats` - Estadísticas del sistema
- `GET /api/productos` - Productos de AgroMAE
- `GET /api/ventas` - Ventas de AgroMAE

### Health Check
- `GET /health` - Estado del servidor

## 🤖 Chatbot

### Intenciones soportadas
- `greeting` - Saludos y bienvenida
- `products` - Consulta de productos
- `order` - Realizar pedidos
- `prices` - Consulta de precios
- `hours` - Horario de atención
- `delivery` - Información de delivery
- `payment` - Métodos de pago
- `complaint` - Quejas y problemas
- `escalation` - Escalamiento a agentes

### Flujo conversacional
1. **Detección de intención** basada en palabras clave
2. **Generación de respuesta** contextual
3. **Envío automático** a través de WhatsApp API
4. **Almacenamiento** de la conversación

## 📊 Gestión de Conversaciones

### Estados
- `active` - Conversación activa
- `pending` - Esperando respuesta
- `resolved` - Conversación resuelta
- `escalated` - Escalada a agente

### Tipos de mensajes
- `text` - Mensajes de texto
- `image` - Imágenes con caption
- `audio` - Notas de voz
- `button` - Respuestas a botones interactivos

## 🔧 Configuración de WhatsApp

### 1. Crear aplicación Meta
1. Ir a [Meta Developers](https://developers.facebook.com/)
2. Crear nueva aplicación
3. Agregar WhatsApp Business API
4. Obtener Phone ID y Access Token

### 2. Configurar Webhook
1. En la app, configurar webhook URL
2. URL: `https://tu-backend.com/webhook`
3. Verify Token: `agromae-whatsapp-2026`
4. Suscribirse a eventos de `messages`

### 3. Variables de entorno
```env
WHATSAPP_PHONE_ID=123456789012345
WHATSAPP_ACCESS_TOKEN=EAAJZC...
WHATSAPP_VERIFY_TOKEN=agromae-whatsapp-2026
```

## 📱 Integración con Frontend

### Conexión WebSocket (simulada)
```javascript
// El frontend se conecta a los endpoints REST
const response = await fetch('/api/conversations');
const conversations = await response.json();
```

### Envío de mensajes
```javascript
// Enviar mensaje desde el frontend
await fetch('/api/conversations/+584241234567/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hola desde el agente' })
});
```

## 🛡️ Seguridad

### Middleware implementados
- **Helmet** - Protección de headers
- **CORS** - Control de acceso cruzado
- **Morgan** - Logging de peticiones
- **Rate limiting** - Límite de peticiones

### Validación de webhook
- Firma HMAC-SHA256 con App Secret
- Verify token personalizado
- HTTPS obligatorio en producción

## 📝 Logging

### Niveles de log
- `error` - Errores críticos
- `warn` - Advertencias
- `info` - Información general
- `debug` - Información de depuración

### Archivos de log
- `logs/whatsapp.log` - Eventos de WhatsApp
- `logs/api.log` - Eventos de API
- `logs/app.log` - Eventos generales

## 🚀 Despliegue

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

### Docker (opcional)
```bash
docker build -t agromae-whatsapp-backend .
docker run -p 3000:3000 agromae-whatsapp-backend
```

## 📈 Monitoreo

### Métricas disponibles
- Conversaciones totales
- Conversaciones activas
- Tiempo de respuesta promedio
- Tasa de satisfacción
- Mensajes procesados

### Health Check
```bash
curl http://localhost:3000/health
```

## 🔧 Troubleshooting

### Problemas comunes

#### 1. Error de autenticación
```
Error: 401 Unauthorized
```
**Solución:** Verificar Access Token y Phone ID

#### 2. Webhook no se verifica
```
Error: 403 Forbidden
```
**Solución:** Verificar Verify Token

#### 3. Mensajes no se reciben
```
Error: Connection timeout
```
**Solución:** Verificar URL del webhook y firewall

### Logs de depuración
```bash
# Ver logs en tiempo real
tail -f logs/whatsapp.log

# Buscar errores específicos
grep "ERROR" logs/whatsapp.log
```

## 📚 API Reference

### WhatsApp API
- [Documentación oficial](https://developers.facebook.com/docs/whatsapp)
- [Webhooks Guide](https://developers.facebook.com/docs/graph-api/webhooks)

### Endpoints de AgroMAE
- Productos: `/api/productos`
- Ventas: `/api/ventas`
- Clientes: `/api/clientes`

## 🤝 Contribución

1. Fork del repositorio
2. Crear feature branch
3. Commit con cambios
4. Push al branch
5. Crear Pull Request

## 📄 Licencia

MIT License - Ver archivo LICENSE

## 📞 Soporte

- **Email:** soporte@agromae.com
- **WhatsApp:** +58 424-1234567
- **Issues:** GitHub Issues

---

**Desarrollado con ❤️ para AgroMAE**
