import { useState, useEffect, useMemo } from 'react'
import { Package, Plus, Edit2, Trash2, ArrowUp, ArrowDown, AlertTriangle, Save, X } from 'lucide-react'

import API_URL from '../config'

export default function Ingredientes() {
  const [ingredientes, setIngredientes] = useState([])
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [actualizacionReciente, setActualizacionReciente] = useState(null)

  const obtenerUsuarioAuditoria = () => {
    try {
      const raw = localStorage.getItem('usuario')
      if (!raw) return 'sistema'
      const parsed = JSON.parse(raw)
      return parsed?.usuario || parsed?.nombre || 'sistema'
    } catch {
      return 'sistema'
    }
  }

  const construirHeaders = (conJson = false) => {
    const base = { 'x-usuario': obtenerUsuarioAuditoria() }
    if (conJson) base['Content-Type'] = 'application/json'
    return base
  }

  // Categorías de ingredientes
  const categorias = [
    'Carnes',
    'Pollo',
    'Cerdo', 
    'Res',
    'Embutidos',
    'Lácteos',
    'Verduras',
    'Frutas',
    'Granos',
    'Especias',
    'Aceites',
    'Aditivo y Líquido',
    'Condimento y Especia',
    'Grasas',
    'Otros'
  ]

  // Formulario - SIEMPRE inicializado con valores por defecto
  const [mostrarForm, setMostrarForm] = useState(false)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [ingredienteEditando, setIngredienteEditando] = useState(null)
  
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: 'Carnes',
    unidad: 'kg',
    stock: '',
    stock_minimo: '10',
    costo: '',
    cava_cuarto: ''
  })

  // Movimiento de stock
  const [movimiento, setMovimiento] = useState({
    mostrar: false,
    ingredienteId: null,
    tipo: 'entrada',
    cantidad: '',
    motivo: ''
  })

  const cargarIngredientes = async () => {
    setCargando(true)
    try {
      const response = await fetch(`${API_URL}/ingredientes`)
      const data = await response.json()
      console.log('🔍 Datos recibidos de API:', data)
      
      // Convertir strings a números
      const datosConvertidos = data.map(ing => {
        console.log(`🔍 Ingrediente ${ing.id}:`, {
          nombre: ing.nombre,
          categoria: ing.categoria,
          unidad: ing.unidad,
          stock: ing.stock,
          stock_minimo: ing.stock_minimo,
          costo: ing.costo
        })
        
        return {
          ...ing,
          stock: parseFloat(ing.stock) || 0,
          stock_minimo: parseFloat(ing.stock_minimo) || 0,
          costo: parseFloat(ing.costo) || 0
        }
      })
      console.log('🔍 Datos convertidos:', datosConvertidos)
      
      setIngredientes(datosConvertidos)
    } catch (error) {
      console.error('🔍 Error al cargar ingredientes:', error)
      setMensaje('❌ Error al cargar ingredientes')
    } finally {
      setCargando(false)
    }
  }
  useEffect(() => {
    cargarIngredientes()
  }, [])

  const abrirFormularioNuevo = () => {
    setModoEdicion(false)
    setIngredienteEditando(null)
    setFormData({
      nombre: '',
      categoria: 'Carnes',
      unidad: 'kg',
      stock: '',
      stock_minimo: '10',
      costo: '',
      cava_cuarto: ''
    })
    setMostrarForm(true)
  }

  const abrirFormularioEdicion = (ingrediente) => {
    console.log('🔍 Editando ingrediente:', ingrediente)
    setModoEdicion(true)
    setIngredienteEditando(ingrediente)
    const formDataActualizado = {
      nombre: ingrediente.nombre || '',
      categoria: ingrediente.categoria || 'Carnes',
      unidad: ingrediente.unidad || 'kg',
      stock: ingrediente.stock !== undefined ? String(ingrediente.stock) : '',
      stock_minimo: ingrediente.stock_minimo !== undefined ? String(ingrediente.stock_minimo) : '10',
      costo: ingrediente.costo !== undefined ? String(ingrediente.costo) : '',
        cava_cuarto:
          String(ingrediente.cava_cuarto || '').toLowerCase() === 'anaquel'
            ? ''
            : (ingrediente.cava_cuarto || '')
    }
    console.log('🔍 FormData para edición:', formDataActualizado)
    console.log('🔍 Categoría del ingrediente:', ingrediente.categoria)
    console.log('🔍 Categoría en formData:', formDataActualizado.categoria)
    setFormData(formDataActualizado)
    setMostrarForm(true)
  }

  const cerrarFormulario = () => {
    setMostrarForm(false)
    setModoEdicion(false)
    setIngredienteEditando(null)
    setFormData({
      nombre: '',
      categoria: 'Carnes',
      unidad: 'kg',
      stock: '',
      stock_minimo: '10',
      costo: '',
      cava_cuarto: ''
    })
  }

  const guardar = async (e) => {
    e.preventDefault()
    
    try {
      const url = modoEdicion 
        ? `${API_URL}/ingredientes/${ingredienteEditando.id}`
        : `${API_URL}/ingredientes`
      
      const method = modoEdicion ? 'PUT' : 'POST'
      
      const bodyData = {
        nombre: formData.nombre,
        categoria: formData.categoria,
        unidad: formData.unidad,
        stock: parseFloat(formData.stock) || 0,
        stock_minimo: parseFloat(formData.stock_minimo) || 10,
        costo: parseFloat(formData.costo) || 0,
        cava_cuarto: requiereCava(formData)
          ? (() => {
              const valor = String(formData.cava_cuarto || '').trim()
              if (!valor) return null
              if (valor.toLowerCase() === 'anaquel') return null
              return valor
            })()
          : 'Anaquel'
      }
      
      console.log('🔍 Guardando ingrediente:', { modoEdicion, url, method, bodyData })
      
      const response = await fetch(url, {
        method,
        headers: construirHeaders(true),
        body: JSON.stringify(bodyData)
      })

      if (response.ok) {
        const ingredienteGuardado = await response.json()
        cerrarFormulario()
        await cargarIngredientes()
        setMensaje(modoEdicion ? '✅ Ingrediente actualizado' : '✅ Ingrediente creado')
        if (modoEdicion && ingredienteGuardado?.id) {
          setActualizacionReciente({
            id: Number(ingredienteGuardado.id),
            categoria: ingredienteGuardado.categoria,
            stock: parseFloat(ingredienteGuardado.stock || 0),
            stock_minimo: parseFloat(ingredienteGuardado.stock_minimo || 0),
            costo: parseFloat(ingredienteGuardado.costo || 0),
            unidad: ingredienteGuardado.unidad,
            cava_cuarto: ingredienteGuardado.cava_cuarto || null
          })
          setTimeout(() => setActualizacionReciente(null), 9000)
        }
        setTimeout(() => setMensaje(''), 3000)
      } else {
        const errorData = await response.json()
        console.error('🔍 Error al guardar:', errorData)
        setMensaje('❌ ' + (errorData.error || 'Error al guardar'))
      }
    } catch (error) {
      console.error('🔍 Error en guardar:', error)
      setMensaje('❌ Error al guardar')
    }
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este ingrediente?')) return
    
    try {
      const response = await fetch(`${API_URL}/ingredientes/${id}`, {
        method: 'DELETE',
        headers: construirHeaders(false)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        await cargarIngredientes()
        setMensaje('🗑️ Ingrediente eliminado')
        setTimeout(() => setMensaje(''), 3000)
      } else {
        setMensaje('❌ ' + (data.error || 'Error al eliminar'))
      }
    } catch (error) {
      setMensaje('❌ Error al eliminar')
    }
  }

  const realizarMovimiento = async (e) => {
    e.preventDefault()
    
    try {
      const response = await fetch(`${API_URL}/ingredientes/${movimiento.ingredienteId}/movimiento`, {
        method: 'POST',
        headers: construirHeaders(true),
        body: JSON.stringify({
          tipo: movimiento.tipo,
          cantidad: parseFloat(movimiento.cantidad),
          motivo: movimiento.motivo
        })
      })

      if (response.ok) {
        setMovimiento({ mostrar: false, ingredienteId: null, tipo: 'entrada', cantidad: '', motivo: '' })
        await cargarIngredientes()
        setMensaje('✅ Movimiento registrado')
        setTimeout(() => setMensaje(''), 3000)
      } else {
        const error = await response.json()
        alert('Error: ' + (error.error || 'Error desconocido'))
      }
    } catch (error) {
      setMensaje('❌ Error en movimiento')
    }
  }

  const unidades = ['kg', 'gr', 'Lt', 'ml', 'Mt', 'mm', 'Paquete']
  const requiereCava = (ing) => {
    const cat = String(ing?.categoria || '').toLowerCase().trim()
    const nombre = String(ing?.nombre || '').toLowerCase().trim()
    const esMadeja = nombre.includes('madeja')
    if (esMadeja) return false
    const porCategoria = ['cerdo', 'pollo', 'res', 'grasas', 'cordero', 'carnes'].includes(cat)
    const porNombre =
      nombre.includes('cerdo') ||
      nombre.includes('pollo') ||
      nombre.includes('res') ||
      nombre.includes('grasa') ||
      nombre.includes('manteca') ||
      nombre.includes('cordero')
    return porCategoria || porNombre
  }

  const ingredientesOrdenados = useMemo(() => {
    const prioridadStock = (ing) => {
      const stock = parseFloat(ing?.stock || 0)
      const minimo = parseFloat(ing?.stock_minimo || 0)
      if (stock > minimo) return 0 // positivo normal
      if (stock > 0 && stock <= minimo) return 1 // bajo / por culminar
      return 2 // agotado o negativo
    }

    return [...ingredientes].sort((a, b) => {
      const pa = prioridadStock(a)
      const pb = prioridadStock(b)
      if (pa !== pb) return pa - pb
      return String(a?.nombre || '').localeCompare(String(b?.nombre || ''), 'es')
    })
  }, [ingredientes])

  const totalValor = ingredientes.reduce((sum, i) => {
    const stock = parseFloat(i.stock || 0)
    const minimo = parseFloat(i.stock_minimo || 0)
    if (!Number.isFinite(stock) || stock <= 0 || stock > minimo) return sum
    return sum + ((i.costo || 0) * stock)
  }, 0)
  const stockPositivo = ingredientes.filter(i => parseFloat(i.stock || 0) > 0).length
  const stockPorCulminar = ingredientes.filter(i => {
    const stock = parseFloat(i.stock || 0)
    const minimo = parseFloat(i.stock_minimo || 0)
    return stock > 0 && stock <= minimo
  }).length

  const renderFormularioIngrediente = (className = '') => (
    <div className={`bg-white rounded-lg shadow-md p-3 sm:p-6 ${className}`}>
      <h2 className="text-base sm:text-lg font-bold mb-3">
        {modoEdicion ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}
      </h2>
      <form onSubmit={guardar} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={e => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
              placeholder="Ej: Carne de cerdo"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              value={formData.categoria}
              onChange={e => setFormData({ ...formData, categoria: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
            >
              {categorias.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
            <select
              value={formData.unidad}
              onChange={e => setFormData({ ...formData, unidad: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
            >
              {unidades.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Inicial</label>
            <input
              type="number"
              step="0.001"
              value={formData.stock}
              onChange={e => setFormData({ ...formData, stock: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
              placeholder="0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Costo ($)</label>
            <input
              type="number"
              step="0.01"
              value={formData.costo}
              onChange={e => setFormData({ ...formData, costo: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
              placeholder="0.00"
              required
            />
          </div>
        </div>

        {requiereCava(formData) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1"># Cava cuarto</label>
              <input
                type="text"
                value={formData.cava_cuarto}
                onChange={e => setFormData({ ...formData, cava_cuarto: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                placeholder="Ej: Cava 1"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
            <input
              type="number"
              step="0.001"
              value={formData.stock_minimo}
              onChange={e => setFormData({ ...formData, stock_minimo: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
              placeholder="10"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 sm:flex-none bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center justify-center text-sm">
              <Save className="w-4 h-4 mr-1" />
              {modoEdicion ? 'Actualizar' : 'Guardar'}
            </button>
            <button type="button" onClick={cerrarFormulario} className="flex-1 sm:flex-none bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 flex items-center justify-center text-sm">
              <X className="w-4 h-4 mr-1" />
              Cancelar
            </button>
          </div>
        </div>
      </form>
    </div>
  )

  return (
    <div className="p-2 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center">
            <Package className="w-6 h-6 sm:w-8 sm:h-8 mr-2 text-orange-600" />
            Materia Prima
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5 hidden sm:block">Gestiona el inventario de ingredientes para producción</p>
        </div>
        <button 
          onClick={mostrarForm ? cerrarFormulario : abrirFormularioNuevo}
          className="bg-orange-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center text-sm"
        >
          {mostrarForm ? <X className="w-4 h-4 sm:mr-2" /> : <Plus className="w-4 h-4 sm:mr-2" />}
          <span className="hidden sm:inline">{mostrarForm ? 'Cancelar' : 'Nuevo Ingrediente'}</span>
          <span className="sm:hidden">{mostrarForm ? 'Cerrar' : 'Nuevo'}</span>
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-blue-100 p-2 sm:p-4 rounded-lg">
          <p className="text-blue-800 text-xs sm:text-sm">Total</p>
          <p className="text-xl sm:text-2xl font-bold text-blue-900">{ingredientes.length}</p>
        </div>
        <div className="bg-green-100 p-2 sm:p-4 rounded-lg">
          <p className="text-green-800 text-xs sm:text-sm">Valor</p>
          <p className="text-lg sm:text-2xl font-bold text-green-900">${totalValor.toFixed(2)}</p>
        </div>
        <div className="bg-red-100 p-2 sm:p-4 rounded-lg">
          <p className="text-red-800 text-xs sm:text-sm">Stock Bajo</p>
          <p className="text-xl sm:text-2xl font-bold text-red-900">
            {ingredientes.filter(i => i.stock <= i.stock_minimo).length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <div className="bg-emerald-100 p-2 sm:p-4 rounded-lg">
          <p className="text-emerald-800 text-xs sm:text-sm">Stock Positivo</p>
          <p className="text-xl sm:text-2xl font-bold text-emerald-900">{stockPositivo}</p>
        </div>
        <div className="bg-amber-100 p-2 sm:p-4 rounded-lg">
          <p className="text-amber-800 text-xs sm:text-sm">Por Culminar</p>
          <p className="text-xl sm:text-2xl font-bold text-amber-900">{stockPorCulminar}</p>
        </div>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div className={`p-3 rounded-lg text-center font-medium ${
          mensaje.includes('✅') ? 'bg-green-100 text-green-800 border border-green-300' :
          mensaje.includes('❌') ? 'bg-red-100 text-red-800 border border-red-300' :
          'bg-blue-100 text-blue-800'
        }`}>
          {mensaje}
        </div>
      )}

      {/* Formulario */}
      {mostrarForm && !modoEdicion && renderFormularioIngrediente()}

      {/* Modal de movimiento */}
      {movimiento.mostrar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Movimiento de Stock</h3>
            
            <form onSubmit={realizarMovimiento} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de movimiento</label>
                <select
                  value={movimiento.tipo}
                  onChange={(e) => setMovimiento({...movimiento, tipo: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="entrada">📥 Entrada (compra/recepción)</option>
                  <option value="salida">📤 Salida (uso/merma)</option>
                  <option value="ajuste">🔧 Ajuste (inventario)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                <input
                  type="number"
                  step="0.001"
                  value={movimiento.cantidad}
                  onChange={(e) => setMovimiento({...movimiento, cantidad: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo/Nota</label>
                <input
                  type="text"
                  value={movimiento.motivo}
                  onChange={(e) => setMovimiento({...movimiento, motivo: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Ej: Compra proveedor X, uso producción, etc."
                />
              </div>

              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700">
                  Registrar
                </button>
                <button 
                  type="button" 
                  onClick={() => setMovimiento({...movimiento, mostrar: false})}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inventario */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-3 sm:p-4 bg-gray-50 border-b flex justify-between items-center">
          <h2 className="text-base sm:text-lg font-bold">Inventario</h2>
          <button onClick={cargarIngredientes} disabled={cargando} className="text-sm text-orange-600 hover:text-orange-800">
            {cargando ? 'Cargando...' : '🔄 Actualizar'}
          </button>
        </div>

        {/* Vista móvil: tarjetas */}
        <div className="block sm:hidden divide-y divide-gray-200">
          {ingredientesOrdenados.map((ing) => {
            const stockNum = parseFloat(ing.stock || 0)
            const minimoNum = parseFloat(ing.stock_minimo || 0)
            const stockEnCero = stockNum <= 0
            const stockPorCulminar = stockNum > 0 && stockNum <= minimoNum
            const stockBajo = stockEnCero || stockPorCulminar
            const fueActualizado = Number(actualizacionReciente?.id) === Number(ing.id)
            // Convertir unidades para mostrar
            let displayStock = ing.stock
            let displayUnidad = ing.unidad
            
            // Convertir kg a gr para especias y otros ingredientes
            if (ing.unidad === 'kg' || (ing.categoria === 'Especias' && ing.unidad === 'kg')) {
              displayStock = (parseFloat(ing.stock) || 0) * 1000
              displayUnidad = 'gr'
            } 
            // Convertir Litro a ml (solo si está en Litro, no si ya está en ml)
            else if (ing.unidad === 'Litro') {
              displayStock = (parseFloat(ing.stock) || 0) * 1000
              displayUnidad = 'ml'
            }
            // NO convertir ml a gr - mantener ml como está
            
            // Formato de visualización según tipo de unidad
            let stockFormateado
            if (displayUnidad === 'gr' || displayUnidad === 'ml') {
              // Para peso y líquidos: formato con 3 decimales
              stockFormateado = typeof displayStock === 'number' ? displayStock.toFixed(3) : displayStock
            } else {
              // Para cantidad/paquetes: formato entero sin separador
              stockFormateado = typeof displayStock === 'number' ? Math.round(displayStock).toString() : displayStock
            }
            
            return (
              <div key={ing.id} className={`${stockEnCero ? 'bg-red-50' : stockPorCulminar ? 'bg-orange-50 border-l-4 border-orange-400' : ''}`}>
                <div className="p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-gray-900">{ing.nombre}</p>
                      {stockEnCero ? (
                        <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-xs flex items-center">
                          <AlertTriangle className="w-3 h-3 mr-0.5" />En cero
                        </span>
                      ) : stockPorCulminar ? (
                        <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-xs flex items-center">
                          <AlertTriangle className="w-3 h-3 mr-0.5" />Por culminar
                        </span>
                      ) : (
                        <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-xs">OK</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs">
                        {ing.categoria || 'Carnes'}
                      </span>
                    </div>
                    <div className="flex gap-3 mt-1 text-xs text-gray-600">
                      <span className={`font-medium ${stockBajo ? 'text-red-600' : ''}`}>
                        Stock: {stockFormateado} {displayUnidad}
                      </span>
                      <span>Costo: ${typeof ing.costo === 'number' ? ing.costo.toFixed(2) : ing.costo}</span>
                    </div>
                    {fueActualizado && (
                      <div className="mt-2 rounded-md bg-emerald-50 border border-emerald-200 p-2 text-[11px] text-emerald-800">
                        <p className="font-semibold">Actualizado:</p>
                        <p>
                          Cat: {actualizacionReciente.categoria || '—'} | Stock: {actualizacionReciente.stock.toFixed(3)} {actualizacionReciente.unidad || ''}
                        </p>
                        <p>
                          Min: {actualizacionReciente.stock_minimo.toFixed(3)} | Costo: ${actualizacionReciente.costo.toFixed(2)}
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-indigo-700 mt-1 font-medium">
                      {requiereCava(ing)
                        ? `Cava: ${
                            !ing.cava_cuarto || String(ing.cava_cuarto).toLowerCase() === 'anaquel'
                              ? 'Sin asignar'
                              : ing.cava_cuarto
                          }`
                        : 'Ubicación: Anaquel'}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => setMovimiento({...movimiento, mostrar: true, ingredienteId: ing.id})}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      {stockBajo ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                    </button>
                    <button onClick={() => abrirFormularioEdicion(ing)} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => eliminar(ing.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                </div>
                {mostrarForm && modoEdicion && ingredienteEditando?.id === ing.id && (
                  <div className="p-3 pt-0">
                    {renderFormularioIngrediente('border border-orange-200 bg-orange-50/30')}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Vista escritorio: tabla */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ingrediente</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Categoría</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Stock</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Unidad</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Costo</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ubicación</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Valor Total</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Estado</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {ingredientesOrdenados.map((ing) => {
                const stockNum = parseFloat(ing.stock || 0)
                const minimoNum = parseFloat(ing.stock_minimo || 0)
                const stockEnCero = stockNum <= 0
                const stockPorCulminar = stockNum > 0 && stockNum <= minimoNum
                const stockBajo = stockEnCero || stockPorCulminar
                const valorTotal = (ing.costo || 0) * (ing.stock || 0)
                const fueActualizado = Number(actualizacionReciente?.id) === Number(ing.id)
                
                // Convertir unidades para mostrar
                let displayStock = ing.stock
                let displayUnidad = ing.unidad
                
                // Convertir kg a gr para especias y otros ingredientes
                if (ing.unidad === 'kg' || (ing.categoria === 'Especias' && ing.unidad === 'kg')) {
                  displayStock = (parseFloat(ing.stock) || 0) * 1000
                  displayUnidad = 'gr'
                } 
                // Convertir Litro a ml (solo si está en Litro, no si ya está en ml)
                else if (ing.unidad === 'Litro') {
                  displayStock = (parseFloat(ing.stock) || 0) * 1000
                  displayUnidad = 'ml'
                }
                // NO convertir ml a gr - mantener ml como está
                
                // Formato de visualización según tipo de unidad
                let stockFormateado
                if (displayUnidad === 'gr' || displayUnidad === 'ml') {
                  // Para peso y líquidos: formato con 3 decimales
                  stockFormateado = typeof displayStock === 'number' ? displayStock.toFixed(3) : displayStock
                } else {
                  // Para cantidad/paquetes: formato entero sin separador
                  stockFormateado = typeof displayStock === 'number' ? Math.round(displayStock).toString() : displayStock
                }
                
                return (
                  <>
                  <tr key={ing.id} className={`${stockEnCero ? 'bg-red-50' : stockPorCulminar ? 'bg-orange-50 border-l-4 border-orange-400' : 'hover:bg-gray-50'}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{ing.nombre}</div>
                      <div className="text-xs text-gray-500">ID: {ing.id}</div>
                      {fueActualizado && (
                        <div className="mt-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-1 text-[11px] text-emerald-800">
                          Actualizado: Cat {actualizacionReciente.categoria || '—'} | Stock {actualizacionReciente.stock.toFixed(3)} {actualizacionReciente.unidad || ''} | Min {actualizacionReciente.stock_minimo.toFixed(3)} | ${actualizacionReciente.costo.toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                        {ing.categoria || 'Carnes'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${stockBajo ? 'text-red-600' : 'text-gray-900'}`}>
                        {stockFormateado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{displayUnidad}</td>
                    <td className="px-4 py-3 text-gray-900">
                      ${typeof ing.costo === 'number' ? ing.costo.toFixed(2) : ing.costo}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {requiereCava(ing)
                        ? (
                            !ing.cava_cuarto || String(ing.cava_cuarto).toLowerCase() === 'anaquel'
                              ? 'Sin asignar'
                              : ing.cava_cuarto
                          )
                        : 'Anaquel'}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">${valorTotal.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      {stockEnCero ? (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium flex items-center w-fit">
                          <AlertTriangle className="w-3 h-3 mr-1" />En cero
                        </span>
                      ) : stockPorCulminar ? (
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium flex items-center w-fit">
                          <AlertTriangle className="w-3 h-3 mr-1" />Por culminar
                        </span>
                      ) : (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">✅ OK</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => setMovimiento({...movimiento, mostrar: true, ingredienteId: ing.id})} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Movimiento de stock">
                          {stockBajo ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                        </button>
                        <button onClick={() => abrirFormularioEdicion(ing)} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg" title="Editar">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => eliminar(ing.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Eliminar">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {mostrarForm && modoEdicion && ingredienteEditando?.id === ing.id && (
                    <tr className="bg-orange-50/40">
                      <td colSpan={9} className="px-4 py-3">
                        {renderFormularioIngrediente('border border-orange-200 bg-white')}
                      </td>
                    </tr>
                  )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>

        {ingredientes.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>No hay ingredientes registrados</p>
            <p className="text-sm">Haz clic en "Nuevo Ingrediente" para agregar</p>
          </div>
        )}
      </div>
    </div>
  )
}
