// Servidor Node.js para WhatsApp Webhook
// Requiere: npm install express body-parser crypto

const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración
const WHATSAPP_CONFIG = {
  VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN || 'agromae-whatsapp-2026',
  APP_SECRET: process.env.WHATSAPP_APP_SECRET || 'tu_app_secret',
  PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_ID,
  ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN
};

// Middleware
app.use(bodyParser.json());

// Base de datos en memoria (para desarrollo)
const conversations = new Map();
const messages = new Map();

// Almacenamiento de conversaciones
class ConversationManager {
  static getOrCreateConversation(phoneNumber) {
    if (!conversations.has(phoneNumber)) {
      conversations.set(phoneNumber, {
        id: Date.now(),
        phoneNumber,
        status: 'active',
        messages: [],
        lastActivity: new Date(),
        customerInfo: {
          name: `Cliente ${phoneNumber.slice(-4)}`,
          phone: phoneNumber
        }
      });
    }
    return conversations.get(phoneNumber);
  }

  static addMessage(phoneNumber, message) {
    const conversation = this.getOrCreateConversation(phoneNumber);
    conversation.messages.push({
      id: Date.now(),
      ...message,
      timestamp: new Date()
    });
    conversation.lastActivity = new Date();
    return conversation;
  }

  static getAllConversations() {
    return Array.from(conversations.values());
  }

  static getConversation(phoneNumber) {
    return conversations.get(phoneNumber);
  }
}

// Verificación de webhook
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === WHATSAPP_CONFIG.VERIFY_TOKEN) {
    console.log('Webhook verificado exitosamente');
    res.status(200).send(challenge);
  } else {
    console.log('Error en verificación de webhook');
    res.sendStatus(403);
  }
});

// Recepción de mensajes
app.post('/webhook', (req, res) => {
  try {
    const data = req.body;

    // Verificar firma (opcional pero recomendado)
    if (WHATSAPP_CONFIG.APP_SECRET) {
      const signature = req.headers['x-hub-signature-256'];
      const expectedSignature = 'sha256=' + crypto
        .createHmac('sha256', WHATSAPP_CONFIG.APP_SECRET)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (signature !== expectedSignature) {
        console.log('Firma inválida');
        return res.sendStatus(403);
      }
    }

    // Procesar mensajes entrantes
    if (data.object === 'whatsapp_business_account') {
      for (const entry of data.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            const messages = change.value.messages || [];
            
            for (const message of messages) {
              if (message.type === 'text') {
                handleIncomingMessage(message);
              } else if (message.type === 'interactive') {
                handleInteractiveMessage(message);
              }
            }
          }
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Error procesando webhook:', error);
    res.sendStatus(500);
  }
});

// Manejar mensajes de texto
async function handleIncomingMessage(message) {
  const { from, text, id, timestamp } = message;
  
  console.log(`Mensaje recibido de ${from}: ${text.body}`);

  // Guardar mensaje
  const conversation = ConversationManager.addMessage(from, {
    from,
    content: text.body,
    type: 'text',
    sender: 'customer',
    messageId: id,
    timestamp: new Date(parseInt(timestamp) * 1000)
  });

  // Procesar con bot
  await processWithBot(from, text.body, conversation);
}

// Manejar mensajes interactivos (botones)
async function handleInteractiveMessage(message) {
  const { from, interactive } = message;
  
  if (interactive.type === 'button_reply') {
    const buttonId = interactive.button_reply.id;
    const buttonText = interactive.button_reply.title;
    
    console.log(`Botón presionado: ${buttonText} (${buttonId})`);
    
    // Procesar respuesta del botón
    await handleButtonResponse(from, buttonId, buttonText);
  }
}

// Procesar mensaje con bot
async function processWithBot(phoneNumber, messageText, conversation) {
  const text = messageText.toLowerCase().trim();
  
  // Detectar intención
  const intent = detectIntent(text);
  
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
    timestamp: new Date()
  });
}

// Detectar intención
function detectIntent(text) {
  const intents = {
    greeting: ['hola', 'buenos días', 'buenas tardes', 'hi', 'hello'],
    products: ['productos', 'qué tienen', 'disponible', 'catálogo', 'inventario'],
    order: ['pedido', 'comprar', 'orden', 'quiero', 'necesito'],
    prices: ['precio', 'cuánto cuesta', 'valor', 'costo', 'tarifa'],
    hours: ['horario', 'abierto', 'cerrado', 'atención', 'horarios'],
    delivery: ['delivery', 'envío', 'domicilio', 'reparto', 'entrega'],
    payment: ['pago', 'pagar', 'transferencia', 'efectivo'],
    complaint: ['problema', 'queja', 'mal servicio', 'error'],
    escalation: ['agente', 'humano', 'persona', 'ayuda real']
  };

  for (const [intent, triggers] of Object.entries(intents)) {
    if (triggers.some(trigger => text.includes(trigger))) {
      return intent;
    }
  }
  
  return 'unknown';
}

