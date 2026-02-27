import { useEffect, useMemo, useState } from 'react'
import { Package, RefreshCw, AlertTriangle } from 'lucide-react'
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
  
  // Chorizo
  if (nombre.includes('salchicha') || categoria.includes('salchicha')) {
    return '🥩'
  }
  
  // Hamburguesa
  if (nombre.includes('hamburguesa') || nombre.includes('hamburgues') || categoria.includes('hamburgues')) {
    return '🥩'
  }
  
  // Default genérico
  return '📦'
}

export default function ProductosDisponibles() {
  const navigate = useNavigate()
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const usuarioActual = (() => { try { return JSON.parse(localStorage.getItem('usuario') || '{}') } catch { return {} } })()
  const esAdmin = usuarioActual?.rol === 'admin'

  const cargarProductos = async () => {
    try {
      setCargando(true)
      setMensaje('')
      const response = await fetch(`${API_URL}/productos`)
      const data = await response.json()
      if (!response.ok) {
        setMensaje(`❌ ${data?.error || 'No se pudieron cargar los productos'}`)
        return
      }
      setProductos(Array.isArray(data) ? data.sort((a, b) => {
        // Primero ordenar por tipo de animal_origen
        const aAnimal = String(a?.animal_origen || '').toLowerCase();
        const bAnimal = String(b?.animal_origen || '').toLowerCase();
        
        if (aAnimal !== bAnimal) {
          return aAnimal.localeCompare(bAnimal, 'es');
        }
        
        // Si tienen el mismo animal_origen, ordenar por nombre
        return String(a?.nombre || '').localeCompare(String(b?.nombre || ''), 'es', { sensitivity: 'base' });
      }) : [])
    } catch {
      setMensaje('❌ Error de conexión al cargar productos disponibles')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarProductos()
  }, [])

  const disponibles = useMemo(
    () => productos.filter((p) => (parseFloat(p?.stock) || 0) > 0),
    [productos]
  )

  return (
    <div className="space-y-4 p-1">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Productos Disponibles</h1>
          <p className="text-sm text-gray-500">Solo se muestran productos con stock mayor a cero.</p>
        </div>
        <div className="flex items-center gap-2">
          {esAdmin && (
            <button
              onClick={() => navigate('/productos')}
              className="bg-slate-600 text-white px-3 py-2 rounded-lg hover:bg-slate-700 text-sm"
              title="Regresar a productos"
            >
              Regresar
            </button>
          )}
          <button
            onClick={cargarProductos}
            className="bg-gray-700 text-white px-3 py-2 rounded-lg hover:bg-gray-800 flex items-center gap-2 text-sm"
            title="Actualizar productos disponibles"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>
      </div>

      {mensaje && (
        <div className={`p-3 rounded-lg text-sm font-medium ${mensaje.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {mensaje}
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-100 p-3 sm:p-4">
        <p className="text-sm text-gray-600">
          Total disponibles: <span className="font-bold text-gray-800">{disponibles.length}</span>
        </p>
      </div>

      {cargando ? (
        <div className="bg-white rounded-lg border border-gray-100 p-8 text-center text-gray-500">
          Cargando productos...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {disponibles.map((p) => {
              const stock = parseFloat(p?.stock) || 0
              const precio = parseFloat(p?.precio) || 0
              const stockMinimo = parseFloat(p?.stock_minimo) || 10
              const bajo = stock > 0 && stock <= stockMinimo

              return (
                <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow p-3 sm:p-4 flex items-center gap-3">
                  <img
                    src={p?.imagen_url || imagenFallback}
                    alt={p?.nombre || 'Producto'}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded object-cover border shrink-0"
                    onError={(e) => { e.currentTarget.src = imagenFallback }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-800 truncate">{p?.nombre}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                        {p?.categoria || 'Sin categoría'}
                      </span>
                      <span className="text-xs text-gray-600">Precio: ${precio.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p className="text-[11px] text-gray-500">Stock</p>
                      <p className={`text-sm font-semibold ${bajo ? 'text-amber-700' : 'text-green-700'}`}>
                        {bajo && <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />}
                        {stock.toFixed(3)}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full border-2 border-orange-200 bg-white flex items-center justify-center">
                      <span className="text-lg">{obtenerIconoProducto(p)}</span>
                    </div>
                  </div>
                </div>
              )
            })}

            {disponibles.length === 0 && (
              <div className="sm:col-span-2 bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                No hay productos con stock disponible.
              </div>
            )}
        </div>
      )}
    </div>
  )
}
