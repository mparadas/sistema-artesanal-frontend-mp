import { useState, useEffect } from 'react'

import { Users, Plus, Edit2, Trash2, Save, X, Shield, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'

import API_URL from '../config'

const roles = [
  { value: 'admin',      label: 'Administrador', color: 'bg-red-100 text-red-700',    desc: 'Acceso total al sistema' },
  { value: 'vendedor',   label: 'Vendedor',       color: 'bg-blue-100 text-blue-700',  desc: 'Ventas y Clientes' },
  { value: 'produccion', label: 'Producción',     color: 'bg-green-100 text-green-700',desc: 'Producción e Ingredientes' },
  { value: 'viewer',     label: 'Solo lectura',   color: 'bg-gray-100 text-gray-700',  desc: 'Dashboard y Estadísticas' },
]

const getRolBadge = (rol) => {
  const r = roles.find(r => r.value === rol)
  return r ? <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.color}`}>{r.label}</span> : null
}

export default function Usuarios() {
  console.log('Usuarios: Componente montado')
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [verPassword, setVerPassword] = useState(false)

  const [form, setForm] = useState({ nombre: '', usuario: '', password: '', rol: 'vendedor' })

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setCargando(true)
    try {
      const token = localStorage.getItem('token')
      const r = await fetch(`${API_URL}/usuarios`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!r.ok) {
        if (r.status === 401) {
          setMensaje('❌ No autorizado - sesión expirada')
          return
        }
        throw new Error('Error al cargar usuarios')
      }
      const data = await r.json()
      setUsuarios(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error cargando usuarios:', error)
      setMensaje('❌ Error al cargar usuarios')
      setUsuarios([])
    } finally { setCargando(false) }
  }

  const abrirNuevo = () => {
    setEditando(null)
    setForm({ nombre: '', usuario: '', password: '', rol: 'vendedor' })
    setVerPassword(false)
    setMostrarForm(true)
  }

  const abrirEdicion = (u) => {
    setEditando(u)
    setForm({ nombre: u.nombre, usuario: u.usuario, password: '', rol: u.rol })
    setVerPassword(false)
    setMostrarForm(true)
  }

  const cerrar = () => { setMostrarForm(false); setEditando(null) }

  const guardar = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const url = editando ? `${API_URL}/usuarios/${editando.id}` : `${API_URL}/usuarios`
      const method = editando ? 'PUT' : 'POST'
      const body = editando
        ? { nombre: form.nombre, password: form.password, rol: form.rol }
        : { nombre: form.nombre, usuario: form.usuario, password: form.password, rol: form.rol }

      const r = await fetch(url, { 
        method, 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }, 
        body: JSON.stringify(body) 
      })
      const data = await r.json()
      if (!r.ok) { setMensaje('❌ ' + (data.error || 'Error al guardar')); return }

      setMensaje(editando ? '✅ Usuario actualizado' : '✅ Usuario creado')
      setTimeout(() => setMensaje(''), 3000)
      cerrar()
      cargar()
    } catch { setMensaje('❌ Error de red') }
  }

  const toggleActivo = async (u) => {
    try {
      const token = localStorage.getItem('token')
      const r = await fetch(`${API_URL}/usuarios/${u.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ activo: !u.activo })
      })
      if (r.ok) { cargar(); setMensaje(`✅ Usuario ${!u.activo ? 'activado' : 'desactivado'}`); setTimeout(() => setMensaje(''), 2000) }
    } catch { setMensaje('❌ Error') }
  }

  const eliminar = async (u) => {
    if (u.usuario === 'admin') { setMensaje('❌ No se puede eliminar el usuario admin'); setTimeout(() => setMensaje(''), 3000); return }
    if (!confirm(`¿Eliminar usuario "${u.nombre}"?`)) return
    try {
      const token = localStorage.getItem('token')
      const r = await fetch(`${API_URL}/usuarios/${u.id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (r.ok) { cargar(); setMensaje('🗑️ Usuario eliminado'); setTimeout(() => setMensaje(''), 2000) }
    } catch { setMensaje('❌ Error') }
  }

  // Obtener usuario actual del localStorage
  const usuarioActual = (() => { try { return JSON.parse(localStorage.getItem('usuario') || '{}') } catch { return {} } })()

  return (
    <div className="p-2 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center text-gray-800">
            <Shield className="mr-2 text-orange-600 w-5 h-5 sm:w-6 sm:h-6" /> Usuarios
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 hidden sm:block">Gestión de accesos y niveles de seguridad</p>
        </div>
        <button
          onClick={abrirNuevo}
          className="bg-orange-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center text-sm"
        >
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Nuevo Usuario</span>
          <span className="sm:hidden">Nuevo</span>
        </button>
      </div>

      {/* Roles info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {roles.map(r => (
          <div key={r.value} className={`${r.color} rounded-lg p-2 sm:p-3`}>
            <p className="font-bold text-xs sm:text-sm">{r.label}</p>
            <p className="text-xs opacity-75 mt-0.5">{r.desc}</p>
          </div>
        ))}
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div className={`p-3 rounded-lg text-center text-sm font-medium ${
          mensaje.includes('✅') ? 'bg-green-100 text-green-800 border border-green-300' :
          mensaje.includes('❌') ? 'bg-red-100 text-red-800 border border-red-300' :
          'bg-blue-100 text-blue-800'
        }`}>{mensaje}</div>
      )}

      {/* Formulario */}
      {mostrarForm && (
        <div className="bg-white rounded-xl shadow-lg border-2 border-orange-100 p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-orange-700 text-base sm:text-lg">
              {editando ? `Editar: ${editando.nombre}` : 'Nuevo Usuario'}
            </h2>
            <button onClick={cerrar} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={guardar} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nombre completo</label>
                <input
                  type="text" required
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400"
                  placeholder="Ej: Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Usuario (login)</label>
                <input
                  type="text" required={!editando}
                  value={form.usuario}
                  onChange={e => setForm({ ...form, usuario: e.target.value })}
                  disabled={!!editando}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="Ej: jperez"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Contraseña {editando && <span className="text-gray-400">(dejar vacío para no cambiar)</span>}
                </label>
                <div className="relative">
                  <input
                    type={verPassword ? 'text' : 'password'}
                    required={!editando}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-orange-400"
                    placeholder={editando ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                  />
                  <button type="button" onClick={() => setVerPassword(!verPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                    {verPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Rol / Nivel de acceso</label>
                <select
                  value={form.rol}
                  onChange={e => setForm({ ...form, rol: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400"
                >
                  {roles.map(r => <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" className="flex-1 sm:flex-none bg-orange-600 text-white px-5 py-2 rounded-lg hover:bg-orange-700 flex items-center justify-center gap-1 text-sm">
                <Save className="w-4 h-4" /> {editando ? 'Actualizar' : 'Crear Usuario'}
              </button>
              <button type="button" onClick={cerrar} className="flex-1 sm:flex-none bg-gray-200 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-300 text-sm">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista móvil */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-3 sm:p-4 bg-gray-50 border-b flex justify-between items-center">
          <h2 className="font-bold text-gray-700 text-sm sm:text-base">Usuarios registrados ({usuarios.length})</h2>
        </div>

        {/* Móvil: tarjetas */}
        <div className="block sm:hidden divide-y divide-gray-100">
          {usuarios.map(u => (
            <div key={u.id} className={`p-3 ${!u.activo ? 'opacity-50' : ''}`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm text-gray-900">{u.nombre}</p>
                  <p className="text-xs text-gray-500">@{u.usuario}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getRolBadge(u.rol)}
                    {u.activo
                      ? <span className="text-xs text-green-600 flex items-center gap-0.5"><CheckCircle className="w-3 h-3" />Activo</span>
                      : <span className="text-xs text-red-500 flex items-center gap-0.5"><XCircle className="w-3 h-3" />Inactivo</span>
                    }
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => toggleActivo(u)} className={`p-1.5 rounded ${u.activo ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'}`}>
                    {u.activo ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  </button>
                  <button onClick={() => abrirEdicion(u)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {u.usuario !== 'admin' && (
                    <button onClick={() => eliminar(u)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Escritorio: tabla */}
        <table className="hidden sm:table w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Login</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Último acceso</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {usuarios.map(u => (
              <tr key={u.id} className={`hover:bg-gray-50 ${!u.activo ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3 font-medium text-gray-900">{u.nombre}</td>
                <td className="px-4 py-3 text-gray-500 text-sm">@{u.usuario}</td>
                <td className="px-4 py-3">{getRolBadge(u.rol)}</td>
                <td className="px-4 py-3">
                  {u.activo
                    ? <span className="flex items-center gap-1 text-green-600 text-sm"><CheckCircle className="w-4 h-4" />Activo</span>
                    : <span className="flex items-center gap-1 text-red-500 text-sm"><XCircle className="w-4 h-4" />Inactivo</span>
                  }
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleString('es-VE') : 'Nunca'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center gap-1">
                    <button onClick={() => toggleActivo(u)} title={u.activo ? 'Desactivar' : 'Activar'} className={`p-1.5 rounded ${u.activo ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'}`}>
                      {u.activo ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </button>
                    <button onClick={() => abrirEdicion(u)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Editar">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {u.usuario !== 'admin' && (
                      <button onClick={() => eliminar(u)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Eliminar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {usuarios.length === 0 && !cargando && (
          <div className="p-10 text-center text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No hay usuarios registrados</p>
          </div>
        )}
      </div>
    </div>
  )
}