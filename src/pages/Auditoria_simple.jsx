import { useState, useEffect } from 'react'
import { Search, Filter, Eye, Calendar, User, Database, ChevronDown, ChevronUp, AlertCircle, CheckCircle, XCircle, Plus, Edit, Trash2, Package, Users, ShoppingCart, Factory, ClipboardList, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import API_URL from '../config'

const TIPOS_MOVIMIENTO = {
  INSERT: { label: 'Creación', color: 'bg-green-100 text-green-700', icon: Plus },
  UPDATE: { label: 'Actualización', color: 'bg-blue-100 text-blue-700', icon: Edit },
  DELETE: { label: 'Eliminación', color: 'bg-red-100 text-red-700', icon: Trash2 }
}

const MODULOS = {
  productos: { label: 'Productos', color: 'bg-purple-100 text-purple-700', icon: Package },
  ingredientes: { label: 'Ingredientes', color: 'bg-orange-100 text-orange-700', icon: Package },
  clientes: { label: 'Clientes', color: 'bg-blue-100 text-blue-700', icon: Users },
  ventas: { label: 'Ventas', color: 'bg-green-100 text-green-700', icon: ShoppingCart },
  pedidos: { label: 'Pedidos', color: 'bg-yellow-100 text-yellow-700', icon: ClipboardList },
  produccion: { label: 'Producción', color: 'bg-indigo-100 text-indigo-700', icon: Factory }
}

export default function Auditoria() {
  // Estado del componente
  const [auditorias, setAuditorias] = useState([])
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [filtroModulo, setFiltroModulo] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroUsuario, setFiltroUsuario] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [expandido, setExpandido] = useState(null)
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [vistaModulo, setVistaModulo] = useState(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [reintentando, setReintentando] = useState(false)

  // Efecto para cargar datos iniciales
  useEffect(() => {
    cargarAuditorias()
    
    // Detectar cambios de conexión
    const handleOnline = () => {
      console.log('🟢 Conexión restaurada')
      setIsOnline(true)
      setMensaje('')
      cargarAuditorias()
    }
    
    const handleOffline = () => {
      console.log('🔴 Conexión perdida')
      setIsOnline(false)
      setMensaje('🔴 Sin conexión a internet. Intentando reconectar...')
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Función para cargar auditorías
  const cargarAuditorias = async () => {
    try {
      setCargando(true)
      setMensaje('')
      
      console.log('🔍 Variables de estado:', {
        filtroModulo,
        filtroTipo,
        filtroUsuario,
        fechaInicio,
        fechaFin
      })
      
      const params = new URLSearchParams()
      if (filtroModulo) params.append('tabla', filtroModulo)
      if (filtroTipo) params.append('tipo_movimiento', filtroTipo)
      if (filtroUsuario) params.append('usuario', filtroUsuario)
      if (fechaInicio) params.append('fecha_inicio', fechaInicio)
      if (fechaFin) params.append('fecha_fin', fechaFin)
      
      console.log('🔍 Cargando auditorías desde:', `${API_URL}/auditoria?${params}`)
      
      const response = await fetch(`${API_URL}/auditoria?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('✅ Auditorías cargadas:', data.length, 'registros')
      
      setAuditorias(data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)))
      
      if (data.length === 0) {
        setMensaje('ℹ️ No hay registros de auditoría para mostrar')
      }
      
    } catch (error) {
      console.error('❌ Error al cargar auditorías:', error)
      
      let mensajeError = '❌ Error al cargar auditorías'
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        mensajeError = '❌ No se puede conectar al servidor. Verifica tu conexión.'
      } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        mensajeError = '❌ El servidor no responde. Intenta recargar la página.'
      } else if (error.message.includes('HTTP 404')) {
        mensajeError = '❌ El módulo de auditoría no está disponible.'
      } else if (error.message.includes('HTTP 500')) {
        mensajeError = '❌ Error interno del servidor. Contacta al administrador.'
      } else {
        mensajeError = `❌ Error: ${error.message}`
      }
      
      setMensaje(mensajeError)
      
      // Intentar reconexión automática después de 3 segundos
      setTimeout(() => {
        if (navigator.onLine) {
          console.log('🔄 Intentando reconexión automática...')
          cargarAuditorias()
        }
      }, 3000)
      
    } finally {
      setCargando(false)
    }
  }

  // Función para filtrar auditorías
  const auditoriasFiltradas = auditorias.filter(aud => {
    const coincideBusqueda = !busqueda || 
      aud.tabla.toLowerCase().includes(busqueda.toLowerCase()) ||
      aud.usuario.toLowerCase().includes(busqueda.toLowerCase()) ||
      (aud.detalles_nuevos && JSON.stringify(aud.detalles_nuevos).toLowerCase().includes(busqueda.toLowerCase()))
    
    let coincideModulo = true
    if (vistaModulo) {
      coincideModulo = aud.tabla === vistaModulo
    } else if (filtroModulo) {
      coincideModulo = aud.tabla === filtroModulo
    }
    
    const coincideTipo = !filtroTipo || aud.tipo_movimiento === filtroTipo
    const coincideUsuario = !filtroUsuario || aud.usuario.toLowerCase().includes(filtroUsuario.toLowerCase())
    
    let coincideFecha = true
    if (fechaInicio) {
      coincideFecha = coincideFecha && new Date(aud.fecha) >= new Date(fechaInicio)
    }
    if (fechaFin) {
      coincideFecha = coincideFecha && new Date(aud.fecha) <= new Date(fechaFin + 'T23:59:59')
    }
    
    return coincideBusqueda && coincideModulo && coincideTipo && coincideUsuario && coincideFecha
  })

  // Resto de las funciones del componente...
  const toggleExpandido = (id) => {
    setExpandido(expandido === id ? null : id)
  }

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const resaltarCambios = (anteriores, nuevos) => {
    if (!anteriores || !nuevos) return null
    
    const cambios = []
    Object.keys(nuevos).forEach(key => {
      if (anteriores[key] !== nuevos[key]) {
        cambios.push({
          campo: key,
          anterior: anteriores[key],
          nuevo: nuevos[key]
        })
      }
    })
    
    return cambios
  }

  const limpiarFiltros = () => {
    setBusqueda('')
    setFiltroModulo('')
    setFiltroTipo('')
    setFiltroUsuario('')
    setFechaInicio('')
    setFechaFin('')
    setVistaModulo(null)
  }

  const reintentarConexion = async () => {
    setReintentando(true)
    setMensaje('🔄 Reintentando conexión...')
    
    try {
      const response = await fetch(`${API_URL}/productos`)
      if (response.ok) {
        console.log('✅ Conexión restaurada')
        setIsOnline(true)
        setMensaje('')
        await cargarAuditorias()
      } else {
        throw new Error('El servidor respondió con error')
      }
    } catch (error) {
      console.error('❌ Error al reconectar:', error)
      setMensaje('❌ No se pudo restablecer la conexión. Verifica el servidor.')
    } finally {
      setReintentando(false)
    }
  }

  const verPorModulo = (modulo) => {
    setVistaModulo(vistaModulo === modulo ? null : modulo)
    setFiltroModulo(vistaModulo === modulo ? '' : modulo)
  }

  const obtenerEstadisticasModulo = (modulo) => {
    const registros = auditorias.filter(aud => aud.tabla === modulo)
    const stats = {
      total: registros.length,
      insert: registros.filter(aud => aud.tipo_movimiento === 'INSERT').length,
      update: registros.filter(aud => aud.tipo_movimiento === 'UPDATE').length,
      delete: registros.filter(aud => aud.tipo_movimiento === 'DELETE').length,
      usuarios: [...new Set(registros.map(aud => aud.usuario))]
    }
    return stats
  }

  return (
    <div className="space-y-4 p-1">
      <div className="flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl font-bold">Auditoría del Sistema</h1>
        <div className="flex items-center space-x-2">
          {/* Estado de conexión */}
          <div className={`flex items-center px-3 py-2 rounded-lg text-sm ${
            isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4 mr-1" />
                Conectado
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 mr-1" />
                Desconectado
              </>
            )}
          </div>
          
          {/* Botón de recarga */}
          <button 
            onClick={cargarAuditorias}
            disabled={cargando || reintentando}
            className="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 flex items-center text-sm disabled:opacity-50"
          >
            <Database className="w-4 h-4 mr-1" />
            {cargando || reintentando ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              'Recargar'
            )}
          </button>
          
          {/* Botón de reconexión */}
          {!isOnline && (
            <button 
              onClick={reintentarConexion}
              disabled={reintentando}
              className="bg-orange-500 text-white px-3 py-2 rounded-lg hover:bg-orange-600 flex items-center text-sm disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              {reintentando ? 'Reintentando...' : 'Reconectar'}
            </button>
          )}
        </div>
      </div>

      {mensaje && (
        <div className={`p-3 rounded-lg text-center ${mensaje.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {mensaje}
        </div>
      )}

      {/* Botones de Módulos */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="font-semibold text-gray-700 mb-4">Vista por Módulos</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(MODULOS).map(([key, value]) => {
            const stats = obtenerEstadisticasModulo(key)
            const isActive = vistaModulo === key
            const Icon = value.icon
            
            return (
              <button
                key={key}
                onClick={() => verPorModulo(key)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  isActive 
                    ? 'border-orange-500 bg-orange-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <Icon className={`w-6 h-6 ${isActive ? 'text-orange-600' : 'text-gray-600'}`} />
                  <span className={`text-xs font-medium ${isActive ? 'text-orange-700' : 'text-gray-700'}`}>
                    {value.label}
                  </span>
                  <div className="flex space-x-1">
                    {stats.insert > 0 && (
                      <span className="text-xs bg-green-100 text-green-700 px-1 rounded">+{stats.insert}</span>
                    )}
                    {stats.update > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">↻{stats.update}</span>
                    )}
                    {stats.delete > 0 && (
                      <span className="text-xs bg-red-100 text-red-700 px-1 rounded">-{stats.delete}</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{stats.total} total</span>
                </div>
              </button>
            )
          })}
        </div>
        {vistaModulo && (
          <div className="mt-4 flex items-center justify-between bg-orange-50 p-3 rounded-lg">
            <div className="flex items-center">
              <Database className="w-4 h-4 text-orange-600 mr-2" />
              <span className="text-sm font-medium text-orange-700">
                Mostrando: {MODULOS[vistaModulo].label}
              </span>
            </div>
            <button
              onClick={() => verPorModulo(null)}
              className="text-xs text-orange-600 hover:text-orange-700"
            >
              Limpiar filtro
            </button>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-700">Filtros Avanzados</h2>
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className="text-gray-500 hover:text-gray-700"
          >
            {mostrarFiltros ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {mostrarFiltros && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Búsqueda general</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar en tabla, usuario o detalles..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Módulo</label>
              <select
                value={filtroModulo}
                onChange={(e) => setFiltroModulo(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Todos los módulos</option>
                {Object.entries(MODULOS).map(([key, value]) => (
                  <option key={key} value={key}>{value.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de movimiento</label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Todos los tipos</option>
                {Object.entries(TIPOS_MOVIMIENTO).map(([key, value]) => (
                  <option key={key} value={key}>{value.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Usuario</label>
              <input
                type="text"
                placeholder="Filtrar por usuario..."
                value={filtroUsuario}
                onChange={(e) => setFiltroUsuario(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Fecha inicio</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Fecha fin</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <button
                onClick={limpiarFiltros}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-300"
              >
                Limpiar todos los filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lista de auditorías */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {cargando ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            <p className="mt-2 text-gray-500">Cargando auditorías...</p>
          </div>
        ) : auditoriasFiltradas.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No se encontraron registros de auditoría</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {auditoriasFiltradas.map((aud) => {
              const TipoInfo = TIPOS_MOVIMIENTO[aud.tipo_movimiento]
              const ModuloInfo = MODULOS[aud.tabla] || { label: aud.tabla, color: 'bg-gray-100 text-gray-700', icon: Database }
              const cambios = aud.tipo_movimiento === 'UPDATE' ? resaltarCambios(aud.detalles_anteriores, aud.detalles_nuevos) : null
              
              return (
                <div key={aud.id} className="hover:bg-gray-50">
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium flex items-center ${ModuloInfo.color}`}>
                            <ModuloInfo.icon className="w-3 h-3 mr-1" />
                            {ModuloInfo.label}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium flex items-center ${TipoInfo.color}`}>
                            <TipoInfo.icon className="w-3 h-3 mr-1" />
                            {TipoInfo.label}
                          </span>
                          <span className="text-xs text-gray-500">
                            ID: {aud.registro_id}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            {aud.usuario}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatearFecha(aud.fecha)}
                          </div>
                          {aud.ip_address && (
                            <div className="text-xs text-gray-400">
                              IP: {aud.ip_address}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => toggleExpandido(aud.id)}
                        className="ml-4 text-gray-400 hover:text-gray-600"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>

                    {expandido === aud.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {aud.detalles_anteriores && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                <XCircle className="w-4 h-4 mr-1 text-red-500" />
                                Datos Anteriores
                              </h4>
                              <div className="bg-red-50 p-3 rounded text-xs">
                                <pre className="whitespace-pre-wrap text-gray-700">
                                  {JSON.stringify(aud.detalles_anteriores, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}
                          
                          {aud.detalles_nuevos && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                                Datos Nuevos
                              </h4>
                              <div className="bg-green-50 p-3 rounded text-xs">
                                <pre className="whitespace-pre-wrap text-gray-700">
                                  {JSON.stringify(aud.detalles_nuevos, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {cambios && cambios.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                              <AlertCircle className="w-4 h-4 mr-1 text-orange-500" />
                              Cambios Detectados
                            </h4>
                            <div className="bg-orange-50 p-3 rounded">
                              {cambios.map((cambio, idx) => (
                                <div key={idx} className="text-xs mb-1">
                                  <span className="font-medium">{cambio.campo}:</span>
                                  <span className="text-red-600 line-through ml-2">{cambio.anterior}</span>
                                  <span className="text-green-600 ml-2">→</span>
                                  <span className="text-green-600 font-medium ml-2">{cambio.nuevo}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {aud.user_agent && (
                          <div className="mt-4 text-xs text-gray-500">
                            <strong>User Agent:</strong> {aud.user_agent}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
