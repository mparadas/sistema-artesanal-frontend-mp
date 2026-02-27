import React, { useState, useEffect } from 'react'
import { 
  TrendingUp, Calendar, Plus, Edit2, Trash2, DollarSign, 
  Download, RefreshCw, Filter, ChevronDown, ChevronUp,
  Clock, BarChart3, Activity, AlertCircle, X, Check
} from 'lucide-react'
import API_URL from '../config'

export default function TasasCambio() {
  const [tasas, setTasas] = useState([])
  const [tasaActual, setTasaActual] = useState(null)
  const [loading, setLoading] = useState(false)
  const [actualizando, setActualizando] = useState(false)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [editando, setEditando] = useState(null)
  const [filtro, setFiltro] = useState('todos')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [mostrarStats, setMostrarStats] = useState(true)
  
  const [formulario, setFormulario] = useState({
    fecha: '',
    tasa_bcv: '',
    fuente: 'BCV'
  })

  // Cargar tasa actual
  const cargarTasaActual = async () => {
    try {
      const response = await fetch(`${API_URL}/tasas-cambio/actual`)
      const data = await response.json()
      setTasaActual(data)
    } catch (error) {
      console.error('Error cargando tasa actual:', error)
    }
  }

  // Cargar tasas con filtros
  const cargarTasas = async () => {
    setLoading(true)
    try {
      let url = `${API_URL}/tasas-cambio`
      const params = new URLSearchParams()
      
      if (filtro !== 'todos') {
        params.append('periodo', filtro)
        if (fechaInicio) params.append('fecha_inicio', fechaInicio)
        if (fechaFin) params.append('fecha_fin', fechaFin)
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`
      }
      
      const response = await fetch(url)
      const data = await response.json()
      setTasas(data)
    } catch (error) {
      console.error('Error cargando tasas:', error)
    } finally {
      setLoading(false)
    }
  }

  // Consulta BCV + guardado automático en backend (si corresponde)
  const refrescarDesdeBCV = async () => {
    setActualizando(true)
    try {
      const response = await fetch(`${API_URL}/tasas-cambio/actualizar-diaria`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()

      if (!response.ok) {
        setMensaje('❌ ' + (data?.error || data?.detalle || 'No se pudo actualizar la tasa'))
        return
      }

      setMensaje('✅ ' + (data?.mensaje || 'Consulta ejecutada correctamente'))
      await Promise.all([cargarTasaActual(), cargarTasas()])
    } catch (error) {
      setMensaje('❌ Error al consultar y guardar la tasa')
    } finally {
      setActualizando(false)
    }
  }

  // Guardar o actualizar tasa
  const guardarTasa = async () => {
    try {
      const method = editando ? 'PUT' : 'POST'
      const url = editando ? 
        `${API_URL}/tasas-cambio/${editando.id}` : 
        `${API_URL}/tasas-cambio`
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formulario)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setMensaje('✅ ' + data.mensaje)
        setMostrarFormulario(false)
        setEditando(null)
        setFormulario({ fecha: '', tasa_bcv: '', fuente: 'BCV' })
        cargarTasas()
        if (!editando) cargarTasaActual()
      } else {
        setMensaje('❌ ' + (data.error || 'Error al guardar tasa'))
      }
    } catch (error) {
      setMensaje('❌ Error al guardar tasa')
    }
  }

  // Eliminar tasa
  const eliminarTasa = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este TC-BCV?')) return
    
    try {
      const response = await fetch(`${API_URL}/tasas-cambio/${id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setMensaje('✅ ' + data.mensaje)
        cargarTasas()
      } else {
        setMensaje('❌ Error al eliminar tasa')
      }
    } catch (error) {
      setMensaje('❌ Error al eliminar tasa')
    }
  }

  // Editar tasa
  const editarTasa = (tasa) => {
    setEditando(tasa)
    setFormulario({
      fecha: tasa.fecha,
      tasa_bcv: (tasa.tasa || tasa.tasa_bcv || 0).toString(),
      fuente: tasa.fuente
    })
    setMostrarFormulario(true)
  }

  // Formatear fecha para móvil
  const formatearFecha = (fecha) => {
    const date = new Date(fecha)
    const hoy = new Date()
    const esHoy = date.toDateString() === hoy.toDateString()
    
    if (esHoy) {
      return 'Hoy'
    }
    
    return date.toLocaleDateString('es-VE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  // Formatear fecha completa
  const formatearFechaCompleta = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-VE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Obtener título del filtro
  const getFiltroTitulo = () => {
    switch (filtro) {
      case 'dia': return 'Hoy'
      case 'semana': return 'Esta semana'
      case 'mes': return 'Este mes'
      case 'año': return 'Este año'
      default: return 'Todas'
    }
  }

  // Calcular estadísticas (ya no se usan)
  const calcularEstadisticas = () => {
    return { max: 0 }
  }

  const stats = calcularEstadisticas()

  useEffect(() => {
    cargarTasaActual()
    cargarTasas()
  }, [filtro, fechaInicio, fechaFin])

  const [mensaje, setMensaje] = useState('')

  return (
    <div className="p-6 space-y-6">
      {/* Header móvil optimizado */}
      <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-green-600 mr-1 sm:mr-2" />
              <h1 className="text-sm sm:text-lg font-bold text-gray-800">Tasa de Cambio BCV</h1>
            </div>
          </div>

      {/* Tarjeta de tasa actual */}
      {tasaActual && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold mb-2">Tasa Actual</h2>
              <p className="text-3xl font-bold">
                {(tasaActual?.tasa || tasaActual?.tasa_bcv || 0).toFixed(2)} BS/$
              </p>
              <p className="text-sm opacity-90">
                {tasaActual?.es_hoy ? 'Hoy' : `Del ${formatearFecha(tasaActual?.fecha || new Date())}`}
              </p>
              <p className="text-xs opacity-75">
                Fuente: {tasaActual?.fuente || 'Desconocida'}
              </p>
              <p className="text-xs opacity-80 mt-1">
                Actualizaci&oacute;n autom&aacute;tica: L-V desde las 2:30 PM (hora Venezuela)
              </p>
            </div>
            <div className="text-right">
              <DollarSign className="w-12 h-12 opacity-50" />
            </div>
          </div>
        </div>
      )}

      {/* Botones de acción y filtros */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-2">
        <div className="flex justify-center gap-2 sm:gap-3 w-full max-w-full">
          <button
            onClick={refrescarDesdeBCV}
            disabled={actualizando}
            className="bg-blue-600 text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded hover:bg-blue-700 flex items-center gap-1 shadow-md transition-all hover:shadow-lg flex-1"
            title="Consultar BCV y guardar automáticamente"
          >
            <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${actualizando ? 'animate-spin' : ''}`} />
            <span className="text-xs sm:text-sm font-medium">
              {actualizando ? 'Consultando...' : 'Refrescar'}
            </span>
          </button>
          <button
            onClick={() => setMostrarFormulario(true)}
            className="bg-green-600 text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded hover:bg-green-700 flex items-center gap-1 shadow-md transition-all hover:shadow-lg flex-1"
            title="Agregar nueva tasa"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-medium">Nueva Tasa</span>
          </button>
          
          <div className="relative flex-1">
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="w-full flex items-center gap-1 px-2 py-1.5 border border-gray-300 rounded hover:bg-gray-50 bg-white shadow-sm"
            >
              <Filter className="w-3 h-3" />
              <span className="text-xs font-medium">{getFiltroTitulo()}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${mostrarFiltros ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Dropdown de filtros */}
            {mostrarFiltros && (
              <div className="absolute z-10 bg-white border rounded-lg shadow-xl p-2 mt-1 w-48">
                <button
                  onClick={() => { setFiltro('todos'); setMostrarFiltros(false) }}
                  className={`block w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-xs ${
                    filtro === 'todos' ? 'bg-blue-50' : ''
                  }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => { setFiltro('dia'); setMostrarFiltros(false) }}
                  className={`block w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-xs ${
                    filtro === 'dia' ? 'bg-blue-50' : ''
                  }`}
                >
                  Hoy
                </button>
                <button
                  onClick={() => { setFiltro('semana'); setMostrarFiltros(false) }}
                  className={`block w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-xs ${
                    filtro === 'semana' ? 'bg-blue-50' : ''
                  }`}
                >
                  Esta semana
                </button>
                <button
                  onClick={() => { setFiltro('mes'); setMostrarFiltros(false) }}
                  className={`block w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-xs ${
                    filtro === 'mes' ? 'bg-blue-50' : ''
                  }`}
                >
                  Este mes
                </button>
                <button
                  onClick={() => { setFiltro('año'); setMostrarFiltros(false) }}
                  className={`block w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-xs ${
                    filtro === 'año' ? 'bg-blue-50' : ''
                  }`}
                >
                  Este año
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filtros de fecha para mes/año */}
      {(filtro === 'mes' || filtro === 'año') && (
        <div className="bg-white rounded-lg p-4 shadow border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg text-sm"
              placeholder="Fecha inicio"
            />
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg text-sm"
              placeholder="Fecha fin"
            />
            <button
              onClick={cargarTasas}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}

      {/* Lista de tasas */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                  Fecha
                </th>
                <th className="px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                  Tasa
                </th>
                <th className="px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                  Fuente
                </th>
                <th className="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-1 py-3 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : tasas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-1 py-3 text-center text-gray-500 text-xs">
                    No hay tasas registradas
                  </td>
                </tr>
              ) : (
                tasas.map((tasa, index) => (
                  <tr key={tasa.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-1 py-1">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center">
                          <Calendar className="w-2.5 h-2.5 mr-0.5 text-gray-400 flex-shrink-0" />
                          <span className="text-xs font-medium truncate">
                            {formatearFecha(tasa.fecha)}
                          </span>
                        </div>
                        {tasa.es_hoy && (
                          <span className="px-0.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full inline-block">
                            Hoy
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-1 py-1">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">
                          {parseFloat(tasa.tasa || tasa.tasa_bcv || 0).toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-500">BS/$</span>
                      </div>
                    </td>
                    <td className="px-1 py-1">
                      <span className="text-xs text-gray-600 truncate block">
                        {tasa.fuente}
                      </span>
                    </td>
                    <td className="px-1 py-1">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`px-1 py-0.5 text-xs rounded-full inline-block ${
                          tasa.activa 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {tasa.activa ? 'Activa' : 'Inactiva'}
                        </span>
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => editarTasa(tasa)}
                            className="text-blue-600 hover:bg-blue-50 p-0.5 rounded text-xs"
                            title="Editar"
                          >
                            <Edit2 className="w-2.5 h-2.5" />
                          </button>
                          <button
                            onClick={() => eliminarTasa(tasa.id)}
                            className="text-red-600 hover:bg-red-50 p-0.5 rounded text-xs"
                            title="Eliminar"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de formulario */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {editando ? 'Editar Tasa' : 'Nueva Tasa de Cambio'}
              </h3>
              <button
                onClick={() => {
                  setMostrarFormulario(false)
                  setEditando(null)
                  setFormulario({ fecha: '', tasa_bcv: '', fuente: 'BCV' })
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Cerrar</span>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault()
              guardarTasa()
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  value={formulario.fecha}
                  onChange={(e) => setFormulario({...formulario, fecha: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tasa BCV (BS/$)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={formulario.tasa_bcv}
                  onChange={(e) => setFormulario({...formulario, tasa_bcv: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Ej: 405.351"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fuente
                </label>
                <select
                  value={formulario.fuente}
                  onChange={(e) => setFormulario({...formulario, fuente: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="BCV">BCV - Banco Central de Venezuela</option>
                  <option value="Paralelo">Paralelo</option>
                  <option value="DolarToday">Dolar Today</option>
                  <option value="Otra">Otra</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarFormulario(false)
                    setEditando(null)
                    setFormulario({ fecha: '', tasa_bcv: '', fuente: 'BCV' })
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  {editando ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mensaje flotante */}
      {mensaje && (
        <div className={`fixed top-4 right-4 z-50 p-3 rounded-lg shadow-lg max-w-xs ${
          mensaje.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <div className="flex items-center">
            {mensaje.includes('✅') ? (
              <Check className="w-4 h-4 mr-2" />
            ) : (
              <AlertCircle className="w-4 h-4 mr-2" />
            )}
            <p className="text-sm font-medium">{mensaje}</p>
          </div>
        </div>
      )}
    </div>
  )
}
