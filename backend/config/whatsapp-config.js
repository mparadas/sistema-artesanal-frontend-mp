// Configuración centralizada de WhatsApp
require('dotenv').config();

const WHATSAPP_CONFIG = {
  // API Configuration
  API_VERSION: 'v18.0',
  BASE_URL: 'https://graph.facebook.com',
  
  // Credenciales (desde .env)
  PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_ID,
  ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,
  BUSINESS_ACCOUNT_ID: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
  VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN,
  APP_SECRET: process.env.WHATSAPP_APP_SECRET,
  
  // Webhook configuration
  WEBHOOK_ENDPOINT: '/webhook',
  
  // Message templates (predefinidos)
  TEMPLATES: {
    WELCOME: {
      name: 'agromae_welcome',
      language: 'es',
      components: [
        {
          type: 'body',
          text: '¡Hola {{1}}! 👋 Bienvenido a AgroMAE 🌱\n\n¿En qué puedo ayudarte hoy?\n\n🥩 Carnes frescas\n🧀 Quesos artesanales\n🍖 Embutidos naturales'
        }
      ]
    },
    ORDER_CONFIRMATION: {
      name: 'agromae_order_confirmation',
      language: 'es',
      components: [
        {
          type: 'body',
          text: '✅ Pedido confirmado\n\n📦 Productos: {{1}}\n💰 Total: {{2}}\n🚚 Delivery: {{3}}\n\n📍 Dirección: {{4}}\n\nGracias por tu compra 🌱'
        }
      ]
    },
    DELIVERY_UPDATE: {
      name: 'agromae_delivery_update',
      language: 'es',
      components: [
        {
          type: 'body',
          text: '🚚 Tu pedido está en camino\n\n📍 Estado: {{1}}\n⏰ Tiempo estimado: {{2}}\n\n📞 Conductor: {{3}}'
        }
      ]
    }
  },
  
  // URLs de la API
  ENDPOINTS: {
    MESSAGES: (phoneId) => `https://graph.facebook.com/${WHATSAPP_CONFIG.API_VERSION}/${phoneId}/messages`,
    PHONE_INFO: (phoneId) => `https://graph.facebook.com/${WHATSAPP_CONFIG.API_VERSION}/${phoneId}`,
    MEDIA: (mediaId) => `https://graph.facebook.com/${WHATSAPP_CONFIG.API_VERSION}/${mediaId}`
  },
  
  // Configuración de timeouts y límites
  TIMEOUTS: {
    API_REQUEST: 30000,        // 30 segundos
    WEBHOOK_RESPONSE: 3000,     // 3 segundos
    MESSAGE_RETRY: 5000         // 5 segundos
  },
  
  // Límites de uso
  LIMITS: {
    MAX_MESSAGE_LENGTH: 4096,
    MAX_MEDIA_SIZE: 100 * 1024 * 1024, // 100MB
    RATE_LIMIT_PER_MINUTE: 60,
    CONCURRENT_REQUESTS: 10
  },
  
  // Configuración de logging
  LOGGING: {
    ENABLED: process.env.NODE_ENV !== 'production',
    LEVEL: process.env.LOG_LEVEL || 'info',
    LOG_WEBHOOK_EVENTS: true,
    LOG_API_REQUESTS: true,
    LOG_ERRORS: true
  },
  
  // Configuración de seguridad
  SECURITY: {
    VERIFY_WEBHOOK_SIGNATURE: true,
    REQUIRE_HTTPS: process.env.NODE_ENV === 'production',
    ALLOWED_ORIGINS: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173']
  },
  
  // Configuración de desarrollo
  DEVELOPMENT: {
    USE_SANDBOX: process.env.WHATSAPP_SANDBOX_MODE === 'true',
    TEST_PHONE_NUMBER: '+14155238886', // Número de prueba de WhatsApp
    MOCK_RESPONSES: process.env.MOCK_WHATSAPP === 'true'
  }
};

// Validación de configuración
function validateConfig() {
  const errors = [];
  
  // Validar credenciales requeridas
  const requiredFields = ['PHONE_NUMBER_ID', 'ACCESS_TOKEN', 'VERIFY_TOKEN'];
  
  requiredFields.forEach(field => {
    if (!WHATSAPP_CONFIG[field]) {
      errors.push(`Falta campo requerido: ${field}`);
    } else if (WHATSAPP_CONFIG[field].includes('...') || WHATSAPP_CONFIG[field].includes('aqui')) {
      errors.push(`Campo ${field} necesita configurarse con valor real`);
    }
  });
  
  // Validar formato de Phone Number ID
  if (WHATSAPP_CONFIG.PHONE_NUMBER_ID && !/^\d{15}$/.test(WHATSAPP_CONFIG.PHONE_NUMBER_ID)) {
    errors.push('PHONE_NUMBER_ID debe tener 15 dígitos');
  }
  
  // Validar formato de Access Token
  if (WHATSAPP_CONFIG.ACCESS_TOKEN && !/^EAA[A-Za-z0-9]/.test(WHATSAPP_CONFIG.ACCESS_TOKEN)) {
    errors.push('ACCESS_TOKEN debe comenzar con "EAA"');
  }
  
  if (errors.length > 0) {
    console.error('❌ Errores de configuración de WhatsApp:');
    errors.forEach(error => console.error(`   - ${error}`));
    return false;
  }
  
  console.log('✅ Configuración de WhatsApp validada correctamente');
  return true;
}

// Función para obtener headers de API
function getApiHeaders() {
  return {
    'Authorization': `Bearer ${WHATSAPP_CONFIG.ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
    'User-Agent': 'AgroMAE-WhatsApp-Agent/1.0'
  };
}

// Función para construir URL de API
function buildApiUrl(endpoint, params = {}) {
  const url = new URL(endpoint);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  return url.toString();
}

// Función para verificar firma de webhook
function verifyWebhookSignature(body, signature) {
  if (!WHATSAPP_CONFIG.APP_SECRET || !signature) {
    return false;
  }
  
  const crypto = require('crypto');
  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', WHATSAPP_CONFIG.APP_SECRET)
    .update(JSON.stringify(body))
    .digest('hex');
  
  return signature === expectedSignature;
}

// Función para formatear número de teléfono
function formatPhoneNumber(phone) {
  // Asegurar que el número tenga formato internacional
  if (!phone.startsWith('+')) {
    // Asumir Venezuela si no tiene código de país
    if (phone.startsWith('04') || phone.startsWith('0')) {
      phone = '+58' + phone.replace(/^0/, '');
    } else {
      phone = '+' + phone;
    }
  }
  
  // Eliminar caracteres no numéricos excepto +
  return phone.replace(/[^\d+]/g, '');
}

// Función para validar mensaje
function validateMessage(message) {
  const errors = [];
  
  if (!message.to) {
    errors.push('Destinatario (to) es requerido');
  }
  
  if (!message.type) {
    errors.push('Tipo de mensaje (type) es requerido');
  }
  
  if (message.type === 'text' && !message.text?.body) {
    errors.push('Contenido del texto es requerido para mensajes de texto');
  }
  
  if (message.text?.body && message.text.body.length > WHATSAPP_CONFIG.LIMITS.MAX_MESSAGE_LENGTH) {
    errors.push(`Mensaje demasiado largo (máximo ${WHATSAPP_CONFIG.LIMITS.MAX_MESSAGE_LENGTH} caracteres)`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Exportar configuración y utilidades
module.exports = {
  WHATSAPP_CONFIG,
  validateConfig,
  getApiHeaders,
  buildApiUrl,
  verifyWebhookSignature,
  formatPhoneNumber,
  validateMessage
};
