// Configuración para WhatsApp Business API y chatbot

export const WHATSAPP_CONFIG = {
  // API Configuration
  API_VERSION: 'v18.0',
  BASE_URL: 'https://graph.facebook.com',
  WEBHOOK_VERIFY_TOKEN: 'agromae-whatsapp-2026',
  
  // Business Account
  PHONE_NUMBER_ID: process.env.REACT_APP_WHATSAPP_PHONE_ID || '123456789012345',
  BUSINESS_ACCOUNT_ID: process.env.REACT_APP_WHATSAPP_BA_ID || '123456789012345',
  
  // Webhook endpoints
  WEBHOOK_URL: '/api/whatsapp/webhook',
  
  // Message templates
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
  }
};

// Flujos conversacionales para el chatbot
export const CONVERSATION_FLOWS = {
  WELCOME: {
    id: 'welcome',
    triggers: ['hola', 'buenos días', 'buenas tardes', 'hi', 'hello'],
    responses: [
      '¡Hola! 👋 Bienvenido a AgroMAE 🌱',
      '¿En qué puedo ayudarte hoy?',
      'Puedo mostrarte nuestros productos o ayudarte con un pedido 🥩'
    ],
    quick_replies: [
      { id: 'products', text: '🥩 Ver productos', action: 'show_products' },
      { id: 'order', text: '🛒 Hacer pedido', action: 'start_order' },
      { id: 'hours', text: '🕐 Horario', action: 'show_hours' },
      { id: 'human', text: '👥 Hablar con agente', action: 'escalate' }
    ]
  },
  
  PRODUCTS: {
    id: 'products',
    triggers: ['productos', 'qué tienen', 'disponible', 'catálogo'],
    responses: [
      '🌟 Nuestros productos frescos de hoy:',
      '🥩 **Carnes**: Res, cerdo, pollo - $10-15/kg',
      '🧀 **Quesos**: Mozarella, duro - $7-12/kg',
      '🍖 **Embutidos**: Chorizo, morcilla - $18-21/kg'
    ],
    quick_replies: [
      { id: 'meats', text: '🥩 Carnes', action: 'show_meats' },
      { id: 'cheeses', text: '🧀 Quesos', action: 'show_cheeses' },
      { id: 'sausages', text: '🍖 Embutidos', action: 'show_sausages' },
      { id: 'prices', text: '💰 Precios', action: 'show_prices' }
    ]
  },
  
  ORDER: {
    id: 'order',
    triggers: ['pedido', 'comprar', 'orden', 'quiero'],
    responses: [
      '🛒 ¡Claro! Para hacer tu pedido necesito:',
      '1. ¿Qué productos quieres?',
      '2. ¿Cuánto (en kg)?',
      '3. ¿Delivery o retiro en tienda?'
    ],
    quick_replies: [
      { id: 'delivery', text: '🚚 Delivery', action: 'delivery_order' },
      { id: 'pickup', text: '🏪 Retiro', action: 'pickup_order' },
      { id: 'urgent', text: '🔥 Urgente', action: 'urgent_order' }
    ]
  },
  
  HOURS: {
    id: 'hours',
    triggers: ['horario', 'abierto', 'cerrado', 'atención'],
    responses: [
      '🕐 **Nuestro horario de atención:**',
      'Lunes a Sábado: 8:00 AM - 6:00 PM',
      'Domingos: 8:00 AM - 12:00 PM',
      '',
      '📞 Teléfono: +58 424-1234567',
      '📍 Dirección: Calle Principal #123'
    ],
    quick_replies: [
      { id: 'location', text: '📍 Ubicación', action: 'send_location' },
      { id: 'call', text: '📞 Llamar', action: 'initiate_call' },
      { id: 'order', text: '🛒 Hacer pedido', action: 'start_order' }
    ]
  },
  
  PRICES: {
    id: 'prices',
    triggers: ['precio', 'cuánto cuesta', 'valor', 'costo'],
    responses: [
      '💰 **Nuestros precios:**',
      '',
      '🥩 **Carnes Frescas:**',
      '• Res: $12-15/kg',
      '• Cerdo: $10-13/kg', 
      '• Pollo: $6-8/kg',
      '',
      '🧀 **Quesos Artesanales:**',
      '• Mozarella: $12/kg',
      '• Duro: $7/kg',
      '',
      '🍖 **Embutidos Naturales:**',
      '• Chorizo: $18/kg',
      '• Morcilla: $21/kg'
    ],
    quick_replies: [
      { id: 'order', text: '🛒 Hacer pedido', action: 'start_order' },
      { id: 'products', text: '🥩 Ver productos', action: 'show_products' }
    ]
  },
  
  DELIVERY: {
    id: 'delivery',
    triggers: ['delivery', 'envío', 'domicilio', 'reparto'],
    responses: [
      '🚚 **Información de delivery:**',
      '',
      '• Zona de cobertura: Todo el área metropolitana',
      '• Tiempo estimado: 30-45 minutos',
      '• Costo: $3-5 según distancia',
      '• Mínimo de pedido: $20',
      '',
      '¿En qué zona te encuentras para calcular el tiempo exacto?'
    ],
    quick_replies: [
      { id: 'order_delivery', text: '🛒 Pedir con delivery', action: 'delivery_order' },
      { id: 'coverage', text: '📍 Cobertura', action: 'show_coverage' }
    ]
  },
  
  PAYMENT: {
    id: 'payment',
    triggers: ['pago', 'pagar', 'transferencia', 'efectivo'],
    responses: [
      '💳 **Métodos de pago:**',
      '',
      '• 💵 Efectivo',
      '• 📱 Pago móvil',
      '• 💳 Transferencia bancaria',
      '• 🌐 Punto de venta',
      '',
      '¿Qué método prefieres para tu pedido?'
    ],
    quick_replies: [
      { id: 'cash', text: '💵 Efectivo', action: 'cash_payment' },
      { id: 'mobile', text: '📱 Pago móvil', action: 'mobile_payment' },
      { id: 'transfer', text: '💳 Transferencia', action: 'transfer_payment' }
    ]
  },
  
  COMPLAINT: {
    id: 'complaint',
    triggers: ['problema', 'queja', 'mal servicio', 'no funcionó'],
    responses: [
      '😔 Lamento mucho los inconvenientes',
      'Voy a conectarlo inmediatamente con un agente humano',
      'Para ayudarte mejor, ¿podrías describir brevemente el problema?'
    ],
    action: 'escalate_to_human',
    priority: 'high'
  },
  
  ESCALATION: {
    id: 'escalation',
    triggers: ['agente', 'humano', 'persona', 'ayuda real'],
    responses: [
      '👥 Conectando con un agente especializado...',
      'Tiempo de espera estimado: 1-2 minutos',
      'Mientras tanto, ¿en qué puedo ayudarte?'
    ],
    action: 'escalate_to_human',
    priority: 'medium'
  }
};

