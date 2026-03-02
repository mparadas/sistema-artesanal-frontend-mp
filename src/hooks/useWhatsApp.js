import { useState, useEffect, useCallback, useRef } from 'react';
import { AgroMAEWhatsAppService } from '../services/WhatsAppService';
import { CONVERSATION_FLOWS, NLP_CONFIG } from '../components/WhatsAppAgent/WhatsAppConfig';

export const useWhatsApp = () => {
  const [service] = useState(() => new AgroMAEWhatsAppService());
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState(true);
  const messagesEndRef = useRef(null);

  // Auto-scroll al final de los mensajes
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Procesar mensaje con NLP
  const processMessage = useCallback(async (message, conversationId) => {
    const text = message.toLowerCase().trim();
    
    // Detectar intención
    const detectedIntent = detectIntent(text);
    
    // Obtener flujo conversacional
    const flow = CONVERSATION_FLOWS[detectedIntent];
    
    if (flow) {
      // Simular procesamiento
      setIsTyping(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generar respuesta basada en el flujo
      const response = generateResponse(flow, message);
      
      // Enviar respuesta
      await sendMessage(conversationId, response, 'bot');
      
      setIsTyping(false);
      
      return { intent: detectedIntent, response };
    }
    
    return { intent: 'unknown', response: null };
  }, []);

  // Detectar intención del mensaje
  const detectIntent = (text) => {
    for (const [intent, config] of Object.entries(CONVERSATION_FLOWS)) {
      const triggers = config.triggers || [];
      if (triggers.some(trigger => text.includes(trigger))) {
        return intent;
      }
    }
    return 'unknown';
  };

  // Generar respuesta basada en flujo
  const generateResponse = (flow, originalMessage) => {
    const responses = flow.responses || [];
    const quickReplies = flow.quick_replies || [];
    
    let response = responses[Math.floor(Math.random() * responses.length)];
    
    // Reemplazar variables si es necesario
    response = response.replace(/{nombre}/g, 'Cliente');
    response = response.replace(/{producto}/g, 'producto seleccionado');
    
    // Agregar respuestas rápidas si existen
    if (quickReplies.length > 0) {
      const quickReplyText = quickReplies
        .map(reply => reply.text)
        .slice(0, 3)
        .join(' | ');
      response += '\n\n' + quickReplyText;
    }
    
    return response;
  };

  // Enviar mensaje
  const sendMessage = useCallback(async (conversationId, content, sender = 'agent') => {
    try {
      const newMessage = {
        id: Date.now(),
        conversationId,
        content,
        sender,
        timestamp: new Date().toISOString(),
        status: 'sent'
      };

      // Agregar mensaje localmente
      setMessages(prev => [...prev, newMessage]);
      
      // Actualizar conversación
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, lastMessage: content, lastActivity: new Date() }
          : conv
      ));

      // Si es mensaje de cliente, procesar con bot
      if (sender === 'customer') {
        await processMessage(content, conversationId);
      }

      return newMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, [processMessage]);

  // Iniciar nueva conversación
  const startConversation = useCallback(async (customerInfo) => {
    try {
      const newConversation = {
        id: Date.now(),
        customerInfo,
        status: 'active',
        lastMessage: 'Conversación iniciada',
        lastActivity: new Date(),
        unreadCount: 0,
        messages: []
      };

      setConversations(prev => [newConversation, ...prev]);
      setActiveConversation(newConversation);
      setMessages([]);

      // Enviar mensaje de bienvenida automático
      await sendMessage(newConversation.id, '¡Hola! 👋 Bienvenido a AgroMAE 🌱\n\n¿En qué puedo ayudarte hoy?', 'bot');

      return newConversation;
    } catch (error) {
      console.error('Error starting conversation:', error);
      throw error;
    }
  }, [sendMessage]);

  // Cargar conversaciones
  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Simular carga de conversaciones
      const mockConversations = [
        {
          id: 1,
          customerInfo: {
            name: 'María González',
            phone: '+58 424-1234567',
            avatar: '👩'
          },
          status: 'active',
          lastMessage: '¿Tienen pollo fresco disponible?',
          lastActivity: new Date(),
          unreadCount: 2
        },
        {
          id: 2,
          customerInfo: {
            name: 'Carlos Rodríguez',
            phone: '+58 412-9876543',
            avatar: '👨'
          },
          status: 'pending',
          lastMessage: 'Quiero hacer un pedido',
          lastActivity: new Date(Date.now() - 3600000),
          unreadCount: 0
        }
      ];

      setConversations(mockConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar mensajes de una conversación
  const loadMessages = useCallback(async (conversationId) => {
    try {
      setIsLoading(true);
      
      // Simular carga de mensajes
      const mockMessages = [
        {
          id: 1,
          conversationId,
          content: 'Hola, buen día. ¿Me pueden informar sobre los productos disponibles?',
          sender: 'customer',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: 'read'
        },
        {
          id: 2,
          conversationId,
          content: '¡Hola! 👋 Bienvenido a AgroMAE 🌱\n\nHoy tenemos disponibles:\n🥩 Carnes frescas: Res, cerdo, pollo\n🧀 Quesos artesanales\n🍖 Embutidos naturales\n\n¿Qué productos te interesan?',
          sender: 'bot',
          timestamp: new Date(Date.now() - 3500000).toISOString(),
          status: 'delivered'
        }
      ];

      setMessages(mockMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Seleccionar conversación
  const selectConversation = useCallback((conversation) => {
    setActiveConversation(conversation);
    loadMessages(conversation.id);
    
    // Marcar como leída
    setConversations(prev => prev.map(conv => 
      conv.id === conversation.id 
        ? { ...conv, unreadCount: 0 }
        : conv
    ));
  }, [loadMessages]);

  // Enviar plantilla
  const sendTemplate = useCallback(async (conversationId, templateName, variables = {}) => {
    try {
      const templates = {
        welcome: '¡Hola {nombre}! 👋 Bienvenido a AgroMAE 🌱\n\n¿En qué puedo ayudarte hoy?',
        order_confirmation: '✅ Pedido confirmado\n\n📦 Productos: {productos}\n💰 Total: ${total}\n\nGracias por tu compra 🌱',
        delivery_update: '🚚 Tu pedido está en camino\n\n📍 Estado: {estado}\n⏰ Tiempo estimado: {tiempo}'
      };

      const template = templates[templateName];
      if (!template) {
        throw new Error(`Template ${templateName} not found`);
      }

      // Reemplazar variables
      let content = template;
      Object.entries(variables).forEach(([key, value]) => {
        content = content.replace(new RegExp(`{${key}}`, 'g'), value);
      });

      return await sendMessage(conversationId, content, 'bot');
    } catch (error) {
      console.error('Error sending template:', error);
      throw error;
    }
  }, [sendMessage]);

  // Enviar catálogo de productos
  const sendProductCatalog = useCallback(async (conversationId, category = null) => {
    try {
      setIsLoading(true);
      
      // Llamar al servicio para obtener productos
      await service.sendProductCatalog(
        activeConversation?.customerInfo?.phone || '+584000000000',
        category
      );

      // Simular respuesta local
      const catalogMessage = `🌟 *Catálogo de Productos*\n\n` +
        `🥩 **Carnes Frescas**\n` +
        `• Res: $12-15/kg\n` +
        `• Cerdo: $10-13/kg\n` +
        `• Pollo: $6-8/kg\n\n` +
        `🧀 **Quesos Artesanales**\n` +
        `• Mozarella: $12/kg\n` +
        `• Duro: $7/kg\n\n` +
        `🍖 **Embutidos Naturales**\n` +
        `• Chorizo: $18/kg\n` +
        `• Morcilla: $21/kg\n\n` +
        `¿Qué producto te interesa?`;

      return await sendMessage(conversationId, catalogMessage, 'bot');
    } catch (error) {
      console.error('Error sending catalog:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [activeConversation, sendMessage, service]);

  // Verificar stock
  const checkStock = useCallback(async (conversationId, productName) => {
    try {
      setIsLoading(true);
      
      await service.checkStock(
        activeConversation?.customerInfo?.phone || '+584000000000',
        productName
      );

      // Simular respuesta
      const stockMessage = `📦 *Información de Stock*\n\n` +
        `🥩 **${productName}**\n` +
        `💰 Precio: $${(Math.random() * 20 + 5).toFixed(2)}/kg\n` +
        `📦 Disponible: ${(Math.random() * 50 + 10).toFixed(1)} kg\n` +
        `🏷️ Categoría: Carnes Frescas\n\n` +
        `¿Te gustaría reservar o hacer un pedido?`;

      return await sendMessage(conversationId, stockMessage, 'bot');
    } catch (error) {
      console.error('Error checking stock:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [activeConversation, sendMessage, service]);

  // Crear pedido
  const createOrder = useCallback(async (conversationId, items, deliveryInfo) => {
    try {
      setIsLoading(true);
      
      await service.createOrderFromWhatsApp(
        activeConversation?.customerInfo?.phone || '+584000000000',
        items,
        deliveryInfo
      );

      const orderMessage = `✅ *Pedido Recibido*\n\n` +
        `📋 N° de pedido: #${Math.floor(Math.random() * 10000)}\n` +
        `🛒 Productos: ${items.length}\n` +
        `💰 Total: $${items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}\n` +
        `🚚 Delivery: ${deliveryInfo.tipo || 'Retiro en tienda'}\n\n` +
        `Te contactaremos pronto para confirmar. 🌱`;

      return await sendMessage(conversationId, orderMessage, 'bot');
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [activeConversation, sendMessage, service]);

  // Efectos iniciales
  useEffect(() => {
    loadConversations();
    
    // Simular conexión WebSocket
    const interval = setInterval(() => {
      setOnlineStatus(prev => !prev);
    }, 30000); // Cambiar estado cada 30 segundos

    return () => clearInterval(interval);
  }, [loadConversations]);

  return {
    // Estado
    conversations,
    activeConversation,
    messages,
    isLoading,
    isTyping,
    onlineStatus,
    messagesEndRef,
    
    // Acciones
    sendMessage,
    startConversation,
    selectConversation,
    sendTemplate,
    sendProductCatalog,
    checkStock,
    createOrder,
    loadConversations,
    loadMessages,
    
    // Utilidades
    processMessage,
    detectIntent,
    scrollToBottom
  };
};

export default useWhatsApp;
