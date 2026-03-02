import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, Send, User, Bot, Clock, Check, CheckCheck, 
  Phone, MapPin, ShoppingCart, Package, Search, Filter,
  MoreVertical, Archive, Star, Trash2, RefreshCw
} from 'lucide-react';

const ChatInterface = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const messagesEndRef = useRef(null);

  // Datos de ejemplo para conversaciones
  useEffect(() => {
    const mockConversations = [
      {
        id: 1,
        customerName: 'María González',
        phone: '+58 424-1234567',
        lastMessage: '¿Tienen pollo fresco disponible?',
        timestamp: '10:30 AM',
        unread: 2,
        status: 'active',
        avatar: '👩',
        lastActivity: new Date(),
        tags: ['cliente_frecuente', 'interes_pollos'],
        orderHistory: 3,
        totalSpent: 156.50
      },
      {
        id: 2,
        customerName: 'Carlos Rodríguez',
        phone: '+58 412-9876543',
        lastMessage: 'Quiero hacer un pedido para mañana',
        timestamp: '9:45 AM',
        unread: 0,
        status: 'pending',
        avatar: '👨',
        lastActivity: new Date(Date.now() - 3600000),
        tags: ['nuevo_cliente'],
        orderHistory: 0,
        totalSpent: 0
      },
      {
        id: 3,
        customerName: 'Ana Martínez',
        phone: '+58 416-5551234',
        lastMessage: 'Gracias por el delivery, todo perfecto',
        timestamp: 'Ayer',
        unread: 0,
        status: 'resolved',
        avatar: '👩‍💼',
        lastActivity: new Date(Date.now() - 86400000),
        tags: ['cliente_satisfecho'],
        orderHistory: 8,
        totalSpent: 423.75
      }
    ];

    const mockMessages = [
      {
        id: 1,
        text: 'Hola, buen día. ¿Me pueden informar sobre los productos disponibles?',
        sender: 'customer',
        timestamp: '10:25 AM',
        status: 'read'
      },
      {
        id: 2,
        text: '¡Hola María! 👋 Bienvenida a AgroMAE 🌱\n\nHoy tenemos disponibles:\n🥩 Carnes frescas: Res, cerdo, pollo\n🧀 Quesos artesanales\n🍖 Embutidos naturales\n\n¿Qué productos te interesan?',
        sender: 'bot',
        timestamp: '10:26 AM',
        status: 'delivered',
        isTemplate: true
      },
      {
        id: 3,
        text: '¿Tienen pollo fresco disponible?',
        sender: 'customer',
        timestamp: '10:30 AM',
        status: 'read'
      }
    ];

    setConversations(mockConversations);
    setMessages(mockMessages);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const newMsg = {
      id: messages.length + 1,
      text: newMessage,
      sender: 'agent',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    };

    setMessages([...messages, newMsg]);
    setNewMessage('');
    
    // Simular respuesta del cliente
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const customerReply = {
          id: messages.length + 2,
          text: 'Perfecto, gracias por la información',
          sender: 'customer',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'read'
        };
        setMessages(prev => [...prev, customerReply]);
      }, 2000);
    }, 1000);
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || conv.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'resolved': return 'bg-gray-100 text-gray-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <MessageCircle className="w-3 h-3" />;
      case 'pending': return <Clock className="w-3 h-3" />;
      case 'resolved': return <Check className="w-3 h-3" />;
      default: return <MessageCircle className="w-3 h-3" />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Panel izquierdo - Lista de conversaciones */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-green-600" />
              WhatsApp Agent
            </h2>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <RefreshCw className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          
          {/* Barra de búsqueda */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar conversaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Filtros */}
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 px-3 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">Todas</option>
              <option value="active">Activas</option>
              <option value="pending">Pendientes</option>
              <option value="resolved">Resueltas</option>
            </select>
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Lista de conversaciones */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => setSelectedChat(conversation)}
              className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                selectedChat?.id === conversation.id ? 'bg-green-50 border-l-4 border-l-green-500' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{conversation.avatar}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{conversation.customerName}</h3>
                    <span className="text-xs text-gray-500">{conversation.timestamp}</span>
                  </div>
                  <p className="text-sm text-gray-600 truncate mb-2">{conversation.lastMessage}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(conversation.status)}`}>
                        {getStatusIcon(conversation.status)}
                        {conversation.status}
                      </span>
                      {conversation.unread > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {conversation.unread}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <ShoppingCart className="w-3 h-3" />
                      <span>{conversation.orderHistory}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Panel derecho - Chat */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Header del chat */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{selectedChat.avatar}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedChat.customerName}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-3 h-3" />
                      <span>{selectedChat.phone}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedChat.status)}`}>
                        {getStatusIcon(selectedChat.status)}
                        {selectedChat.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Star className="w-4 h-4 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Archive className="w-4 h-4 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreVertical className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'agent' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender === 'agent'
                        ? 'bg-green-600 text-white'
                        : message.isTemplate
                        ? 'bg-blue-50 border border-blue-200 text-blue-900'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {message.isTemplate && (
                      <div className="flex items-center gap-2 mb-1">
                        <Bot className="w-3 h-3" />
                        <span className="text-xs font-medium">Respuesta automática</span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-line">{message.text}</p>
                    <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${
                      message.sender === 'agent' ? 'text-green-100' : 'text-gray-500'
                    }`}>
                      <span>{message.timestamp}</span>
                      {message.sender === 'agent' && (
                        message.status === 'read' ? <CheckCheck className="w-3 h-3" /> :
                        message.status === 'delivered' ? <CheckCheck className="w-3 h-3 opacity-60" /> :
                        <Check className="w-3 h-3 opacity-40" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <span className="text-xs text-gray-500">Escribiendo...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input de mensaje */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={sendMessage}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Enviar
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Selecciona una conversación</h3>
              <p className="text-gray-500">Elige un chat del panel izquierdo para comenzar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
