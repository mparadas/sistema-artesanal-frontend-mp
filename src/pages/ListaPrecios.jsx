import { useState, useEffect } from 'react'
import { ArrowLeft, Search, Package, DollarSign, Filter, Printer, Download } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import API_URL from '../config'

const imagenFallback = 'https://placehold.co/320x220/F97316/FFFFFF?text=Producto'

// Función para obtener icono según tipo de producto
const obtenerIconoProducto = (producto) => {
  const nombre = String(producto?.nombre || '').toLowerCase()
  const categoria = String(producto?.categoria || '').toLowerCase()
  const animal = String(producto?.animal_origen || '').toLowerCase()
  
  // Pollo
  if (nombre.includes('pollo') || nombre.includes('chicken') || animal.includes('pollo')) {
    return '🐔'
  }
  
  // Cerdo/cochino
  if (nombre.includes('cerdo') || nombre.includes('cochino') || nombre.includes('puerco') || 
      nombre.includes('chancho') || nombre.includes('pork') || animal.includes('cerdo')) {
    return '🐷'
  }
  
  // Res/vaca/carne de res
  if (nombre.includes('res') || nombre.includes('vaca') || nombre.includes('carne') || 
      nombre.includes('beef') || animal.includes('res')) {
    return '🐄'
  }
  
  // Cordero/oveja
  if (nombre.includes('cordero') || nombre.includes('oveja') || nombre.includes('lamb') || 
      animal.includes('cordero') || animal.includes('oveja')) {
    return '🐑'
  }
  
  // Queso
  if (nombre.includes('queso') || nombre.includes('cheese') || categoria.includes('queso')) {
    return '🧀'
  }
  
  // Chorizo
  if (nombre.includes('chorizo') || categoria.includes('chorizo')) {
    return '🥩'
  }
  
  // Hamburguesa
  if (nombre.includes('hamburguesa') || nombre.includes('hamburgues') || categoria.includes('hamburgues')) {
    return '🥩'
  }
  
  // Salchicha
  if (nombre.includes('salchicha') || categoria.includes('salchicha')) {
    return '🥩'
  }
  
  // Default genérico
  return '📦'
}

