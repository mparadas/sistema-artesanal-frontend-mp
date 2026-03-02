import React, { useState } from 'react';
import { 
  MessageCircle, Users, FileText, BarChart3, Settings, 
  Phone, MapPin, Clock, TrendingUp, Star, Search,
  Bell, LogOut, Menu, X, ChevronRight
} from 'lucide-react';
import ChatInterface from '../components/WhatsAppAgent/ChatInterface';
import ResponseTemplates from '../components/WhatsAppAgent/ResponseTemplates';
import AgentDashboard from '../components/WhatsAppAgent/AgentDashboard';

const WhatsAppAgent = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState(3);

  const menuItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: BarChart3,
      description: 'Métricas y estadísticas',
      color: 'text-blue-600'
    },
    {
      id: 'chat',
      name: 'Conversaciones',
      icon: MessageCircle,
      description: 'Chat con clientes',
      color: 'text-green-600',
      badge: 12
    },
    {
      id: 'templates',
      name: 'Plantillas',
      icon: FileText,
      description: 'Respuestas rápidas',
      color: 'text-purple-600'
    },
    {
      id: 'agents',
      name: 'Agentes',
      icon: Users,
      description: 'Gestión del equipo',
      color: 'text-orange-600'
    },
    {
      id: 'analytics',
      name: 'Análisis',
      icon: TrendingUp,
      description: 'Reportes detallados',
      color: 'text-indigo-600'
    },
    {
      id: 'settings',
      name: 'Configuración',
      icon: Settings,
      description: 'Ajustes del sistema',
      color: 'text-gray-600'
    }
  ];

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <AgentDashboard />;
      case 'chat':
        return <ChatInterface />;
      case 'templates':
        return <ResponseTemplates />;
      case 'agents':
        return <AgentDashboard />;
      default:
        return <AgentDashboard />;
    }
  };

  const currentMenuItem = menuItems.find(item => item.id === activeView);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 ${!sidebarOpen && 'justify-center'}`}>
              <MessageCircle className="w-8 h-8 text-green-600" />
              {sidebarOpen && (
                <div>
                  <h1 className="font-bold text-gray-800">AgroMAE</h1>
                  <p className="text-xs text-gray-500">WhatsApp Agent</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="relative">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-green-600' : item.color}`} />
                    {item.badge && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  {sidebarOpen && (
                    <div className="flex-1 text-left">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                  )}
                  {sidebarOpen && isActive && (
                    <ChevronRight className="w-4 h-4 text-green-600" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-200">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                A
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">Agente Principal</div>
                <div className="text-xs text-gray-500">En línea</div>
              </div>
              <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <LogOut className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                A
              </div>
              <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <LogOut className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                {currentMenuItem && <currentMenuItem.icon className={`w-6 h-6 ${currentMenuItem.color}`} />}
                {currentMenuItem?.name}
              </h2>
              <p className="text-gray-600 mt-1">{currentMenuItem?.description}</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-64"
                />
              </div>
              
              {/* Notifications */}
              <button className="relative p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Bell className="w-4 h-4 text-gray-600" />
                {notifications > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>

              {/* Quick stats */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">12 activos</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">2.3 min</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-gray-600">94%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-hidden">
          {renderActiveView()}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppAgent;
