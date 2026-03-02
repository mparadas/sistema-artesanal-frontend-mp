const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const winston = require('winston');

const router = express.Router();

// Configuración de logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/whatsapp.log' })
  ]
});

// Configuración de WhatsApp
const WHATSAPP_CONFIG = {
  VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN || 'agromae-whatsapp-2026',
  APP_SECRET: process.env.WHATSAPP_APP_SECRET || '',
  PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_ID || '',
  ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN || '',
  API_VERSION: 'v18.0'
};

// Base de datos en memoria (para desarrollo)
const conversations = new Map();
const messages = new Map();
const customers = new Map();

// Clase para gestionar conversaciones
class ConversationManager {
  static getOrCreateConversation(phoneNumber) {
    if (!conversations.has(phoneNumber)) {
      const conversation = {
        id: Date.now().toString(),
        phoneNumber,
        status: 'active',
        messages: [],
        lastActivity: new Date(),
        createdAt: new Date(),
        customerInfo: this.getOrCreateCustomer(phoneNumber),
        metadata: {
          source: 'whatsapp',
          agentAssigned: null,
          escalationLevel: 0
        }
      };
      conversations.set(phoneNumber, conversation);
      logger.info(`Nueva conversación creada para ${phoneNumber}`, { conversationId: conversation.id });
    }
    return conversations.get(phoneNumber);
  }

  static getOrCreateCustomer(phoneNumber) {
    if (!customers.has(phoneNumber)) {
      const customer = {
        phoneNumber,
        name: `Cliente ${phoneNumber.slice(-4)}`,
        avatar: '👤',
        tags: [],
        orderHistory: [],
        totalSpent: 0,
        createdAt: new Date(),
        lastContact: new Date()
      };
      customers.set(phoneNumber, customer);
    }
    return customers.get(phoneNumber);
  }

  static addMessage(phoneNumber, messageData) {
    const conversation = this.getOrCreateConversation(phoneNumber);
    const message = {
      id: Date.now().toString(),
      ...messageData,
      timestamp: new Date(),
      conversationId: conversation.id
    };
    
    conversation.messages.push(message);
    conversation.lastActivity = new Date();
    
    // Actualizar última información del cliente
    if (messageData.sender === 'customer') {
      const customer = customers.get(phoneNumber);
      if (customer) {
        customer.lastContact = new Date();
      }
    }
    
    logger.info(`Mensaje agregado a conversación ${conversation.id}`, { 
      messageId: message.id, 
      sender: messageData.sender 
    });
    
    return { conversation, message };
  }

  static getAllConversations() {
    return Array.from(conversations.values()).sort((a, b) => 
      new Date(b.lastActivity) - new Date(a.lastActivity)
    );
  }

  static getConversation(phoneNumber) {
    return conversations.get(phoneNumber);
  }

  static updateConversationStatus(phoneNumber, status) {
    const conversation = conversations.get(phoneNumber);
    if (conversation) {
      conversation.status = status;
      conversation.lastActivity = new Date();
      logger.info(`Estado de conversación actualizado: ${status}`, { 
        conversationId: conversation.id 
      });
    }
  }

  static assignAgent(phoneNumber, agentId) {
    const conversation = conversations.get(phoneNumber);
    if (conversation) {
      conversation.metadata.agentAssigned = agentId;
      conversation.lastActivity = new Date();
      logger.info(`Agente asignado a conversación`, { 
        conversationId: conversation.id, 
        agentId 
      });
    }
  }
}

// Verificación de webhook
router.get('/', (req, res) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    logger.info('Intento de verificación de webhook', { mode, token });

    if (mode === 'subscribe' && token === WHATSAPP_CONFIG.VERIFY_TOKEN) {
      logger.info('Webhook verificado exitosamente');
      res.status(200).send(challenge);
    } else {
      logger.warn('Error en verificación de webhook', { mode, token });
      res.sendStatus(403);
    }
  } catch (error) {
    logger.error('Error en verificación de webhook', error);
    res.sendStatus(500);
  }
});