// Generar respuesta
async function generateResponse(intent, text, conversation) {
  const responses = {
    greeting: '¡Hola! 👋 Bienvenido a AgroMAE 🌱\n\n¿En qué puedo ayudarte hoy?\n\n🥩 Ver productos\n🛒 Hacer pedido\n🕐 Horario\n👥 Hablar con agente',
    
    products: '🌟 Nuestros productos frescos de hoy:\n\n🥩 **Carnes**: Res, cerdo, pollo - $10-15/kg\n🧀 **Quesos**: Mozarella, duro - $7-12/kg\n🍖 **Embutidos**: Chorizo, morcilla - $18-21/kg\n\n¿Qué te interesa?',
    
    order: '🛒 ¡Claro! Para hacer tu pedido necesito:\n\n1. ¿Qué productos quieres?\n2. ¿Cuánto (en kg)?\n3. ¿Delivery o retiro en tienda?\n\nPuedes decirme: "Quiero 2kg de pollo con delivery"',
    
    prices: '💰 Nuestros precios:\n\n🥩 **Carnes Frescas**:\n• Res: $12-15/kg\n• Cerdo: $10-13/kg\n• Pollo: $6-8/kg\n\n🧀 **Quesos Artesanales**:\n• Mozarella: $12/kg\n• Duro: $7/kg\n\n¿Quieres hacer un pedido?',
    
    hours: '🕐 Nuestro horario de atención:\n\nLunes a Sábado: 8:00 AM - 6:00 PM\nDomingos: 8:00 AM - 12:00 PM\n\n📞 Teléfono: +58 424-1234567\n📍 Dirección: Calle Principal #123',
    
    delivery: '🚚 Información de delivery:\n\n• Zona de cobertura: Todo el área metropolitana\n• Tiempo estimado: 30-45 minutos\n• Costo: $3-5 según distancia\n• Mínimo de pedido: $20\n\n¿En qué zona te encuentras?',
    
    payment: '💳 Métodos de pago:\n\n• 💵 Efectivo\n• 📱 Pago móvil\n• 💳 Transferencia bancaria\n• 🌐 Punto de venta\n\n¿Qué método prefieres?',
    
    complaint: '😔 Lamento mucho los inconvenientes.\n\nVoy a conectarlo con un agente especializado.\n\nTiempo de espera: 1-2 minutos\n\nMientras tanto, ¿podrías describir brevemente el problema?',
    
    escalation: '👥 Conectando con un agente especializado...\n\nTiempo de espera estimado: 1-2 minutos\n\nEn breve atenderá tu solicitud.',
    
    unknown: 'No entendí completamente. ¿Podrías reformular tu pregunta?\n\nPuedo ayudarte con:\n• 🥩 Ver productos\n• 🛒 Hacer pedido\n• 💰 Consultar precios\n• 🕐 Ver horario'
  };

  return responses[intent] || responses.unknown;
}

// Enviar mensaje a través de WhatsApp API
async function sendWhatsAppMessage(to, message) {
  try {
    const payload = {
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: { body: message }
    };

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${WHATSAPP_CONFIG.PHONE_NUMBER_ID}/messages`,
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
      throw new Error(`Error enviando mensaje: ${response.status}`);
    }

    const result = await response.json();
    console.log('Mensaje enviado exitosamente:', result);
    return result;
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    throw error;
  }
}

// Manejar respuestas de botones
async function handleButtonResponse(phoneNumber, buttonId, buttonText) {
  const responses = {
    'view_products': '🥩 Te mostraré nuestros productos disponibles...',
    'make_order': '🛒 Para hacer tu pedido, dime qué productos quieres...',
    'view_hours': '🕐 Nuestro horario es...',
    'talk_agent': '👥 Conectando con agente especializado...',
    'delivery_order': '🚚 Para delivery, necesito tu dirección...',
    'pickup_order': '🏪 Para retiro, tu pedido estará listo en 30 minutos...'
  };

  const response = responses[buttonId] || 'Procesando tu selección...';
  
  await sendWhatsAppMessage(phoneNumber, response);
  
  // Guardar respuesta
  ConversationManager.addMessage(phoneNumber, {
    from: phoneNumber,
    content: `Botón: ${buttonText}`,
    type: 'button',
    sender: 'customer',
    timestamp: new Date()
  });
}

// API endpoints para el frontend
app.get('/api/conversations', (req, res) => {
  res.json(ConversationManager.getAllConversations());
});

app.get('/api/conversations/:phoneNumber/messages', (req, res) => {
  const conversation = ConversationManager.getConversation(req.params.phoneNumber);
  if (conversation) {
    res.json(conversation.messages);
  } else {
    res.status(404).json({ error: 'Conversación no encontrada' });
  }
});

app.post('/api/conversations/:phoneNumber/messages', async (req, res) => {
  const { message } = req.body;
  const phoneNumber = req.params.phoneNumber;
  
  try {
    // Enviar mensaje a WhatsApp
    await sendWhatsAppMessage(phoneNumber, message);
    
    // Guardar mensaje
    ConversationManager.addMessage(phoneNumber, {
      from: phoneNumber,
      content: message,
      type: 'text',
      sender: 'agent',
      timestamp: new Date()
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor WhatsApp corriendo en puerto ${PORT}`);
  console.log(`Webhook URL: http://localhost:${PORT}/webhook`);
});

module.exports = app;
