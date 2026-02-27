import React, { useState, useEffect } from 'react'
import { 
  TrendingUp, Calendar, Plus, Edit2, Trash2, DollarSign, 
  Download, RefreshCw, Filter, ChevronDown, ChevronUp,
  Clock, BarChart3, Activity, AlertCircle, X, Check,
  Save, History, TrendingDown, Users
} from 'lucide-react'
import API_URL from '../config'

export default function TasasCambio() {
  const [tasasDiarias, setTasasDiarias] = useState([])
  const [tasaActual, setTasaActual] = useState(null)
  const [estadisticas, setEstadisticas] = useState(null)
  const [loading, setLoading] = useState(false)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [editando, setEditando] = useState(null)
  const [filtro, setFiltro] = useState('todos')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [mostrarStats, setMostrarStats] = useState(true)
  const [mensaje, setMensaje] = useState('')
  
  const [formulario, setFormulario] = useState({
    fecha: '',
    tasa_bcv: '',
    tasa_paralelo: '',
    usuario: ''
  })

  // Cargar tasa actual
  const cargarTasaActual = async () => {
    try {
      const response = await fetch(`${API_URL}/tasas-cambio/actual`)
      if (response.ok) {
        const data = await response.json()
        setTasaActual(data)
      }
    } catch (error) {
      console.error('Error al cargar tasa actual:', error)
    }
  }

  // Cargar tasas diarias
  const cargarTasasDiarias = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (fechaInicio) params.append('fecha_inicio', fechaInicio)
      if (fechaFin) params.append('fecha_fin', fechaFin)
      if (filtro !== 'todos') {
        const hoy = new Date()
        if (filtro === 'hoy') {
          params.append('fecha_inicio', hoy.toISOString().split('T')[0])
          params.append('fecha_fin', hoy.toISOString().split('T')[0])
        } else if (filtro === 'semana') {
          const semanaAtras = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000)
          params.append('fecha_inicio', semanaAtras.toISOString().split('T')[0])
        } else if (filtro === 'mes') {
          const mesAtras = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000)
          params.append('fecha_inicio', mesAtras.toISOString().split('T')[0])
        }
      }
      
      const response = await fetch(`${API_URL}/tasas-cambio-diarias?${params}`)
      if (response.ok) {
        const data = await response.json()
        setTasasDiarias(data.tasas)
      }
    } catch (error) {
      console.error('Error al cargar tasas diarias:', error)
      setMensaje('❌ Error al cargar tasas diarias')
    } finally {
      setLoading(false)
    }
  }

  // Cargar estadísticas
  const cargarEstadisticas = async () => {
    try {
      const response = await fetch(`${API_URL}/tasas-cambio-diarias/estadisticas?dias=30`)
      if (response.ok) {
        const data = await response.json()
        setEstadisticas(data)
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error)
    }
  }

  // Registrar automáticamente la tasa del día
  const registrarTasaDelDia = async () => {
    try {
      const response = await fetch(`${API_URL}/tasas-cambio-diarias/auto-registrar`, {
        method: 'POST'
      })
      if (response.ok) {
        const data = await response.json()
        setMensaje(`✅ ${data.mensaje}`)
        cargarTasasDiarias()
        cargarEstadisticas()
      }
    } catch (error) {
      console.error('Error al registrar tasa del día:', error)
      setMensaje('❌ Error al registrar tasa del día')
    }
  }

  // Guardar o actualizar tasa
  const guardarTasa = async () => {
    try {
      if (!formulario.fecha || !formulario.tasa_bcv || !formulario.tasa_paralelo) {
        setMensaje('❌ Todos los campos son requeridos')
        return
      }

      const response = await fetch(`${API_URL}/tasas-cambio-diarias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formulario)
      })

      if (response.ok) {
        const data = await response.json()
        setMensaje('✅ Tasa de cambio guardada correctamente')
        setMostrarFormulario(false)
        setFormulario({ fecha: '', tasa_bcv: '', tasa_paralelo: '', usuario: '' })
        cargarTasasDiarias()
        cargarEstadisticas()
      }
    } catch (error) {
      console.error('Error al guardar tasa:', error)
      setMensaje('❌ Error al guardar tasa')
    }
  }

  // Editar tasa
  const editarTasa = (tasa) => {
    setEditando(tasa)
    setFormulario({
      fecha: tasa.fecha,
      tasa_bcv: tasa.tasa_bcv,
      tasa_paralelo: tasa.tasa_paralelo,
      usuario: tasa.usuario
    })
    setMostrarFormulario(true)
  }

  // Eliminar tasa
  const eliminarTasa = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta tasa de cambio?')) return
    
    try {
      const response = await fetch(`${API_URL}/tasas-cambio-diarias/${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setMensaje('✅ Tasa eliminada correctamente')
        cargarTasasDiarias()
        cargarEstadisticas()
      }
    } catch (error) {
      console.error('Error al eliminar tasa:', error)
      setMensaje('❌ Error al eliminar tasa')
    }
  }

  // Limpiar mensaje
  useEffect(() => {
    if (mensaje) {
      const timer = setTimeout(() => setMensaje(''), 3000)
      return () => clearTimeout(timer)
    }
  }, [mensaje])

  // Cargar datos iniciales
  useEffect(() => {
    cargarTasaActual()
    cargarTasasDiarias()
    cargarEstadisticas()
  }, [])

  // Recargar cuando cambian los filtros
  useEffect(() => {
    cargarTasasDiarias()
  }, [filtro, fechaInicio, fechaFin])

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatearNumero = (numero) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
      minimumFractionDigits: 2
    }).format(numero)
  }

  const calcularVariacion = (actual, anterior) => {
    if (!anterior || !actual) return 0
    return ((actual - anterior) / anterior * 100).toFixed(2)
  }

  return (
    <div className="space-y-4 p-1">
      <div className="flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl font-bold">Tasas de Cambio</h1>
        <div className="flex space-x-2">
          <button
            onClick={registrarTasaDelDia}
            className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 flex items-center text-sm"
          >
            <Save className="w-4 h-4 mr-1" />
            Registrar Hoy
          </button>
          <button
            onClick={() => {
              cargarTasasDiarias()
              cargarEstadisticas()
            }}
            className="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 flex items-center text-sm"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Recargar
          </button>
        </div>
      </div>

      {mensaje && (
        <div className={`p-3 rounded-lg text-center ${
          mensaje.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {mensaje}
        </div>
      )}

      {/* Tasa Actual */}
      {tasaActual && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-700">Tasa Actual</h2>
              <div className="flex items-center space-x-4 mt-2">
                <div>
                  <span className="text-sm text-gray-500">BCV:</span>
                  <span className="ml-2 text-lg font-bold text-green-600">
                    {formatearNumero(tasaActual.tasa)}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Fecha:</span>
                  <span className="ml-2 text-sm text-gray-700">
                    {formatearFecha(tasaActual.fecha)}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                tasaActual.activa ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {tasaActual.activa ? 'Activa' : 'Inactiva'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas */}
      {mostrarStats && estadisticas && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Estadísticas (Últimos 30 días)</h2>
            <button
              onClick={() => setMostrarStats(!mostrarStats)}
              className="text-gray-500 hover:text-gray-700"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatearNumero(estadisticas.estadisticas.promedio_bcv)}
              </div>
              <div className="text-sm text-gray-500">Promedio BCV</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatearNumero(estadisticas.estadisticas.min_bcv)}
              </div>
              <div className="text-sm text-gray-500">Mínima BCV</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {formatearNumero(estadisticas.estadisticas.max_bcv)}
              </div>
              <div className="text-sm text-gray-500">Máxima BCV</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {estadisticas.estadisticas.total_registros}
              </div>
              <div className="text-sm text-gray-500">Registros</div>
            </div>
          </div>

          {/* Últimas tasas */}
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Últimos 7 días</h3>
            <div className="space-y-2">
              {estadisticas.ultimas_tasas.map((tasa, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{formatearFecha(tasa.fecha)}</span>
                  <span className="font-medium">{formatearNumero(tasa.tasa_bcv)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-700">Filtros</h2>
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className="text-gray-500 hover:text-gray-700"
          >
            {mostrarFiltros ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {mostrarFiltros && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Período</label>
              <select
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="todos">Todos</option>
                <option value="hoy">Hoy</option>
                <option value="semana">Última semana</option>
                <option value="mes">Último mes</option>
              </select>
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
          </div>
        )}
      </div>

      {/* Lista de tasas */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-700">Historial de Tasas</h2>
            <button
              onClick={() => {
                setMostrarFormulario(true)
                setEditando(null)
                setFormulario({ fecha: '', tasa_bcv: '', tasa_paralelo: '', usuario: '' })
              }}
              className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center text-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Nueva Tasa
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-500">Cargando tasas...</p>
          </div>
        ) : tasasDiarias.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No hay tasas de cambio registradas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tasa BCV</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tasa Paralelo</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tasasDiarias.map((tasa, index) => {
                  const tasaAnterior = tasasDiarias[index + 1]
                  const variacion = calcularVariacion(tasa.tasa_bcv, tasaAnterior?.tasa_bcv)
                  
                  return (
                    <tr key={tasa.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {formatearFecha(tasa.fecha)}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-900">
                            {formatearNumero(tasa.tasa_bcv)}
                          </span>
                          {variacion !== 0 && (
                            <span className={`ml-2 text-xs ${
                              variacion > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {variacion > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {Math.abs(variacion)}%
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {formatearNumero(tasa.tasa_paralelo)}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {tasa.usuario}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => editarTasa(tasa)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => eliminarTasa(tasa.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Formulario */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editando ? 'Editar Tasa' : 'Nueva Tasa de Cambio'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input
                  type="date"
                  value={formulario.fecha}
                  onChange={(e) => setFormulario({...formulario, fecha: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tasa BCV</label>
                <input
                  type="number"
                  step="0.01"
                  value={formulario.tasa_bcv}
                  onChange={(e) => setFormulario({...formulario, tasa_bcv: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Ej: 405.35"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tasa Paralelo</label>
                <input
                  type="number"
                  step="0.01"
                  value={formulario.tasa_paralelo}
                  onChange={(e) => setFormulario({...formulario, tasa_paralelo: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Ej: 410.00"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                <input
                  type="text"
                  value={formulario.usuario}
                  onChange={(e) => setFormulario({...formulario, usuario: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Nombre del usuario"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setMostrarFormulario(false)
                  setEditando(null)
                  setFormulario({ fecha: '', tasa_bcv: '', tasa_paralelo: '', usuario: '' })
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={guardarTasa}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editando ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