// Recepción de mensajes
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    logger.info('Mensaje recibido de WhatsApp', { data });

    // Verificar firma (opcional pero recomendado)
    if (WHATSAPP_CONFIG.APP_SECRET) {
      const signature = req.headers['x-hub-signature-256'];
      if (signature) {
        const expectedSignature = 'sha256=' + crypto
          .createHmac('sha256', WHATSAPP_CONFIG.APP_SECRET)
          .update(JSON.stringify(req.body))
          .digest('hex');

        if (signature !== expectedSignature) {
          logger.warn('Firma inválida en webhook');
          return res.sendStatus(403);
        }
      }
    }

    // Procesar mensajes entrantes
    if (data.object === 'whatsapp_business_account') {
      for (const entry of data.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            const messages = change.value.messages || [];
            const contacts = change.value.contacts || [];
            
            for (let i = 0; i < messages.length; i++) {
              const message = messages[i];
              const contact = contacts[i];
              
              if (message.type === 'text') {
                await handleTextMessage(message, contact);
              } else if (message.type === 'interactive') {
                await handleInteractiveMessage(message, contact);
              } else if (message.type === 'image') {
                await handleImageMessage(message, contact);
              } else if (message.type === 'audio') {
                await handleAudioMessage(message, contact);
              }
            }
          }
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    logger.error('Error procesando webhook', error);
    res.sendStatus(500);
  }
});

// Manejar mensajes de texto
async function handleTextMessage(message, contact) {
  const { from, text, id, timestamp } = message;
  const messageText = text.body;
  
  logger.info(`Mensaje de texto recibido`, { 
    from, 
    message: messageText, 
    messageId: id 
  });

  // Guardar mensaje
  const { conversation } = ConversationManager.addMessage(from, {
    from,
    content: messageText,
    type: 'text',
    sender: 'customer',
    messageId: id,
    timestamp: new Date(parseInt(timestamp) * 1000)
  });

  // Actualizar información del contacto
  if (contact) {
    const customer = customers.get(from);
    if (customer && contact.profile) {
      customer.name = contact.profile.name || customer.name;
    }
  }

  // Procesar con bot
  await processWithBot(from, messageText, conversation);
}

// Manejar mensajes interactivos (botones)
async function handleInteractiveMessage(message, contact) {
  const { from, interactive } = message;
  
  if (interactive.type === 'button_reply') {
    const buttonId = interactive.button_reply.id;
    const buttonText = interactive.button_reply.title;
    
    logger.info(`Botón presionado`, { 
      from, 
      buttonId, 
      buttonText 
    });
    
    // Guardar mensaje
    ConversationManager.addMessage(from, {
      from,
      content: `Botón: ${buttonText}`,
      type: 'button',
      sender: 'customer',
      buttonId,
      buttonText
    });

    // Procesar respuesta del botón
    await handleButtonResponse(from, buttonId, buttonText);
  }
}

// Manejar mensajes de imagen
async function handleImageMessage(message, contact) {
  const { from, image, id } = message;
  
  logger.info(`Imagen recibida`, { 
    from, 
    imageId: image.id, 
    caption: image.caption 
  });

  ConversationManager.addMessage(from, {
    from,
    content: image.caption || 'Imagen enviada',
    type: 'image',
    sender: 'customer',
    messageId: id,
    imageUrl: image.link
  });

  // Responder acknowledging the image
  await sendWhatsAppMessage(from, 'He recibido tu imagen. ¿En qué puedo ayudarte con respecto a ella?');
}

