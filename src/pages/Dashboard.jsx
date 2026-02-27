import { useState, useEffect } from 'react'
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Factory, 
  ArrowRight,
  ClipboardList,
  ChefHat,
  Settings,
  Users,
  Receipt,
  TrendingDown,
  UserPlus,
  Calendar,
  CheckCircle,
  ChevronDown
} from 'lucide-react'

import API_URL from '../config'

import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  console.log('Dashboard: Componente montado')
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    // Productos
    totalProductos: 0,
    valorInventario: 0,
    stockBajo: 0,
    
    // Recetas y Producción
    totalRecetas: 0,
    produccionesHoy: 0,
    
    // Ventas
    ventasHoy: 0,
    totalVentasHoy: 0,
    ventasMes: 0,
    totalVentasMes: 0,
    
    // Clientes
    totalClientes: 0,
    clientesNuevosMes: 0,
    
    // Ingredientes
    ingredientesStockBajo: 0,
    
    // Tasa de Cambio
    tasaCambio: 0,
  })
  const [ultimasVentas, setUltimasVentas] = useState([])
  const [productosStockBajo, setProductosStockBajo] = useState([])
  const [cargando, setCargando] = useState(true)
  const [ventasExpandido, setVentasExpandido] = useState(true)
  const [alertasExpandido, setAlertasExpandido] = useState(true)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setCargando(true)
    try {
      const [resProductos, resRecetas, resHistorial, resVentas, resClientes, resIngredientes, resTasaCambio] = await Promise.all([
        fetch(`${API_URL}/productos`),
        fetch(`${API_URL}/recetas`),
        fetch(`${API_URL}/produccion/historial`),
        fetch(`${API_URL}/ventas`),
        fetch(`${API_URL}/clientes`),
        fetch(`${API_URL}/ingredientes`),
        fetch(`${API_URL}/tasas-cambio/actual`)
      ])
      
      const productos = await resProductos.json()
      const recetas = await resRecetas.json()
      const historial = await resHistorial.json()
      const ventas = await resVentas.json()
      const clientes = await resClientes.json()
      const ingredientes = await resIngredientes.json()
      const tasaCambio = await resTasaCambio.json()

      // Cálculos de productos
      const valorTotal = productos.reduce((sum, p) => {
        const stock = parseFloat(p.stock || 0)
        if (!Number.isFinite(stock) || stock <= 0) return sum
        return sum + ((p.precio || 0) * stock)
      }, 0)
      const bajoStock = productos.filter(p => p.stock <= (p.stock_minimo || 10))
      
      // Producciones de hoy (robusto ante zona horaria/formatos)
      const ahora = new Date()
      const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0, 0)
      const finHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59, 999)
      const parseFecha = (v) => {
        if (!v) return null
        const d = new Date(v)
        if (!Number.isNaN(d.getTime())) return d
        // Fallback para strings sin zona horaria explícita.
        const dz = new Date(`${v}Z`)
        return Number.isNaN(dz.getTime()) ? null : dz
      }
      const produccionesHoy = historial.reduce((sum, h) => {
        const fechaProdRaw = h.fecha_elaboracion || h.fecha_proceso || h.fecha
        const fechaProd = parseFecha(fechaProdRaw)
        if (!fechaProd) return sum
        if (fechaProd < inicioHoy || fechaProd > finHoy) return sum
        const lotes = parseFloat(h.cantidad_lotes || h.cantidad_producida || 1)
        return sum + (Number.isFinite(lotes) ? lotes : 0)
      }, 0)

      // Ventas de hoy
      const ventasHoy = ventas.filter(v => {
        const fv = new Date(v.fecha)
        return !Number.isNaN(fv.getTime()) && fv >= inicioHoy && fv <= finHoy
      })
      const totalVentasHoy = ventasHoy.reduce((sum, v) => sum + parseFloat(v.total || 0), 0)

      // Ventas del mes
      const inicioMes = new Date()
      inicioMes.setDate(1)
      inicioMes.setHours(0, 0, 0, 0)
      
      const ventasMes = ventas.filter(v => new Date(v.fecha) >= inicioMes)
      const totalVentasMes = ventasMes.reduce((sum, v) => sum + parseFloat(v.total || 0), 0)

      // Clientes nuevos del mes
      const clientesNuevosMes = clientes.filter(c => {
        const fechaCreado = new Date(c.creado_en)
        return fechaCreado >= inicioMes
      }).length

      // Ingredientes con stock bajo
      const ingredientesBajos = ingredientes.filter(i => 
        i.stock <= (i.stock_minimo || 5)
      )

      // Obtener tasa de cambio
      const tasaValor = tasaCambio?.tasa || tasaCambio?.tasa_bcv || 0

      setStats({
        totalProductos: productos.length,
        valorInventario: valorTotal,
        stockBajo: bajoStock.length,
        totalRecetas: recetas.length,
        produccionesHoy,
        ventasHoy: ventasHoy.length,
        totalVentasHoy,
        ventasMes: ventasMes.length,
        totalVentasMes,
        totalClientes: clientes.length,
        clientesNuevosMes,
        ingredientesStockBajo: ingredientesBajos.length,
        tasaCambio: tasaValor
      })

      setProductosStockBajo(bajoStock.slice(0, 5))
      setUltimasVentas(ventas.slice(0, 5))
      
    } catch (error) {
      console.log('Error cargando datos:', error)
    } finally {
      setCargando(false)
    }
  }

  // Tarjetas de estadísticas
  const statCards = [
    { 
      title: 'Ventas Hoy', 
      value: `$${stats.totalVentasHoy.toFixed(2)}`, 
      subvalue: `${stats.ventasHoy} ventas`,
      icon: Receipt, 
      color: 'bg-green-100 text-green-600',
      hoverColor: 'hover:bg-green-200',
      ruta: '/ventas',
      descripcion: 'Ver ventas de hoy'
    },
    { 
      title: 'Ventas del Mes', 
      value: `$${stats.totalVentasMes.toFixed(2)}`, 
      subvalue: `${stats.ventasMes} ventas`,
      icon: DollarSign, 
      color: 'bg-emerald-100 text-emerald-600',
      hoverColor: 'hover:bg-emerald-200',
      ruta: '/ventas',
      descripcion: 'Ver historial'
    },
    { 
      title: 'Tasa de Cambio', 
      value: `${stats.tasaCambio.toFixed(2)} BS/$`, 
      subvalue: 'BCV - Vigente',
      icon: TrendingUp, 
      color: 'bg-blue-100 text-blue-600',
      hoverColor: 'hover:bg-blue-200',
      ruta: '/tasas-cambio',
      descripcion: 'Ver tasas de cambio'
    },
    { 
      title: 'Total Clientes', 
      value: stats.totalClientes, 
      subvalue: `+${stats.clientesNuevosMes} este mes`,
      icon: Users, 
      color: 'bg-purple-100 text-purple-600',
      hoverColor: 'hover:bg-purple-200',
      ruta: '/clientes',
      descripcion: 'Ver clientes'
    },
    { 
      title: 'Valor Inventario', 
      value: `$${stats.valorInventario.toFixed(2)}`, 
      subvalue: `${stats.totalProductos} productos`,
      icon: Package, 
      color: 'bg-orange-100 text-orange-600',
      hoverColor: 'hover:bg-orange-200',
      ruta: '/productos',
      descripcion: 'Ver inventario'
    },
    { 
      title: 'Stock Bajo', 
      value: stats.stockBajo, 
      subvalue: `${stats.ingredientesStockBajo} ingredientes`,
      icon: AlertTriangle, 
      color: 'bg-red-100 text-red-600',
      hoverColor: 'hover:bg-red-200',
      ruta: '/productos',
      descripcion: 'Ver productos críticos'
    }
  ]

  // Accesos directos
  const accesosRapidos = [
    {
      titulo: 'Nueva Venta',
      descripcion: 'Registrar venta y descontar stock',
      icon: ShoppingCart,
      color: 'bg-green-600',
      ruta: '/ventas'
    },
    {
      titulo: 'Gestión de Clientes',
      descripcion: 'Administrar clientes y ver historial',
      icon: Users,
      color: 'bg-blue-600',
      ruta: '/clientes'
    },
    {
      titulo: 'Producción',
      descripcion: 'Fabricar productos y gestionar recetas',
      icon: Factory,
      color: 'bg-orange-600',
      ruta: '/produccion'
    },
    {
      titulo: 'Inventario',
      descripcion: 'Ver productos y stock disponible',
      icon: Package,
      color: 'bg-purple-600',
      ruta: '/productos'
    },
    {
      titulo: 'Lista de Precios',
      descripcion: 'Ver catálogo completo de precios',
      icon: DollarSign,
      color: 'bg-indigo-600',
      ruta: '/lista-precios'
    }
  ]

  const navegarA = (ruta) => {
    navigate(ruta)
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-1">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Resumen general del sistema</p>
        </div>
        <button 
          onClick={() => cargarDatos()}
          className="text-sm text-orange-600 hover:text-orange-700 flex items-center"
        >
          <TrendingUp className="w-4 h-4 mr-1" />
          Actualizar datos
        </button>
      </div>
      
      {/* Estadísticas principales */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div 
              key={index} 
              onClick={() => navegarA(stat.ruta)}
              className={`${stat.color} ${stat.hoverColor} rounded-lg p-3 sm:p-5 cursor-pointer 
                         transition-all duration-200 transform hover:scale-105 
                         shadow-sm hover:shadow-md group`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs opacity-80 font-medium">{stat.title}</p>
                  <p className="text-lg sm:text-2xl font-bold mt-1">{stat.value}</p>
                  <p className="text-xs opacity-70 mt-0.5">{stat.subvalue}</p>
                </div>
                <Icon className="w-6 h-6 sm:w-8 sm:h-8 opacity-50" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Accesos rápidos */}
      <div>
        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center">
          <Settings className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Accesos Rápidos
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {accesosRapidos.map((acceso, index) => {
            const Icon = acceso.icon
            return (
              <button
                key={index}
                onClick={() => navegarA(acceso.ruta)}
                className="bg-white rounded-lg shadow-md p-3 sm:p-6 text-left 
                         hover:shadow-lg transition-all duration-200 
                         border-2 border-transparent hover:border-orange-200 group"
              >
                <div className={`${acceso.color} w-9 h-9 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-2 sm:mb-4`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-0.5">
                  {acceso.titulo}
                </h3>
                <p className="text-xs text-gray-500 hidden sm:block">{acceso.descripcion}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid de dos columnas: Últimas ventas y Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
        
        {/* Últimas Ventas - Acordeón */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <button
            onClick={() => setVentasExpandido(!ventasExpandido)}
            className="w-full p-3 sm:p-6 flex justify-between items-center hover:bg-gray-50 transition-colors"
          >
            <h2 className="text-lg font-bold flex items-center">
              <Receipt className="w-5 h-5 mr-2 text-green-600" />
              Últimas Ventas
            </h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  navegarA('/ventas')
                }}
                className="text-sm text-orange-600 hover:text-orange-700"
              >
                Ver todas →
              </button>
              <ChevronDown 
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                  ventasExpandido ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>
          
          {ventasExpandido && (
            <div className="p-3 sm:p-6 pt-0">
              {ultimasVentas.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No hay ventas registradas</p>
              ) : (
                <div className="space-y-3">
                  {ultimasVentas.map((venta) => (
                    <div key={venta.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          {venta.cliente_nombre_completo || venta.cliente_nombre}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(venta.fecha).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {venta.items && venta.items[0]?.producto_id && (
                            <span> • {venta.items.length} productos</span>
                          )}
                        </p>
                      </div>
                      <p className="font-bold text-green-600">
                        ${parseFloat(venta.total).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Alertas de Stock - Acordeón */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <button
            onClick={() => setAlertasExpandido(!alertasExpandido)}
            className="w-full p-3 sm:p-6 flex justify-between items-center hover:bg-gray-50 transition-colors"
          >
            <h2 className="text-lg font-bold flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
              Alertas de Stock
            </h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  navegarA('/productos')
                }}
                className="text-sm text-orange-600 hover:text-orange-700"
              >
                Gestionar →
              </button>
              <ChevronDown 
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                  alertasExpandido ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>
          
          {alertasExpandido && (
            <div className="p-3 sm:p-6 pt-0">
              {productosStockBajo.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-green-600">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span>Todo el stock está en niveles normales</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {productosStockBajo.map((producto) => (
                    <div key={producto.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                      <div>
                        <p className="font-medium text-gray-900">{producto.nombre}</p>
                        <p className="text-xs text-gray-500">{producto.categoria}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">{producto.stock} unidades</p>
                        <p className="text-xs text-gray-500">Mín: {producto.stock_minimo || 10}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Resumen de actividad */}
      <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
        <h2 className="text-base sm:text-lg font-bold mb-3 flex items-center">
          <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-orange-600" />
          Resumen de Actividad
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
          
          {/* Producción */}
          <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
            <div className="flex items-center">
              <Factory className="w-10 h-10 text-orange-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Producción Hoy</p>
                <p className="text-sm text-gray-500">{stats.produccionesHoy} lotes fabricados</p>
              </div>
            </div>
            <button 
              onClick={() => navegarA('/produccion')}
              className="text-orange-600 hover:text-orange-700 text-sm font-medium"
            >
              Ver →
            </button>
          </div>

          {/* Recetas */}
          <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center">
              <ChefHat className="w-10 h-10 text-purple-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Recetas Activas</p>
                <p className="text-sm text-gray-500">{stats.totalRecetas} recetas disponibles</p>
              </div>
            </div>
            <button 
              onClick={() => navegarA('/produccion')}
              className="text-purple-600 hover:text-purple-700 text-sm font-medium"
            >
              Ver →
            </button>
          </div>

          {/* Clientes */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <UserPlus className="w-10 h-10 text-blue-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Nuevos Clientes</p>
                <p className="text-sm text-gray-500">{stats.clientesNuevosMes} este mes</p>
              </div>
            </div>
            <button 
              onClick={() => navegarA('/clientes')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Ver →
            </button>
          </div>
        </div>
      </div>

      {/* Alerta global de stock bajo */}
      {(stats.stockBajo > 0 || stats.ingredientesStockBajo > 0) && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-red-800 font-bold">⚠️ Alerta de Inventario</h3>
              <p className="text-red-700 text-sm mt-1">
                {stats.stockBajo > 0 && `${stats.stockBajo} productos con stock crítico. `}
                {stats.ingredientesStockBajo > 0 && `${stats.ingredientesStockBajo} ingredientes con stock bajo.`}
              </p>
              <div className="flex gap-4 mt-2">
                {stats.stockBajo > 0 && (
                  <button 
                    onClick={() => navegarA('/productos')}
                    className="text-red-800 underline text-sm hover:text-red-900"
                  >
                    Ver productos →
                  </button>
                )}
                {stats.ingredientesStockBajo > 0 && (
                  <button 
                    onClick={() => navegarA('/ingredientes')}
                    className="text-red-800 underline text-sm hover:text-red-900"
                  >
                    Ver ingredientes →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
