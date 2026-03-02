import API_URL from '../config';

class WhatsAppService {
  constructor() {
    this.baseURL = API_URL;
    this.phoneId = process.env.REACT_APP_WHATSAPP_PHONE_ID || '123456789012345';
    this.accessToken = process.env.REACT_APP_WHATSAPP_ACCESS_TOKEN || '';
  }

  // Enviar mensaje a través de WhatsApp API
  async sendMessage(to, message, type = 'text') {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        to: to,
        type: type,
        [type]: type === 'text' ? { body: message } : message
      };

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${this.phoneId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        throw new Error(`WhatsApp API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }

  // Enviar mensaje de plantilla
  async sendTemplate(to, templateName, language = 'es', components = []) {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: language },
          components: components
        }
      };

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${this.phoneId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        throw new Error(`Template Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending template:', error);
      throw error;
    }
  }

  // Enviar mensaje con imagen
  async sendImage(to, imageUrl, caption = '') {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'image',
        image: {
          link: imageUrl,
          caption: caption
        }
      };

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${this.phoneId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      return await response.json();
    } catch (error) {
      console.error('Error sending image:', error);
      throw error;
    }
  }

  // Enviar mensaje con documento
  async sendDocument(to, documentUrl, filename, caption = '') {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'document',
        document: {
          link: documentUrl,
          filename: filename,
          caption: caption
        }
      };

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${this.phoneId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      return await response.json();
    } catch (error) {
      console.error('Error sending document:', error);
      throw error;
    }
  }

  // Enviar mensaje con ubicación
  async sendLocation(to, latitude, longitude, name, address) {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'location',
        location: {
          latitude: latitude,
          longitude: longitude,
          name: name,
          address: address
        }
      };

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${this.phoneId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      return await response.json();
    } catch (error) {
      console.error('Error sending location:', error);
      throw error;
    }
  }

  // Marcar mensaje como leído
  async markAsRead(messageId) {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId
      };

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${this.phoneId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      return await response.json();
    } catch (error) {
      console.error('Error marking as read:', error);
      throw error;
    }
  }

  // Obtener información del número de teléfono
  async getPhoneNumberInfo() {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${this.phoneId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      return await response.json();
    } catch (error) {
      console.error('Error getting phone number info:', error);
      throw error;
    }
  }

  // Verificar webhook (para backend)
  verifyWebhook(mode, token, challenge) {
    const verifyToken = process.env.REACT_APP_WEBHOOK_VERIFY_TOKEN || 'agromae-whatsapp-2026';
    
    if (mode === 'subscribe' && token === verifyToken) {
      return challenge;
    }
    
    throw new Error('Webhook verification failed');
  }

  // Procesar mensaje entrante (para backend)
  processIncomingMessage(body) {
    const messages = body.entry?.[0]?.changes?.[0]?.value?.messages || [];
    const contacts = body.entry?.[0]?.changes?.[0]?.value?.contacts || [];
    
    return messages.map((message, index) => ({
      messageId: message.id,
      from: message.from,
      timestamp: message.timestamp,
      type: message.type,
      content: message[message.type],
      contact: contacts[index],
      metadata: {
        phoneNumberId: body.entry?.[0]?.id,
        businessPhoneNumberId: body.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id,
        displayName: body.entry?.[0]?.changes?.[0]?.value?.metadata?.display_phone_number
      }
    }));
  }
}

// Servicios específicos para AgroMAE
export class AgroMAEWhatsAppService extends WhatsAppService {
  constructor() {
    super();
    this.agromaeAPI = API_URL;
  }

  // Enviar catálogo de productos
  async sendProductCatalog(to, category = null) {
    try {
      const response = await fetch(`${this.agromaeAPI}/productos`);
      const products = await response.json();
      
      let filteredProducts = products;
      if (category) {
        filteredProducts = products.filter(p => p.categoria === category);
      }

      let message = '🌟 *Nuestros Productos Disponibles*\n\n';
      filteredProducts.slice(0, 10).forEach((product, index) => {
        message += `${index + 1}. *${product.nombre}*\n`;
        message += `💰 $${product.precio}/kg\n`;
        message += `📦 Stock: ${product.stock} kg\n\n`;
      });

      if (filteredProducts.length > 10) {
        message += `...y ${filteredProducts.length - 10} productos más\n`;
      }

      return await this.sendMessage(to, message);
    } catch (error) {
      console.error('Error sending product catalog:', error);
      throw error;
    }
  }