// Manejar mensajes de audio
async function handleAudioMessage(message, contact) {
  const { from, audio, id } = message;
  
  logger.info(`Audio recibido`, { 
    from, 
    audioId: audio.id 
  });

  ConversationManager.addMessage(from, {
    from,
    content: 'Mensaje de audio recibido',
    type: 'audio',
    sender: 'customer',
    messageId: id,
    audioUrl: audio.link
  });

  await sendWhatsAppMessage(from, 'He recibido tu mensaje de audio. Prefiero los mensajes de texto para poder ayudarte mejor. ¿Puedes escribir lo que necesitas?');
}

// Procesar mensaje con bot
async function processWithBot(phoneNumber, messageText, conversation) {
  const text = messageText.toLowerCase().trim();
  
  // Detectar intención
  const intent = detectIntent(text);
  
  logger.info(`Intención detectada`, { 
    phoneNumber, 
    intent, 
    message: messageText 
  });
  
  // Generar respuesta
  const response = await generateResponse(intent, text, conversation);
  
  // Enviar respuesta
  await sendWhatsAppMessage(phoneNumber, response);
  
  // Guardar respuesta del bot
  ConversationManager.addMessage(phoneNumber, {
    from: phoneNumber,
    content: response,
    type: 'text',
    sender: 'bot',
    intent: intent
  });
}

// Detectar intención
function detectIntent(text) {
  const intents = {
    greeting: ['hola', 'buenos días', 'buenas tardes', 'buenas noches', 'hi', 'hello', 'saludos'],
    products: ['productos', 'qué tienen', 'disponible', 'catálogo', 'inventario', 'qué venden'],
    order: ['pedido', 'comprar', 'orden', 'quiero', 'necesito', 'deseo', 'me llevo'],
    prices: ['precio', 'cuánto cuesta', 'valor', 'costo', 'tarifa', 'cuánto vale'],
    hours: ['horario', 'abierto', 'cerrado', 'atención', 'horarios', 'a qué hora'],
    delivery: ['delivery', 'envío', 'domicilio', 'reparto', 'entrega', 'mandan'],
    payment: ['pago', 'pagar', 'transferencia', 'efectivo', 'pago móvil', 'tarjeta'],
    complaint: ['problema', 'queja', 'mal servicio', 'error', 'no funciona', 'malo'],
    escalation: ['agente', 'humano', 'persona', 'ayuda real', 'especialista', 'atención personal'],
    location: ['ubicación', 'dirección', 'dónde están', 'mapa', 'cómo llegar'],
    contact: ['teléfono', 'contacto', 'llamar', 'comunicarse', 'número'],
    thanks: ['gracias', 'agradecido', 'thank you', 'gracias por'],
    bye: ['adiós', 'chao', 'hasta luego', 'bye', 'nos vemos']
  };

  // Buscar coincidencias exactas primero
  for (const [intent, triggers] of Object.entries(intents)) {
    if (triggers.some(trigger => text === trigger)) {
      return intent;
    }
  }

  // Buscar coincidencias parciales
  for (const [intent, triggers] of Object.entries(intents)) {
    if (triggers.some(trigger => text.includes(trigger))) {
      return intent;
    }
  }
  
  return 'unknown';
}

