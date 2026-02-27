import { useState, useEffect } from 'react'
import { Users, Plus, Trash2, Pencil, Search, Phone, Mail, MapPin, Star, X, User } from 'lucide-react'
import API_URL from '../config'

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [clienteEditando, setClienteEditando] = useState(null)
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [historialCompras, setHistorialCompras] = useState([])
  
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
    tipo: 'regular',
    notas: ''
  })

  const tiposCliente = [
    { value: 'regular', label: 'Regular', color: 'bg-gray-100 text-gray-800' },
    { value: 'vip', label: 'VIP', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'mayorista', label: 'Mayorista', color: 'bg-purple-100 text-purple-800' }
  ]

  useEffect(() => {
    cargarClientes()
  }, [])

  const cargarClientes = async () => {
    try {
      setCargando(true)
      const response = await fetch(`${API_URL}/clientes`)
      const data = await response.json()
      setClientes(data)
    } catch (error) {
      setMensaje('❌ Error al cargar clientes')
    } finally {
      setCargando(false)
    }
  }

  const verHistorial = async (cliente) => {
    try {
      const response = await fetch(`${API_URL}/clientes/${cliente.id}/compras`)
      const data = await response.json()
      setHistorialCompras(data)
      setClienteSeleccionado(cliente)
    } catch (error) {
      setMensaje('❌ Error al cargar historial')
    }
  }

  const guardarCliente = async (e) => {
    e.preventDefault()
    setCargando(true)
    
    const esEdicion = Boolean(clienteEditando?.id)
    const url = esEdicion ? `${API_URL}/clientes/${clienteEditando.id}` : `${API_URL}/clientes`
    const metodo = esEdicion ? 'PUT' : 'POST'
    const datos = esEdicion ? clienteEditando : nuevoCliente

    try {
      const response = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      })

      if (response.ok) {
        setMensaje(esEdicion ? '✅ Cliente actualizado' : '✅ Cliente creado')
        cerrarFormulario()
        cargarClientes()
        setTimeout(() => setMensaje(''), 3000)
      } else {
        let err = {}
        try {
          err = await response.json()
        } catch {
          // fallback cuando el backend no responde JSON válido
          err = {}
        }
        const errorBase = err.error || 'No se pudo guardar'
        const detalle = err.detalle ? ` (${err.detalle})` : ''
        setMensaje(`❌ Error: ${errorBase}${detalle}`)
      }
    } catch (error) {
      setMensaje('❌ Error de red')
    } finally {
      setCargando(false)
    }
  }

  const eliminarCliente = async (id) => {
    if (!confirm('¿Eliminar este cliente?')) return
    
    try {
      await fetch(`${API_URL}/clientes/${id}`, { method: 'DELETE' })
      cargarClientes()
      setMensaje('✅ Cliente eliminado')
      setTimeout(() => setMensaje(''), 3000)
    } catch (error) {
      setMensaje('❌ Error al eliminar')
    }
  }

  const iniciarEdicion = (cliente) => {
    const clienteNormalizado = {
      ...cliente,
      nombre: cliente?.nombre ?? '',
      telefono: cliente?.telefono ?? cliente?.phone ?? '',
      email: cliente?.email ?? cliente?.correo ?? '',
      direccion: cliente?.direccion ?? cliente?.address ?? '',
      tipo: cliente?.tipo ?? cliente?.categoria ?? 'regular',
      notas: cliente?.notas ?? ''
    }
    setClienteEditando(clienteNormalizado)
    setMostrarFormulario(true)
  }

  const cerrarFormulario = () => {
    setMostrarFormulario(false)
    setClienteEditando(null)
    setNuevoCliente({
      nombre: '',
      telefono: '',
      email: '',
      direccion: '',
      tipo: 'regular',
      notas: ''
    })
  }

  const clientesFiltrados = clientes.filter(c => 
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.telefono?.includes(busqueda) ||
    c.email?.toLowerCase().includes(busqueda.toLowerCase())
  )

  const getTipoStyle = (tipo) => {
    return tiposCliente.find(t => t.value === tipo)?.color || 'bg-gray-100 text-gray-800'
  }

  const datosActuales = clienteEditando || nuevoCliente

  return (
    <div className="p-2 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center text-gray-800">
          <Users className="mr-2 text-orange-600" /> Clientes
        </h1>
        <button 
          onClick={() => {
            setClienteEditando(null)
            setMostrarFormulario(true)
          }}
          className="bg-orange-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center text-sm"
        >
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Nuevo Cliente</span>
          <span className="sm:hidden">Nuevo</span>
        </button>
      </div>

      {/* Mensajes */}
      {mensaje && (
        <div className={`p-3 rounded-lg text-center ${
          mensaje.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {mensaje}
        </div>
      )}

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar por nombre, teléfono o email..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* Formulario */}
      {mostrarFormulario && !clienteEditando && (
        <div className="bg-white p-3 sm:p-6 rounded-xl shadow-lg border-2 border-orange-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-orange-700 text-lg">
              {clienteEditando ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h2>
            <button onClick={cerrarFormulario} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={guardarCliente} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  required
                  value={datosActuales.nombre ?? ''}
                  onChange={(e) => clienteEditando 
                    ? setClienteEditando({...clienteEditando, nombre: e.target.value})
                    : setNuevoCliente({...nuevoCliente, nombre: e.target.value})
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Nombre completo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={datosActuales.telefono ?? ''}
                  onChange={(e) => clienteEditando 
                    ? setClienteEditando({...clienteEditando, telefono: e.target.value})
                    : setNuevoCliente({...nuevoCliente, telefono: e.target.value})
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Teléfono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={datosActuales.email ?? ''}
                  onChange={(e) => clienteEditando 
                    ? setClienteEditando({...clienteEditando, email: e.target.value})
                    : setNuevoCliente({...nuevoCliente, email: e.target.value})
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cliente</label>
                <select
                  value={datosActuales.tipo ?? 'regular'}
                  onChange={(e) => clienteEditando 
                    ? setClienteEditando({...clienteEditando, tipo: e.target.value})
                    : setNuevoCliente({...nuevoCliente, tipo: e.target.value})
                  }
                  className="w-full border rounded-lg px-3 py-2"
                >
                  {tiposCliente.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input
                  type="text"
                  value={datosActuales.direccion ?? ''}
                  onChange={(e) => clienteEditando 
                    ? setClienteEditando({...clienteEditando, direccion: e.target.value})
                    : setNuevoCliente({...nuevoCliente, direccion: e.target.value})
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Dirección completa"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  value={datosActuales.notas ?? ''}
                  onChange={(e) => clienteEditando 
                    ? setClienteEditando({...clienteEditando, notas: e.target.value})
                    : setNuevoCliente({...nuevoCliente, notas: e.target.value})
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  rows="3"
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button 
                type="submit" 
                disabled={cargando}
                className="bg-orange-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-700 disabled:opacity-50"
              >
                {cargando ? 'Guardando...' : (clienteEditando ? 'Actualizar' : 'Crear Cliente')}
              </button>
              <button 
                type="button"
                onClick={cerrarFormulario}
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Clientes */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {/* Vista móvil: tarjetas */}
        <div className="block sm:hidden divide-y divide-gray-200">
          {clientesFiltrados.map((cliente) => (
            <div key={cliente.id}>
              <div className="p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900">{cliente.nombre}</p>
                    {cliente.telefono && (
                      <p className="text-xs text-gray-500 flex items-center mt-0.5">
                        <Phone className="w-3 h-3 mr-1" />{cliente.telefono}
                      </p>
                    )}
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getTipoStyle(cliente.tipo)}`}>
                      {tiposCliente.find(t => t.value === cliente.tipo)?.label || 'Regular'}
                    </span>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button onClick={() => iniciarEdicion(cliente)} className="text-green-600 hover:bg-green-50 p-2 rounded" title="Editar">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => eliminarCliente(cliente.id)} className="text-red-600 hover:bg-red-50 p-2 rounded" title="Eliminar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              {clienteEditando?.id === cliente.id && (
                <div className="px-3 pb-3">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <form onSubmit={guardarCliente} className="space-y-3">
                      <input
                        type="text"
                        required
                        value={datosActuales.nombre ?? ''}
                        onChange={(e) => setClienteEditando({...clienteEditando, nombre: e.target.value})}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        placeholder="Nombre completo"
                      />
                      <input
                        type="tel"
                        value={datosActuales.telefono ?? ''}
                        onChange={(e) => setClienteEditando({...clienteEditando, telefono: e.target.value})}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        placeholder="Teléfono"
                      />
                      <input
                        type="email"
                        value={datosActuales.email ?? ''}
                        onChange={(e) => setClienteEditando({...clienteEditando, email: e.target.value})}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        placeholder="correo@ejemplo.com"
                      />
                      <input
                        type="text"
                        value={datosActuales.direccion ?? ''}
                        onChange={(e) => setClienteEditando({...clienteEditando, direccion: e.target.value})}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        placeholder="Dirección completa"
                      />
                      <div className="flex gap-2">
                        <button type="submit" disabled={cargando} className="flex-1 bg-orange-600 text-white py-2 rounded-lg text-sm font-medium">
                          {cargando ? 'Guardando...' : 'Actualizar'}
                        </button>
                        <button type="button" onClick={cerrarFormulario} className="flex-1 bg-gray-100 py-2 rounded-lg text-sm">
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Vista escritorio: tabla */}
        <table className="hidden sm:table w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {clientesFiltrados.map((cliente) => (
              <>
                <tr key={cliente.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mr-3">
                        <User className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{cliente.nombre}</div>
                        {cliente.direccion && (
                          <div className="text-sm text-gray-500 flex items-center mt-0.5">
                            <MapPin className="w-3 h-3 mr-1" />
                            {cliente.direccion}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {cliente.telefono && (
                        <div className="flex items-center mb-1">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          {cliente.telefono}
                        </div>
                      )}
                      {cliente.email && (
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          {cliente.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTipoStyle(cliente.tipo)}`}>
                      {tiposCliente.find(t => t.value === cliente.tipo)?.label || 'Regular'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => iniciarEdicion(cliente)} className="text-green-600 hover:bg-green-50 p-2 rounded" title="Editar">
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button onClick={() => eliminarCliente(cliente.id)} className="text-red-600 hover:bg-red-50 p-2 rounded" title="Eliminar">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
                {clienteEditando?.id === cliente.id && (
                  <tr>
                    <td colSpan={4} className="px-6 pb-4 bg-orange-50/60">
                      <div className="border border-orange-200 rounded-lg p-4 bg-white">
                        <form onSubmit={guardarCliente} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            required
                            value={datosActuales.nombre ?? ''}
                            onChange={(e) => setClienteEditando({...clienteEditando, nombre: e.target.value})}
                            className="border rounded-lg px-3 py-2 text-sm"
                            placeholder="Nombre completo"
                          />
                          <input
                            type="tel"
                            value={datosActuales.telefono ?? ''}
                            onChange={(e) => setClienteEditando({...clienteEditando, telefono: e.target.value})}
                            className="border rounded-lg px-3 py-2 text-sm"
                            placeholder="Teléfono"
                          />
                          <input
                            type="email"
                            value={datosActuales.email ?? ''}
                            onChange={(e) => setClienteEditando({...clienteEditando, email: e.target.value})}
                            className="border rounded-lg px-3 py-2 text-sm"
                            placeholder="correo@ejemplo.com"
                          />
                          <select
                            value={datosActuales.tipo ?? 'regular'}
                            onChange={(e) => setClienteEditando({...clienteEditando, tipo: e.target.value})}
                            className="border rounded-lg px-3 py-2 text-sm"
                          >
                            {tiposCliente.map(t => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={datosActuales.direccion ?? ''}
                            onChange={(e) => setClienteEditando({...clienteEditando, direccion: e.target.value})}
                            className="border rounded-lg px-3 py-2 text-sm md:col-span-2"
                            placeholder="Dirección completa"
                          />
                          <textarea
                            value={datosActuales.notas ?? ''}
                            onChange={(e) => setClienteEditando({...clienteEditando, notas: e.target.value})}
                            className="border rounded-lg px-3 py-2 text-sm md:col-span-2"
                            rows="2"
                            placeholder="Notas adicionales..."
                          />
                          <div className="md:col-span-2 flex gap-2">
                            <button type="submit" disabled={cargando} className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                              {cargando ? 'Guardando...' : 'Actualizar'}
                            </button>
                            <button type="button" onClick={cerrarFormulario} className="bg-gray-100 px-4 py-2 rounded-lg text-sm">
                              Cancelar
                            </button>
                          </div>
                        </form>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>

        {clientesFiltrados.length === 0 && !cargando && (
          <div className="p-12 text-center text-gray-500">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>No hay clientes registrados</p>
          </div>
        )}
      </div>

      {/* Modal de Historial */}
      {clienteSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-3 sm:p-6 border-b flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Historial de Compras</h3>
                <p className="text-sm text-gray-500">{clienteSeleccionado.nombre}</p>
              </div>
              <button 
                onClick={() => setClienteSeleccionado(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              {historialCompras.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No hay compras registradas</p>
              ) : (
                <div className="space-y-4">
                  {historialCompras.map((compra) => (
                    <div key={compra.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900">
                            Venta #{compra.id}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(compra.fecha).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <p className="font-bold text-orange-600">
                          ${parseFloat(compra.total).toFixed(2)}
                        </p>
                      </div>
                      
                      {compra.items && compra.items[0]?.producto_id && (
                        <div className="mt-3 space-y-1">
                          <p className="text-xs font-medium text-gray-500 uppercase">Productos:</p>
                          {compra.items.map((item, idx) => (
                            <div key={idx} className="text-sm text-gray-700 flex justify-between">
                              <span>{item.cantidad}x {item.producto_nombre}</span>
                              <span>${parseFloat(item.total_linea).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t bg-gray-50">
              <button 
                onClick={() => setClienteSeleccionado(null)}
                className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}