  // Enviar precios actualizados
  async sendPriceList(to) {
    try {
      const response = await fetch(`${this.agromaeAPI}/productos`);
      const products = await response.json();
      
      const categorized = products.reduce((acc, product) => {
        if (!acc[product.categoria]) {
          acc[product.categoria] = [];
        }
        acc[product.categoria].push(product);
        return acc;
      }, {});

      let message = '💰 *Lista de Precios Actualizada*\n\n';
      
      Object.entries(categorized).forEach(([category, items]) => {
        message += `📦 *${category}*\n`;
        items.slice(0, 3).forEach(product => {
          message += `• ${product.nombre}: $${product.precio}/kg\n`;
        });
        message += '\n';
      });

      return await this.sendMessage(to, message);
    } catch (error) {
      console.error('Error sending price list:', error);
      throw error;
    }
  }

  // Verificar stock de producto
  async checkStock(to, productName) {
    try {
      const response = await fetch(`${this.agromaeAPI}/productos`);
      const products = await response.json();
      
      const product = products.find(p => 
        p.nombre.toLowerCase().includes(productName.toLowerCase())
      );

      if (product) {
        const message = `📦 *Información de Producto*\n\n` +
          `🥩 *${product.nombre}*\n` +
          `💰 Precio: $${product.precio}/kg\n` +
          `📦 Stock disponible: ${product.stock} kg\n` +
          `🏷️ Categoría: ${product.categoria}\n\n` +
          `¿Te gustaría reservar o hacer un pedido?`;
        
        return await this.sendMessage(to, message);
      } else {
        return await this.sendMessage(to, 
          `❌ No encontré el producto "${productName}".\n\n` +
          `¿Quieres ver nuestro catálogo completo?`
        );
      }
    } catch (error) {
      console.error('Error checking stock:', error);
      throw error;
    }
  }

  // Crear pedido desde WhatsApp
  async createOrderFromWhatsApp(customerPhone, items, deliveryInfo = {}) {
    try {
      const orderPayload = {
        cliente_telefono: customerPhone,
        items: items,
        tipo_venta: 'whatsapp',
        delivery_info: deliveryInfo,
        estado: 'pendiente'
      };

      const response = await fetch(`${this.agromaeAPI}/ventas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderPayload)
      });

      const order = await response.json();
      
      const confirmationMessage = `✅ *Pedido Recibido*\n\n` +
        `📋 N° de pedido: #${order.id}\n` +
        `🛒 Productos: ${items.length}\n` +
        `💰 Total: $${order.total}\n` +
        `🚚 Delivery: ${deliveryInfo.tipo || 'Retiro en tienda'}\n\n` +
        `Te contactaremos pronto para confirmar los detalles. 🌱`;

      return await this.sendMessage(customerPhone, confirmationMessage);
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  // Enviar actualización de delivery
  async sendDeliveryUpdate(to, orderId, status, estimatedTime = null) {
    try {
      const statusMessages = {
        'preparing': '👨‍🍳 Tu pedido está siendo preparado',
        'ready': '✅ Tu pedido está listo para enviar',
        'on_the_way': '🚚 Tu pedido está en camino',
        'delivered': '🎉 Tu pedido ha sido entregado'
      };

      const baseMessage = statusMessages[status] || `📦 Estado: ${status}`;
      let message = `📋 *Actualización Pedido #${orderId}*\n\n${baseMessage}`;

      if (estimatedTime) {
        message += `\n⏰ Tiempo estimado: ${estimatedTime}`;
      }

      if (status === 'on_the_way') {
        message += `\n\n📍 Puedes seguir tu pedido en tiempo real`;
      }

      return await this.sendMessage(to, message);
    } catch (error) {
      console.error('Error sending delivery update:', error);
      throw error;
    }
  }
}

export default WhatsAppService;
export { AgroMAEWhatsAppService };