// Configuración de NLP y procesamiento de mensajes
export const NLP_CONFIG = {
  // Intenciones del usuario
  INTENTS: {
    GREETING: ['hola', 'buenos días', 'buenas tardes', 'saludos', 'hi', 'hello'],
    PRODUCTS: ['productos', 'qué tienen', 'disponible', 'catálogo', 'inventario'],
    ORDER: ['pedido', 'comprar', 'orden', 'quiero', 'necesito'],
    PRICES: ['precio', 'cuánto cuesta', 'valor', 'costo', 'tarifa'],
    HOURS: ['horario', 'abierto', 'cerrado', 'atención', 'horarios'],
    DELIVERY: ['delivery', 'envío', 'domicilio', 'reparto', 'entrega'],
    PAYMENT: ['pago', 'pagar', 'transferencia', 'efectivo', 'tarjeta'],
    COMPLAINT: ['problema', 'queja', 'mal servicio', 'error', 'no funcionó'],
    ESCALATION: ['agente', 'humano', 'persona', 'ayuda real', 'especialista'],
    LOCATION: ['ubicación', 'dirección', 'dónde están', 'mapa'],
    CONTACT: ['teléfono', 'contacto', 'llamar', 'comunicarse']
  },
  
  // Entidades a extraer
  ENTITIES: {
    PRODUCT: ['carne', 'pollo', 'res', 'cerdo', 'queso', 'chorizo', 'morcilla', 'embutido'],
    QUANTITY: ['kg', 'kilo', 'gramos', 'libra', 'unidad', 'pieza'],
    LOCATION: ['caracas', 'valencia', 'maracay', 'centro', 'norte', 'sur', 'este', 'oeste'],
    PAYMENT_METHOD: ['efectivo', 'transferencia', 'pago móvil', 'tarjeta', 'punto'],
    URGENCY: ['urgente', 'rápido', 'ya', 'ahora', 'pronto']
  },
  
  // Configuración de IA
  AI_CONFIG: {
    confidence_threshold: 0.7,
    fallback_response: 'No entendí completamente. ¿Podrías reformular tu pregunta?',
    max_context_turns: 5,
    context_timeout: 300000 // 5 minutos
  }
};

// Configuración de agentes y asignación
export const AGENT_CONFIG = {
  MAX_CONCURRENT_CHATS: 5,
  RESPONSE_TIME_TARGET: 120, // segundos
  ESCALATION_RULES: {
    COMPLAINT_KEYWORDS: ['problema', 'queja', 'mal servicio', 'error'],
    URGENT_KEYWORDS: ['urgente', 'ya', 'ahora', 'inmediato'],
    COMPLEX_KEYWORDS: ['personalizado', 'especial', 'diferente']
  },
  
  SKILL_LEVELS: {
    BEGINNER: { max_chats: 3, complex_queries: false },
    INTERMEDIATE: { max_chats: 5, complex_queries: true },
    ADVANCED: { max_chats: 8, complex_queries: true, supervisor: true }
  },
  
  DEPARTMENTS: {
    SALES: { name: 'Ventas', color: 'green', priority: 'high' },
    SUPPORT: { name: 'Soporte', color: 'blue', priority: 'medium' },
    BILLING: { name: 'Facturación', color: 'orange', priority: 'low' }
  }
};

export default WHATSAPP_CONFIG;