export default function ListaPrecios() {
  const navigate = useNavigate()
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todas')

  // Función para generar lista de precios en formato proforma
  const generarListaPrecios = () => {
    const productosParaImprimir = productosFiltrados
    const fechaActual = new Date().toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
    
    // Crear contenido HTML para impresión
    const contenidoHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Lista de Precios - ${fechaActual}</title>
        <style>
          @page {
            margin: 1cm;
            size: A4;
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            margin: 0;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #f97316;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #f97316;
            font-size: 24px;
            margin: 0;
            font-weight: bold;
          }
          .header p {
            margin: 5px 0 0 0;
            color: #666;
            font-size: 14px;
          }
          .animal-section {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          .animal-header {
            background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%);
            padding: 12px 15px;
            border-radius: 8px;
            margin-bottom: 15px;
            border-left: 4px solid #f97316;
          }
          .animal-title {
            font-size: 16px;
            font-weight: bold;
            color: #9a3412;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .animal-count {
            background: #f97316;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: normal;
          }
          .product-row {
            display: flex;
            align-items: flex-start;
            padding: 12px 0;
            border-bottom: 1px solid #e5e7eb;
            page-break-inside: avoid;
          }
          .product-row:last-child {
            border-bottom: none;
          }
          .product-image {
            width: 50px;
            height: 50px;
            border-radius: 8px;
            object-fit: cover;
            border: 1px solid #e5e7eb;
            margin-right: 15px;
            flex-shrink: 0;
          }
          .product-info {
            flex: 1;
            min-width: 0;
          }
          .product-name {
            font-weight: bold;
            font-size: 14px;
            color: #1f2937;
            margin: 0 0 5px 0;
            line-height: 1.2;
          }
          .product-details {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-bottom: 5px;
          }
          .tag {
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 500;
          }
          .tag-categoria {
            background: #dbeafe;
            color: #1e40af;
          }
          .tag-animal {
            background: #dcfce7;
            color: #166534;
          }
          .tag-tipo {
            background: #f3e8ff;
            color: #7c3aed;
          }
          .product-meta {
            font-size: 10px;
            color: #6b7280;
            margin-top: 3px;
          }
          .product-price {
            text-align: right;
            flex-shrink: 0;
            min-width: 80px;
            margin-left: 15px;
          }
          .price-label {
            font-size: 10px;
            color: #059669;
            font-weight: 500;
            margin-bottom: 2px;
          }
          .price-value {
            font-size: 16px;
            font-weight: bold;
            color: #059669;
            line-height: 1;
          }
          .price-canal {
            font-size: 9px;
            color: #6b7280;
            margin-top: 2px;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 11px;
          }
          .stats {
            background: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-around;
            text-align: center;
          }
          .stat-item {
            flex: 1;
          }
          .stat-value {
            font-size: 18px;
            font-weight: bold;
            color: #1f2937;
          }
          .stat-label {
            font-size: 11px;
            color: #6b7280;
            margin-top: 2px;
          }
          @media print {
            body { margin: 0; padding: 10px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📋 LISTA DE PRECIOS</h1>
          <p>Sistema Artesanal - Catálogo Completo de Productos</p>
          <p>Fecha: ${fechaActual}</p>
        </div>

        <div class="stats">
          <div class="stat-item">
            <div class="stat-value">${productosParaImprimir.length}</div>
            <div class="stat-label">Total Productos</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">$${productosParaImprimir.length > 0 ? 
              Math.min(...productosParaImprimir.map(p => parseFloat(p.precio) || 0)).toFixed(2) : '0.00'}</div>
            <div class="stat-label">Precio Mínimo</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">$${productosParaImprimir.length > 0 ? 
              Math.max(...productosParaImprimir.map(p => parseFloat(p.precio) || 0)).toFixed(2) : '0.00'}</div>
            <div class="stat-label">Precio Máximo</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${categoriasDisponibles.length - 1}</div>
            <div class="stat-label">Categorías</div>
          </div>
        </div>

        ${Object.entries(productosPorAnimal).map(([animal, productosAnimal]) => `
          <div class="animal-section">
            <div class="animal-header">
              <h3 class="animal-title">
                <span>${obtenerIconoProducto({ animal_origen: animal })}</span>
                ${animal.toUpperCase()}
                <span class="animal-count">${productosAnimal.length} productos</span>
              </h3>
            </div>
            ${productosAnimal.map(producto => `
              <div class="product-row">
                <img src="${producto.imagen_url || imagenFallback}" alt="${producto.nombre}" class="product-image" />
                <div class="product-info">
                  <h4 class="product-name">${producto.nombre}</h4>
                  <div class="product-details">
                    ${producto.categoria ? `<span class="tag tag-categoria">${producto.categoria}</span>` : ''}
                    ${producto.animal_origen ? `<span class="tag tag-animal">${producto.animal_origen}</span>` : ''}
                    ${producto.tipo_producto === 'corte' ? '<span class="tag tag-tipo">Corte</span>' : ''}
                  </div>
                </div>
                <div class="product-price">
                  <div class="price-label">PRECIO</div>
                  <div class="price-value">$${parseFloat(producto.precio || 0).toFixed(2)}</div>
                  ${producto.tipo_producto === 'corte' && producto.precio_canal ? 
                    `<div class="price-canal">Canal: $${parseFloat(producto.precio_canal).toFixed(2)}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        `).join('')}

        <div class="footer">
          <p>📄 Lista de Precios generada el ${fechaActual}</p>
          <p>Sistema de Gestión Artesanal - Todos los derechos reservados</p>
        </div>
      </body>
      </html>
    `
    
    // Abrir nueva ventana para impresión
    const ventanaImpresion = window.open('', '_blank')
    ventanaImpresion.document.write(contenidoHTML)
    ventanaImpresion.document.close()
    
    // Esperar a que cargue el contenido y luego mostrar diálogo de impresión
    ventanaImpresion.onload = () => {
      setTimeout(() => {
        ventanaImpresion.print()
      }, 500)
    }
  }

  const cargarProductos = async () => {
    try {
      setCargando(true)
      const response = await fetch(`${API_URL}/productos`)
      const data = await response.json()
      
      if (!response.ok) {
        console.error('Error al cargar productos:', data?.error || 'Error desconocido')
        return
      }
      
      // Ordenar productos por animal_origen y luego por nombre
      const productosOrdenados = (Array.isArray(data) ? data : []).sort((a, b) => {
        const aAnimal = String(a?.animal_origen || '').toLowerCase();
        const bAnimal = String(b?.animal_origen || '').toLowerCase();
        
        if (aAnimal !== bAnimal) {
          return aAnimal.localeCompare(bAnimal, 'es');
        }
        
        return String(a?.nombre || '').localeCompare(String(b?.nombre || ''), 'es', { sensitivity: 'base' });
      })
      
      setProductos(productosOrdenados)
    } catch (error) {
      console.error('Error de conexión:', error)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarProductos()
  }, [])

  // Obtener categorías únicas
  const categoriasDisponibles = ['todas', ...Array.from(new Set(productos.map(p => p.categoria || 'Sin categoría'))).sort()]

  // Filtrar productos
  const productosFiltrados = productos.filter(producto => {
    const coincideBusqueda = busqueda === '' || 
      producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
      producto.categoria.toLowerCase().includes(busqueda.toLowerCase())
    const coincideCategoria = categoriaSeleccionada === 'todas' || producto.categoria === categoriaSeleccionada
    return coincideBusqueda && coincideCategoria
  })

  // Agrupar productos por animal_origen
  const productosPorAnimal = productosFiltrados.reduce((acc, producto) => {
    const animal = producto.animal_origen || 'Sin origen'
    if (!acc[animal]) {
      acc[animal] = []
    }
    acc[animal].push(producto)
    return acc
  }, {})

  return (
    <div className="space-y-3 p-1 sm:p-2 sm:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <div>
            <h1 className="text-lg sm:text-xl sm:text-2xl font-bold text-gray-800">Lista de Precios</h1>
            <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Catálogo completo de productos y precios</p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => navigate('/')}
            className="bg-orange-600 text-white px-2 sm:px-3 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
            title="Volver al Dashboard"
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            Volver
          </button>
          <button
            onClick={cargarProductos}
            className="bg-gray-700 text-white px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-800 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
            title="Actualizar lista de precios"
          >
            <Package className="w-3 h-3 sm:w-4 sm:h-4" />
            Actualizar
          </button>
          <button
            onClick={generarListaPrecios}
            className="bg-indigo-600 text-white px-2 sm:px-3 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
            title="Generar lista de precios para imprimir"
          >
            <Printer className="w-3 h-3 sm:w-4 sm:h-4" />
            Imprimir
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-100 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar producto..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={categoriaSeleccionada}
              onChange={(e) => setCategoriaSeleccionada(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {categoriasDisponibles.map(categoria => (
                <option key={categoria} value={categoria}>
                  {categoria === 'todas' ? 'Todas las categorías' : categoria}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="bg-white rounded-lg border border-gray-100 p-3 sm:p-4">
        <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2 sm:gap-4 sm:gap-6">
          <div className="flex items-center gap-2 sm:gap-2">
            <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="font-bold text-gray-800 text-sm sm:text-base">{productosFiltrados.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-2">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            <div>
              <p className="text-xs text-gray-500">Rango</p>
              <p className="font-bold text-gray-800 text-xs sm:text-sm">
                ${productosFiltrados.length > 0 ? 
                  Math.min(...productosFiltrados.map(p => parseFloat(p.precio) || 0)).toFixed(2) : '0.00'} - $
                {productosFiltrados.length > 0 ? 
                  Math.max(...productosFiltrados.map(p => parseFloat(p.precio) || 0)).toFixed(2) : '0.00'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-2">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            <div>
              <p className="text-xs text-gray-500">Cats</p>
              <p className="font-bold text-gray-800 text-sm sm:text-base">{categoriasDisponibles.length - 1}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de productos por animal */}
      {cargando ? (
        <div className="bg-white rounded-lg border border-gray-100 p-8 text-center text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          Cargando lista de precios...
        </div>
      ) : productosFiltrados.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-100 p-8 text-center text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No se encontraron productos</p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {Object.entries(productosPorAnimal).map(([animal, productosAnimal]) => (
            <div key={animal} className="bg-white rounded-lg border border-gray-100 overflow-hidden">
              {/* Header del animal */}
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-3 sm:px-4 py-2 sm:py-3 border-b border-orange-200">
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl">{obtenerIconoProducto({ animal_origen: animal })}</span>
                  <h3 className="text-base sm:text-lg font-bold text-gray-800">{animal}</h3>
                  <span className="bg-orange-200 text-orange-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs font-medium">
                    {productosAnimal.length} productos
                  </span>
                </div>
              </div>

              {/* Lista de productos */}
              <div className="divide-y divide-gray-100">
                {productosAnimal.map((producto) => (
                  <div key={producto.id} className="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                    {/* Layout optimizado para móvil */}
                    <div className="flex gap-3 sm:gap-4">
                      {/* Imagen del producto - tamaño optimizado */}
                      <div className="flex-shrink-0">
                        <img
                          src={producto.imagen_url || imagenFallback}
                          alt={producto.nombre}
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover border border-gray-200"
                          onError={(e) => { e.currentTarget.src = imagenFallback }}
                        />
                      </div>

                      {/* Contenido principal - todo el espacio disponible */}
                      <div className="flex-1 min-w-0">
                        {/* Header: Nombre + Precio */}
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base leading-tight">
                            {producto.nombre}
                          </h4>
                          <div className="bg-green-50 text-green-800 px-2 py-1 rounded-lg shrink-0">
                            <p className="text-xs text-green-600 font-medium">Precio</p>
                            <p className="text-base sm:text-lg font-bold text-green-800 leading-none">
                              ${parseFloat(producto.precio || 0).toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {/* Etapas consolidadas */}
                        <div className="flex flex-wrap items-center gap-1 mb-2">
                          {producto.categoria && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                              {producto.categoria}
                            </span>
                          )}
                          {producto.animal_origen && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-800">
                              {producto.animal_origen}
                            </span>
                          )}
                          {producto.tipo_producto === 'corte' && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-purple-100 text-purple-800">
                              Corte
                            </span>
                          )}
                        </div>
                        
                        {/* Información consolidada en una línea */}
                        <div className="text-xs text-gray-600 space-y-1">
                          <div className="flex flex-wrap gap-3 sm:gap-4">
                            <span><span className="font-medium">Stock:</span> {parseFloat(producto.stock || 0).toFixed(3)} kg</span>
                            {producto.cantidad_piezas && (
                              <span><span className="font-medium">Piezas:</span> {producto.cantidad_piezas}</span>
                            )}
                            <span><span className="font-medium">Peso:</span> {parseFloat(producto.peso_total || 0).toFixed(3)} kg</span>
                            {producto.tipo_producto === 'corte' && producto.precio_canal && (
                              <span><span className="font-medium">Canal:</span> ${parseFloat(producto.precio_canal).toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
