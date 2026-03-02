import React, { useState, useEffect } from 'react';
import { 
  Users, MessageCircle, Clock, TrendingUp, Star, Phone,
  ShoppingCart, Package, DollarSign, Activity, AlertCircle,
  CheckCircle, XCircle, BarChart3, PieChart, Calendar,
  Filter, Download, RefreshCw, Settings, Bell
} from 'lucide-react';

const AgentDashboard = () => {
  const [metrics, setMetrics] = useState({
    totalConversations: 156,
    activeConversations: 12,
    averageResponseTime: 2.3,
    satisfactionRate: 94.2,
    totalMessages: 1247,
    conversionRate: 28.5,
    todayOrders: 8,
    revenueToday: 234.50
  });

  const [agents, setAgents] = useState([
    {
      id: 1,
      name: 'Ana Martínez',
      status: 'online',
      activeChats: 3,
      totalChats: 45,
      averageResponseTime: 1.8,
      satisfaction: 4.8,
      avatar: '👩‍💼',
      department: 'Ventas'
    },
    {
      id: 2,
      name: 'Carlos Rodríguez',
      status: 'online',
      activeChats: 2,
      totalChats: 38,
      averageResponseTime: 2.1,
      satisfaction: 4.6,
      avatar: '👨‍💼',
      department: 'Soporte'
    },
    {
      id: 3,
      name: 'María González',
      status: 'away',
      activeChats: 0,
      totalChats: 52,
      averageResponseTime: 2.5,
      satisfaction: 4.9,
      avatar: '👩‍💻',
      department: 'Ventas'
    }
  ]);

  const [recentActivity, setRecentActivity] = useState([
    {
      id: 1,
      type: 'new_conversation',
      customer: 'Juan Pérez',
      agent: 'Ana Martínez',
      timestamp: '10:30 AM',
      message: 'Inició conversación sobre productos',
      status: 'active'
    },
    {
      id: 2,
      type: 'order_completed',
      customer: 'María López',
      agent: 'Carlos Rodríguez',
      timestamp: '10:15 AM',
      message: 'Completó pedido por $45.50',
      status: 'completed'
    },
    {
      id: 3,
      type: 'high_rating',
      customer: 'Roberto Díaz',
      agent: 'Ana Martínez',
      timestamp: '9:45 AM',
      message: 'Calificó servicio con 5 estrellas',
      status: 'success'
    },
    {
      id: 4,
      type: 'escalation',
      customer: 'Laura Sánchez',
      agent: 'María González',
      timestamp: '9:30 AM',
      message: 'Requiere atención de supervisor',
      status: 'warning'
    }
  ]);

  const [timeRange, setTimeRange] = useState('today');

  useEffect(() => {
    // Simular actualización de métricas
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        totalConversations: prev.totalConversations + Math.floor(Math.random() * 3),
        activeConversations: Math.max(0, prev.activeConversations + Math.floor(Math.random() * 5) - 2)
      }));
    }, 30000); // Actualizar cada 30 segundos

    return () => clearInterval(interval);
  }, []);

  const MetricCard = ({ title, value, icon: Icon, change, color = 'blue' }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      green: 'bg-green-50 text-green-700 border-green-200',
      orange: 'bg-orange-50 text-orange-700 border-orange-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200'
    };

    return (
      <div className={`border rounded-lg p-4 ${colorClasses[color]}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium opacity-80">{title}</span>
          <Icon className="w-4 h-4" />
        </div>
        <div className="text-2xl font-bold mb-1">{value}</div>
        {change && (
          <div className={`text-xs flex items-center gap-1 ${
            change > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {change > 0 ? '↑' : '↓'} {Math.abs(change)}%
          </div>
        )}
      </div>
    );
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'new_conversation': return <MessageCircle className="w-4 h-4" />;
      case 'order_completed': return <CheckCircle className="w-4 h-4" />;
      case 'high_rating': return <Star className="w-4 h-4" />;
      case 'escalation': return <AlertCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (status) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'success': return 'bg-green-100 text-green-700';
      case 'warning': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getAgentStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <MessageCircle className="w-8 h-8 text-green-600" />
              Dashboard de Agentes WhatsApp
            </h1>
            <p className="text-gray-600 mt-1">Monitoreo y gestión del equipo de atención</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="today">Hoy</option>
              <option value="week">Esta semana</option>
              <option value="month">Este mes</option>
            </select>
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4 text-gray-600" />
            </button>
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4 text-gray-600" />
            </button>
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <RefreshCw className="w-4 h-4 text-gray-600" />
            </button>
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Settings className="w-4 h-4 text-gray-600" />
            </button>
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors relative">
              <Bell className="w-4 h-4 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Conversaciones Totales"
          value={metrics.totalConversations}
          icon={MessageCircle}
          change={12.5}
          color="blue"
        />
        <MetricCard
          title="Conversaciones Activas"
          value={metrics.activeConversations}
          icon={Users}
          change={8.3}
          color="green"
        />
        <MetricCard
          title="Tiempo Respuesta (min)"
          value={metrics.averageResponseTime}
          icon={Clock}
          change={-15.2}
          color="orange"
        />
        <MetricCard
          title="Tasa Satisfacción (%)"
          value={metrics.satisfactionRate}
          icon={Star}
          change={5.1}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agentes en línea */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              Agentes en Línea
            </h2>
            <div className="space-y-4">
              {agents.map((agent) => (
                <div key={agent.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="text-2xl">{agent.avatar}</div>
                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getAgentStatusColor(agent.status)}`}></div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                        <p className="text-sm text-gray-600">{agent.department}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MessageCircle className="w-4 h-4" />
                        <span>{agent.activeChats} activas</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        <span>{agent.satisfaction}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Total chats:</span>
                      <span className="ml-2 font-medium">{agent.totalChats}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Respuesta:</span>
                      <span className="ml-2 font-medium">{agent.averageResponseTime} min</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Estado:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        agent.status === 'online' ? 'bg-green-100 text-green-700' :
                        agent.status === 'away' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {agent.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actividad reciente */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-600" />
            Actividad Reciente
          </h2>
          <div className="space-y-3">
            {recentActivity.map((activity) => {
              const ActivityIcon = getActivityIcon(activity.type);
              return (
                <div key={activity.id} className="flex items-start gap-3 p-3 border border-gray-100 rounded-lg">
                  <div className={`p-2 rounded-lg ${getActivityColor(activity.status)}`}>
                    <ActivityIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 font-medium">{activity.message}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span>{activity.customer}</span>
                      <span>•</span>
                      <span>{activity.agent}</span>
                      <span>•</span>
                      <span>{activity.timestamp}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Métricas adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <MetricCard
          title="Mensajes Totales"
          value={metrics.totalMessages}
          icon={MessageCircle}
          change={18.7}
          color="blue"
        />
        <MetricCard
          title="Tasa Conversión (%)"
          value={metrics.conversionRate}
          icon={TrendingUp}
          change={22.3}
          color="green"
        />
        <MetricCard
          title="Pedidos Hoy"
          value={metrics.todayOrders}
          icon={ShoppingCart}
          change={15.8}
          color="orange"
        />
        <MetricCard
          title="Ingresos Hoy ($)"
          value={metrics.revenueToday}
          icon={DollarSign}
          change={31.2}
          color="purple"
        />
      </div>
    </div>
  );
};

export default AgentDashboard;
