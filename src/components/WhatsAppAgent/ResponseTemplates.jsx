import React, { useState } from 'react';
import { 
  MessageSquare, Clock, Package, DollarSign, MapPin, 
  Phone, ShoppingCart, Star, ThumbsUp, Send, Copy,
  Edit, Trash2, Plus, Search, Filter
} from 'lucide-react';

const ResponseTemplates = () => {
  const [templates, setTemplates] = useState([
    {
      id: 1,
      name: 'Bienvenida General',
      category: 'saludos',
      content: '¡Hola {nombre}! 👋 Bienvenido a AgroMAE 🌱\n\n¿En qué puedo ayudarte hoy?\n\n🥩 Carnes frescas\n🧀 Quesos artesanales\n🍖 Embutidos naturales',
      variables: ['nombre'],
      usage: 45,
      rating: 4.8,
      isFavorite: true
    },
    {
      id: 2,
      name: 'Consulta de Stock',
      category: 'productos',
      content: 'Verificando nuestro stock...\n\n✅ {producto}: {stock} kg disponibles\n💰 Precio: ${precio}/kg\n\n¿Te gustaría reservar?',
      variables: ['producto', 'stock', 'precio'],
      usage: 32,
      rating: 4.6,
      isFavorite: true
    },
    {
      id: 3,
      name: 'Horario de Atención',
      category: 'informacion',
      content: '🕐 Nuestro horario de atención:\n\nLunes a Sábado: 8:00 AM - 6:00 PM\nDomingos: 8:00 AM - 12:00 PM\n\n📞 Teléfono: +58 424-1234567\n📍 Dirección: Calle Principal #123',
      variables: [],
      usage: 28,
      rating: 4.9,
      isFavorite: false
    },
    {
      id: 4,
      name: 'Confirmación de Pedido',
      category: 'pedidos',
      content: '✅ Pedido confirmado\n\n📦 Productos: {productos}\n💰 Total: ${total}\n🚚 Delivery: {tiempo_entrega}\n\n📍 Dirección: {direccion}\n\nGracias por tu compra 🌱',
      variables: ['productos', 'total', 'tiempo_entrega', 'direccion'],
      usage: 18,
      rating: 4.7,
      isFavorite: true
    },
    {
      id: 5,
      name: 'Seguimiento de Delivery',
      category: 'pedidos',
      content: '🚚 Tu pedido está en camino\n\n📍 Estado: {estado}\n⏰ Tiempo estimado: {tiempo}\n📍 Ubicación actual: {ubicacion}\n\n📞 Conductor: {conductor}',
      variables: ['estado', 'tiempo', 'ubicacion', 'conductor'],
      usage: 15,
      rating: 4.5,
      isFavorite: false
    },
    {
      id: 6,
      name: 'Promoción del Día',
      category: 'promociones',
      content: '🔥 OFERTA ESPECIAL 🔥\n\n{producto}\n💰 Antes: ${precio_normal}\n💰 Ahora: ${precio_oferta}\n⏰ Válido hasta: {fecha_limite}\n\n¡Aprovecha! 🌱',
      variables: ['producto', 'precio_normal', 'precio_oferta', 'fecha_limite'],
      usage: 12,
      rating: 4.4,
      isFavorite: false
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const categories = [
    { value: 'all', label: 'Todas', icon: MessageSquare },
    { value: 'saludos', label: 'Saludos', icon: MessageSquare },
    { value: 'productos', label: 'Productos', icon: Package },
    { value: 'informacion', label: 'Información', icon: Clock },
    { value: 'pedidos', label: 'Pedidos', icon: ShoppingCart },
    { value: 'promociones', label: 'Promociones', icon: DollarSign }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.icon : MessageSquare;
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'saludos': return 'bg-blue-100 text-blue-700';
      case 'productos': return 'bg-green-100 text-green-700';
      case 'informacion': return 'bg-gray-100 text-gray-700';
      case 'pedidos': return 'bg-orange-100 text-orange-700';
      case 'promociones': return 'bg-red-100 text-red-700';
      default: return 'bg-purple-100 text-purple-700';
    }
  };

  const useTemplate = (template) => {
    // Aquí se enviaría la plantilla al chat activo
    console.log('Usando plantilla:', template);
  };

  const duplicateTemplate = (template) => {
    const newTemplate = {
      ...template,
      id: templates.length + 1,
      name: `${template.name} (copia)`,
      usage: 0,
      isFavorite: false
    };
    setTemplates([...templates, newTemplate]);
  };

  const deleteTemplate = (templateId) => {
    setTemplates(templates.filter(t => t.id !== templateId));
  };

  const toggleFavorite = (templateId) => {
    setTemplates(templates.map(t => 
      t.id === templateId ? { ...t, isFavorite: !t.isFavorite } : t
    ));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-green-600" />
            Plantillas de Respuesta
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nueva Plantilla
          </button>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar plantillas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Lista de plantillas */}
      <div className="p-6">
        <div className="grid gap-4">
          {filteredTemplates.map((template) => {
            const CategoryIcon = getCategoryIcon(template.category);
            return (
              <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>
                        <CategoryIcon className="w-3 h-3" />
                        {categories.find(c => c.value === template.category)?.label}
                      </span>
                      {template.isFavorite && (
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      )}
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                        {template.content}
                      </pre>
                    </div>
                    {template.variables.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {template.variables.map(variable => (
                          <span key={variable} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            {variable}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    <button
                      onClick={() => useTemplate(template)}
                      className="p-2 hover:bg-green-50 rounded-lg transition-colors group"
                      title="Usar plantilla"
                    >
                      <Send className="w-4 h-4 text-gray-600 group-hover:text-green-600" />
                    </button>
                    <button
                      onClick={() => duplicateTemplate(template)}
                      className="p-2 hover:bg-blue-50 rounded-lg transition-colors group"
                      title="Duplicar"
                    >
                      <Copy className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
                    </button>
                    <button
                      onClick={() => setEditingTemplate(template)}
                      className="p-2 hover:bg-yellow-50 rounded-lg transition-colors group"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4 text-gray-600 group-hover:text-yellow-600" />
                    </button>
                    <button
                      onClick={() => toggleFavorite(template.id)}
                      className="p-2 hover:bg-yellow-50 rounded-lg transition-colors group"
                      title={template.isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                    >
                      <Star className={`w-4 h-4 ${template.isFavorite ? 'text-yellow-500 fill-current' : 'text-gray-600 group-hover:text-yellow-500'}`} />
                    </button>
                    <button
                      onClick={() => deleteTemplate(template.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4 text-gray-600 group-hover:text-red-600" />
                    </button>
                  </div>
                </div>
                
                {/* Estadísticas */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {template.usage} usos
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" />
                      {template.rating} ⭐
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No se encontraron plantillas</h3>
            <p className="text-gray-500">Intenta ajustar los filtros o crea una nueva plantilla</p>
          </div>
        )}
      </div>

      {/* Modal para crear/editar plantilla */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
            </h3>
            {/* Aquí iría el formulario para crear/editar plantillas */}
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResponseTemplates;