// Generar respuesta
async function generateResponse(intent, text, conversation) {
  const customerName = conversation.customerInfo.name;
  
  const responses = {
    greeting: `¡Hola ${customerName}! 👋 Bienvenido a AgroMAE 🌱\n\n¿En qué puedo ayudarte hoy?\n\n🥩 Ver productos\n🛒 Hacer pedido\n💰 Consultar precios\n🕐 Ver horario\n👥 Hablar con agente`,
    
    products: `🌟 Nuestros productos frescos de hoy:\n\n🥩 **Carnes Frescas**:\n• Res: $12-15/kg\n• Cerdo: $10-13/kg\n• Pollo: $6-8/kg\n\n🧀 **Quesos Artesanales**:\n• Mozarella: $12/kg\n• Duro: $7/kg\n\n🍖 **Embutidos Naturales**:\n• Chorizo: $18/kg\n• Morcilla: $21/kg\n\n¿Qué te interesa?`,
    
    order: `🛒 ¡Claro! Para hacer tu pedido necesito:\n\n1. ¿Qué productos quieres?\n2. ¿Cuánto (en kg)?\n3. ¿Delivery o retiro en tienda?\n\nPuedes decirme: "Quiero 2kg de pollo con delivery"`,
    
    prices: `💰 Nuestros precios:\n\n🥩 **Carnes Frescas**:\n• Res: $12-15/kg\n• Cerdo: $10-13/kg\n• Pollo: $6-8/kg\n\n🧀 **Quesos Artesanales**:\n• Mozarella: $12/kg\n• Duro: $7/kg\n\n🍖 **Embutidos Naturales**:\n• Chorizo: $18/kg\n• Morcilla: $21/kg\n\n¿Quieres hacer un pedido?`,
    
    hours: `🕐 Nuestro horario de atención:\n\nLunes a Sábado: 8:00 AM - 6:00 PM\nDomingos: 8:00 AM - 12:00 PM\n\n📞 Teléfono: +58 424-1234567\n📍 Dirección: Calle Principal #123\n\n¿Quieres hacer un pedido?`,
    
    delivery: `🚚 Información de delivery:\n\n• Zona de cobertura: Todo el área metropolitana\n• Tiempo estimado: 30-45 minutos\n• Costo: $3-5 según distancia\n• Mínimo de pedido: $20\n\n¿En qué zona te encuentras?`,
    
    payment: `💳 Métodos de pago:\n\n• 💵 Efectivo\n• 📱 Pago móvil\n• 💳 Transferencia bancaria\n• 🌐 Punto de venta\n\n¿Qué método prefieres para tu pedido?`,
    
    complaint: `😔 Lamento mucho los inconvenientes.\n\nVoy a conectarlo con un agente especializado.\n\nTiempo de espera: 1-2 minutos\n\nMientras tanto, ¿podrías describir brevemente el problema?`,
    
    escalation: `👥 Conectando con un agente especializado...\n\nTiempo de espera estimado: 1-2 minutos\n\nEn breve atenderá tu solicitud.`,
    
    location: `📍 Nuestra ubicación:\n\n🏪 AgroMAE\n📍 Calle Principal #123, Caracas\n🗺️ [Ver en Google Maps](https://maps.google.com)\n\n📞 Teléfono: +58 424-1234567\n\n¿Quieres hacer un pedido o delivery?`,
    
    contact: `📞 Información de contacto:\n\n📱 WhatsApp: +58 424-1234567\n📞 Teléfono: +58 424-1234567\n📍 Dirección: Calle Principal #123\n\n🕐 Horario: Lunes a Sábado 8AM-6PM\n\n¿En qué puedo ayudarte?`,
    
    thanks: `¡De nada! 😊 Estamos para servirte.\n\n¿Hay algo más en lo que pueda ayudarte?\n\n🥩 Ver productos\n🛒 Hacer pedido`,
    
    bye: `¡Hasta pronto! 👋\n\nGracias por contactarnos.\n\nVuelve cuando quieras, estaremos aquí para ayudarte. 🌱`,
    
    unknown: `No entendí completamente. ¿Podrías reformular tu pregunta?\n\nPuedo ayudarte con:\n• 🥩 Ver productos\n• 🛒 Hacer pedido\n• 💰 Consultar precios\n• 🕐 Ver horario\n• 📍 Ubicación\n• 📞 Contacto`
  };

  return responses[intent] || responses.unknown;
}

// Enviar mensaje a través de WhatsApp API
async function sendWhatsAppMessage(to, message) {
  try {
    if (!WHATSAPP_CONFIG.ACCESS_TOKEN || !WHATSAPP_CONFIG.PHONE_NUMBER_ID) {
      logger.error('Credenciales de WhatsApp no configuradas');
      return { error: 'Credenciales no configuradas' };
    }

    const payload = {
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: { body: message }
    };

    logger.info('Enviando mensaje a WhatsApp', { to, messageLength: message.length });

    const response = await fetch(
      `https://graph.facebook.com/${WHATSAPP_CONFIG.API_VERSION}/${WHATSAPP_CONFIG.PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_CONFIG.ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      logger.error('Error enviando mensaje a WhatsApp', errorData);
      throw new Error(`Error ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
    }

    const result = await response.json();
    logger.info('Mensaje enviado exitosamente', { messageId: result.messages[0].id });
    return result;
  } catch (error) {
    logger.error('Error enviando mensaje', error);
    throw error;
  }
}

// Manejar respuestas de botones
async function handleButtonResponse(phoneNumber, buttonId, buttonText) {
  const responses = {
    'view_products': '🥩 Te mostraré nuestros productos disponibles...',
    'make_order': '🛒 Para hacer tu pedido, dime qué productos quieres...',
    'view_hours': '🕐 Nuestro horario es de lunes a sábado 8AM-6PM...',
    'talk_agent': '👥 Conectando con agente especializado...',
    'delivery_order': '🚚 Para delivery, necesito tu dirección...',
    'pickup_order': '🏪 Para retiro, tu pedido estará listo en 30 minutos...',
    'see_prices': '💰 Te mostraré nuestra lista de precios...',
    'get_location': '📍 Estamos en Calle Principal #123...',
    'call_us': '📞 Puedes llamarnos al +58 424-1234567...'
  };

  const response = responses[buttonId] || 'Procesando tu selección...';
  
  await sendWhatsAppMessage(phoneNumber, response);
}

// API endpoints para el frontend
router.get('/conversations', (req, res) => {
  try {
    const allConversations = ConversationManager.getAllConversations();
    res.json(allConversations);
  } catch (error) {
    logger.error('Error obteniendo conversaciones', error);
    res.status(500).json({ error: 'Error obteniendo conversaciones' });
  }
});

router.get('/conversations/:phoneNumber/messages', (req, res) => {
  try {
    const conversation = ConversationManager.getConversation(req.params.phoneNumber);
    if (conversation) {
      res.json(conversation.messages);
    } else {
      res.status(404).json({ error: 'Conversación no encontrada' });
    }
  } catch (error) {
    logger.error('Error obteniendo mensajes', error);
    res.status(500).json({ error: 'Error obteniendo mensajes' });
  }
});

router.post('/conversations/:phoneNumber/messages', async (req, res) => {
  try {
    const { message } = req.body;
    const phoneNumber = req.params.phoneNumber;
    
    // Enviar mensaje a WhatsApp
    await sendWhatsAppMessage(phoneNumber, message);
    
    // Guardar mensaje
    ConversationManager.addMessage(phoneNumber, {
      from: phoneNumber,
      content: message,
      type: 'text',
      sender: 'agent'
    });
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Error enviando mensaje', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/conversations/:phoneNumber/assign', (req, res) => {
  try {
    const { agentId } = req.body;
    const phoneNumber = req.params.phoneNumber;
    
    ConversationManager.assignAgent(phoneNumber, agentId);
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Error asignando agente', error);
    res.status(500).json({ error: 'Error asignando agente' });
  }
});

router.get('/stats', (req, res) => {
  try {
    const allConversations = ConversationManager.getAllConversations();
    const stats = {
      totalConversations: allConversations.length,
      activeConversations: allConversations.filter(c => c.status === 'active').length,
      totalMessages: allConversations.reduce((sum, c) => sum + c.messages.length, 0),
      totalCustomers: customers.size,
      averageResponseTime: 2.3, // Simulado
      satisfactionRate: 94.2 // Simulado
    };
    
    res.json(stats);
  } catch (error) {
    logger.error('Error obteniendo estadísticas', error);
    res.status(500).json({ error: 'Error obteniendo estadísticas' });
  }
});

module.exports = router;
