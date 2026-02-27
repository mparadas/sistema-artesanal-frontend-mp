import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Minus, Plus, User, Send, Search, ListFilter, Trash2, Phone, Mail, ShieldCheck } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import API_URL from '../config'

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
  
  // Res/vaca/carne
  if (nombre.includes('res') || nombre.includes('vaca') || nombre.includes('carne') || 
      nombre.includes('beef') || animal.includes('res') || animal.includes('vaca')) {
    return '🐄'
  }
  
  // Cordero/oveja
  if (nombre.includes('cordero') || nombre.includes('oveja') || nombre.includes('lamb') || 
      animal.includes('cordero')) {
    return '🐑'
  }
  
  // Pescado/mariscos
  if (nombre.includes('pescado') || nombre.includes('fish') || nombre.includes('camarón') || 
      nombre.includes('shrimp') || animal.includes('pescado')) {
    return '🐟'
  }
  
  // Queso/lácteos
  if (nombre.includes('queso') || nombre.includes('lacteo') || nombre.includes('mantequilla') || 
      categoria.includes('queso') || categoria.includes('lacteo')) {
    return '🧀'
  }
  
  // Verduras/vegetales
  if (nombre.includes('verdura') || nombre.includes('vegetal') || nombre.includes('hortaliza') || 
      categoria.includes('verdura') || categoria.includes('vegetal')) {
    return '🥬'
  }
  
  // Granos/harinas
  if (nombre.includes('grano') || nombre.includes('harina') || nombre.includes('arroz') || 
      nombre.includes('maiz') || nombre.includes('maíz') || categoria.includes('grano')) {
    return '🌾'
  }
  
  // Default genérico
  return '📦'
}

// Componente para mostrar icono de producto
const IconoProducto = ({ producto, className = "text-lg" }) => {
  const icono = obtenerIconoProducto(producto)
  return <span className={className} title={`Tipo: ${producto?.nombre}`}>{icono}</span>
}

// Función para obtener imagen pequeña del animal
const obtenerImagenAnimal = (producto) => {
  const categoria = String(producto?.categoria || '').toLowerCase()
  const animal = String(producto?.animal_origen || '').toLowerCase()
  const nombre = String(producto?.nombre || '').toLowerCase()
  
  // Imágenes de animales - formato rectangular 64x48 según categoría
  const imagenesPorCategoria = {
    // Categorías de pollo
    'pollo': 'https://images.unsplash.com/photo-1571098797179-2ac7696051d1?w=64&h=48&fit=crop&crop=center',
    'pollos': 'https://images.unsplash.com/photo-1571098797179-2ac7696051d1?w=64&h=48&fit=crop&crop=center',
    'aves': 'https://images.unsplash.com/photo-1571098797179-2ac7696051d1?w=64&h=48&fit=crop&crop=center',
    
    // Categorías de cerdo
    'cerdo': 'https://images.unsplash.com/photo-1589470311914-4d2b6568c3d6?w=64&h=48&fit=crop&crop=center',
    'cerdos': 'https://images.unsplash.com/photo-1589470311914-4d2b6568c3d6?w=64&h=48&fit=crop&crop=center',
    'cortes de cerdo': 'https://images.unsplash.com/photo-1589470311914-4d2b6568c3d6?w=64&h=48&fit=crop&crop=center',
    'embutidos': 'https://images.unsplash.com/photo-1589470311914-4d2b6568c3d6?w=64&h=48&fit=crop&crop=center',
    
    // Categorías de res
    'res': 'https://images.unsplash.com/photo-1588152326565-1e8c5b888c5b?w=64&h=48&fit=crop&crop=center',
    'reses': 'https://images.unsplash.com/photo-1588152326565-1e8c5b888c5b?w=64&h=48&fit=crop&crop=center',
    'cortes de res': 'https://images.unsplash.com/photo-1588152326565-1e8c5b888c5b?w=64&h=48&fit=crop&crop=center',
    'carnes': 'https://images.unsplash.com/photo-1588152326565-1e8c5b888c5b?w=64&h=48&fit=crop&crop=center',
    
    // Categorías de cordero
    'cordero': 'https://images.unsplash.com/photo-1628700992732-9f5f7b6e2b8c?w=64&h=48&fit=crop&crop=center',
    'corderos': 'https://images.unsplash.com/photo-1628700992732-9f5f7b6e2b8c?w=64&h=48&fit=crop&crop=center',
    'ovinos': 'https://images.unsplash.com/photo-1628700992732-9f5f7b6e2b8c?w=64&h=48&fit=crop&crop=center',
    
    // Categorías de pescado
    'pescado': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=64&h=48&fit=crop&crop=center',
    'pescados': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=64&h=48&fit=crop&crop=center',
    'mariscos': 'https://images.unsplash.com/photo-1594394907818-4bda41b2d7b2?w=64&h=48&fit=crop&crop=center',
    
    // Categorías de lácteos
    'quesos': 'https://images.unsplash.com/photo-1483695028938-f46d9ad51ba4?w=64&h=48&fit=crop&crop=center',
    'lacteos': 'https://images.unsplash.com/photo-1483695028938-f46d9ad51ba4?w=64&h=48&fit=crop&crop=center',
    'lácteos': 'https://images.unsplash.com/photo-1483695028938-f46d9ad51ba4?w=64&h=48&fit=crop&crop=center',
    
    // Categorías de granos
    'granos': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=64&h=48&fit=crop&crop=center',
    'harinas': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=64&h=48&fit=crop&crop=center',
    'cereales': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=64&h=48&fit=crop&crop=center',
    
    // Categorías de verduras
    'verduras': 'https://images.unsplash.com/photo-1566393028639-d108a42c46a7?w=64&h=48&fit=crop&crop=center',
    'vegetales': 'https://images.unsplash.com/photo-1566393028639-d108a42c46a7?w=64&h=48&fit=crop&crop=center',
    'hortalizas': 'https://images.unsplash.com/photo-1566393028639-d108a42c46a7?w=64&h=48&fit=crop&crop=center'
  }
  
  // Prioridad 1: Por categoría
  if (imagenesPorCategoria[categoria]) {
    return imagenesPorCategoria[categoria]
  }
  
  // Prioridad 2: Por animal_origen
  const imagenesPorAnimal = {
    'pollo': 'https://images.unsplash.com/photo-1571098797179-2ac7696051d1?w=64&h=48&fit=crop&crop=center',
    'cerdo': 'https://images.unsplash.com/photo-1589470311914-4d2b6568c3d6?w=64&h=48&fit=crop&crop=center',
    'res': 'https://images.unsplash.com/photo-1588152326565-1e8c5b888c5b?w=64&h=48&fit=crop&crop=center',
    'vaca': 'https://images.unsplash.com/photo-1588152326565-1e8c5b888c5b?w=64&h=48&fit=crop&crop=center',
    'cordero': 'https://images.unsplash.com/photo-1628700992732-9f5f7b6e2b8c?w=64&h=48&fit=crop&crop=center',
    'pescado': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=64&h=48&fit=crop&crop=center',
    'camarón': 'https://images.unsplash.com/photo-1594394907818-4bda41b2d7b2?w=64&h=48&fit=crop&crop=center'
  }
  
  if (imagenesPorAnimal[animal]) {
    return imagenesPorAnimal[animal]
  }
  
  // Prioridad 3: Detectar por nombre
  if (nombre.includes('pollo') || nombre.includes('chicken')) {
    return imagenesPorAnimal['pollo']
  }
  if (nombre.includes('cerdo') || nombre.includes('cochino') || nombre.includes('puerco') || nombre.includes('chancho')) {
    return imagenesPorAnimal['cerdo']
  }
  if (nombre.includes('res') || nombre.includes('vaca') || nombre.includes('carne') || nombre.includes('beef')) {
    return imagenesPorAnimal['res']
  }
  if (nombre.includes('cordero') || nombre.includes('oveja') || nombre.includes('lamb')) {
    return imagenesPorAnimal['cordero']
  }
  if (nombre.includes('pescado') || nombre.includes('fish')) {
    return imagenesPorAnimal['pescado']
  }
  if (nombre.includes('camarón') || nombre.includes('shrimp')) {
    return imagenesPorAnimal['camarón']
  }
  if (nombre.includes('queso')) {
    return imagenesPorCategoria['quesos']
  }
  
  // Imagen genérica si no se detecta nada
  return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=64&h=48&fit=crop&crop=center'
}

const obtenerImagenProducto = (producto, idx) => {
  // Prioridad 1: Imagen personalizada del producto
  if (producto?.imagen_url) return producto.imagen_url

  // Prioridad 2: Imagen según animal de origen
  const animal = String(producto?.animal_origen || '').toLowerCase()
  const nombre = String(producto?.nombre || '').toLowerCase()
  const categoria = String(producto?.categoria || '').toLowerCase()
  
  // Imágenes específicas por animal de origen
  const imagenesAnimales = {
    'pollo': 'https://images.unsplash.com/photo-1571098797179-2ac7696051d1?w=600&h=400&fit=crop&crop=center',
    'cerdo': 'https://images.unsplash.com/photo-1603054739162-dae7846d1d9b?w=600&h=400&fit=crop&crop=center',
    'res': 'https://images.unsplash.com/photo-1586441379954-f2126101b354?w=600&h=400&fit=crop&crop=center',
    'vaca': 'https://images.unsplash.com/photo-1586441379954-f2126101b354?w=600&h=400&fit=crop&crop=center',
    'cordero': 'https://images.unsplash.com/photo-1628700992732-9f5f7b6e2b8c?w=600&h=400&fit=crop&crop=center',
    'pescado': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=400&fit=crop&crop=center',
    'camarón': 'https://images.unsplash.com/photo-1594394907818-4bda41b2d7b2?w=600&h=400&fit=crop&crop=center'
  }
  
  // Verificar si hay animal de origen específico
  if (imagenesAnimales[animal]) {
    return imagenesAnimales[animal]
  }
  
  // Detectar animal por nombre si no está en animal_origen
  if (nombre.includes('pollo') || nombre.includes('chicken')) {
    return imagenesAnimales['pollo']
  }
  
  // Cortes específicos de cerdo
  if (nombre.includes('lomo') || nombre.includes('costilla') || nombre.includes('chuleta') || 
      nombre.includes('panceta') || nombre.includes('tocino') || nombre.includes('matambre') ||
      nombre.includes('bondiola') || nombre.includes('paleta')) {
    return imagenesAnimales['cerdo']
  }
  
  // Cortes específicos de res
  if (nombre.includes('bife') || nombre.includes('cuadril') || nombre.includes('picaña') || 
      nombre.includes('vacío') || nombre.includes('ojo de bife') || nombre.includes('tapa de cuadril') ||
      nombre.includes('lomo') || nombre.includes('carne') || nombre.includes('beef')) {
    return imagenesAnimales['res']
  }
  
  // General de cerdo
  if (nombre.includes('cerdo') || nombre.includes('cochino') || nombre.includes('puerco') || nombre.includes('chancho')) {
    return imagenesAnimales['cerdo']
  }
  
  // General de res
  if (nombre.includes('res') || nombre.includes('vaca')) {
    return imagenesAnimales['res']
  }
  
  if (nombre.includes('cordero') || nombre.includes('oveja') || nombre.includes('lamb')) {
    return imagenesAnimales['cordero']
  }
  if (nombre.includes('pescado') || nombre.includes('fish')) {
    return imagenesAnimales['pescado']
  }
  if (nombre.includes('camarón') || nombre.includes('shrimp')) {
    return imagenesAnimales['camarón']
  }

  // Prioridad 3: Categorías específicas
  const referencias = [
    {
      test: /chorizo|salchicha|embutido|morcilla|chistorra/,
      url: 'https://images.unsplash.com/photo-1587513863556-992c39b90c1b?w=600&h=400&fit=crop&crop=center'
    },
    {
      test: /queso|lacteo|lácteo|mantequilla/,
      url: 'https://images.unsplash.com/photo-1586441379954-f2126101b354?w=600&h=400&fit=crop&crop=center'
    },
    {
      test: /hamburguesa|hamburgues/,
      url: 'https://images.unsplash.com/photo-1568901346408-3a254d4fd9f5?w=600&h=400&fit=crop&crop=center'
    },
    {
      test: /jamón|jamon|ham/,
      url: 'https://images.unsplash.com/photo-1603054739162-dae7846d1d9b?w=600&h=400&fit=crop&crop=center'
    },
    {
      test: /verdura|vegetal|hortaliza|ensalada/,
      url: 'https://images.unsplash.com/photo-1566393028639-d108a42c46a7?w=600&h=400&fit=crop&crop=center'
    },
    {
      test: /grano|harina|arroz|maiz|maíz/,
      url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&h=400&fit=crop&crop=center'
    }
  ]

  const texto = `${nombre} ${categoria}`
  const match = referencias.find((r) => r.test.test(texto))
  if (match?.url) return match.url

  // Prioridad 4: Imagen genérica de comida
  return `https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&fit=crop&crop=center`
}

export default function Catalogo() {
  const location = useLocation()
  const [productos, setProductos] = useState([])
  const [datosCliente, setDatosCliente] = useState({
    nombre: '',
    telefono: '',
    email: ''
  })
  const [cantidades, setCantidades] = useState({})
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todas')

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const rProductos = await fetch(`${API_URL}/public/catalogo`)
        const dataProductos = await rProductos.json()
        setProductos(Array.isArray(dataProductos?.data) ? dataProductos.data : [])
      } catch {
        setMensaje('❌ No se pudieron cargar productos del catálogo público')
      }
    }
    cargarDatos()
  }, [])

  const catalogoCompleto = useMemo(() => {
    return (Array.isArray(productos) ? productos : []).map((p, idx) => ({
      id: p.id,
      nombre: p.nombre,
      precio: parseFloat(p.precio) || 0,
      imagen: obtenerImagenProducto(p, idx),
      categoria: (p.categoria || 'Sin categoría').trim(),
      stock: parseFloat(p.stock) || 0,
      cantidad_piezas: parseInt(p.cantidad_piezas, 10) || 0,
      animal_origen: p.animal_origen || '' // Incluir animal_origen
    }))
  }, [productos])

  const categoriasDisponibles = useMemo(() => {
    const setCategorias = new Set(catalogoCompleto.map((p) => p.categoria || 'Sin categoría'))
    return ['todas', ...Array.from(setCategorias).sort((a, b) => a.localeCompare(b))]
  }, [catalogoCompleto])

  const catalogo = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return catalogoCompleto.filter((p) => {
      const coincideBusqueda = texto === '' || 
        p.nombre.toLowerCase().includes(texto) || 
        p.categoria.toLowerCase().includes(texto)
      const coincideCategoria = categoriaSeleccionada === 'todas' || p.categoria === categoriaSeleccionada
      return coincideBusqueda && coincideCategoria
    })
  }, [catalogoCompleto, busqueda, categoriaSeleccionada])

  const cambiarCantidad = (id, delta) => {
    setCantidades((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + delta)
    }))
  }

  const totalGeneral = useMemo(() => {
    return catalogo.reduce((total, p) => {
      const cantidad = cantidades[p.id] || 0
      return total + (p.precio * cantidad)
    }, 0)
  }, [catalogo, cantidades])

  const enviarPedido = async () => {
    const productosSeleccionados = catalogo.filter((p) => (cantidades[p.id] || 0) > 0)
    if (productosSeleccionados.length === 0) {
      setMensaje('❌ Por favor, selecciona al menos un producto')
      return
    }

    if (!datosCliente.nombre.trim() || !datosCliente.telefono.trim()) {
      setMensaje('❌ Por favor, completa tu nombre y teléfono')
      return
    }

    setLoading(true)
    setMensaje('')

    try {
      const response = await fetch(`${API_URL}/public/pedido`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: datosCliente,
          productos: productosSeleccionados.map((p) => ({
            id: p.id,
            nombre: p.nombre,
            precio: p.precio,
            cantidad: cantidades[p.id] || 0
          }))
        })
      })

      const data = await response.json()
      if (response.ok) {
        setMensaje('✅ Pedido enviado correctamente. Nos comunicaremos contigo pronto.')
        setCantidades({})
        setDatosCliente({ nombre: '', telefono: '', email: '' })
      } else {
        setMensaje(`❌ ${data.error || 'Error al enviar el pedido'}`)
      }
    } catch {
      setMensaje('❌ Error de conexión. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold text-orange-600 mb-2">Catálogo de Productos</h1>
          <p className="text-gray-600">Selecciona los productos que deseas pedir</p>
        </header>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar productos..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="relative">
                  <ListFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={categoriaSeleccionada}
                    onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none bg-white"
                  >
                    {categoriasDisponibles.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat === 'todas' ? 'Todas las categorías' : cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {mensaje && (
                <div className={`p-4 rounded-lg mb-6 ${mensaje.includes('❌') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  {mensaje}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {catalogo.map((p) => {
                  const cantidad = cantidades[p.id] || 0
                  return (
                    <div key={p.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-shadow">
                      <div className="relative h-48 bg-gray-100">
                        <img
                          src={p.imagen}
                          alt={p.nombre}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://placehold.co/600x400/F97316/FFFFFF?text=Producto'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => cambiarCantidad(p.id, -1)}
                          className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-black/20 to-transparent active:bg-black/30 transition-colors"
                          title="Restar cantidad"
                          aria-label={`Restar ${p.nombre}`}
                        >
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35 text-6xl font-black leading-none select-none">
                            -
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => cambiarCantidad(p.id, 1)}
                          className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-black/20 to-transparent active:bg-black/30 transition-colors"
                          title="Sumar cantidad"
                          aria-label={`Sumar ${p.nombre}`}
                        >
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 text-6xl font-black leading-none select-none">
                            +
                          </span>
                        </button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/55 text-white px-3 py-1 rounded-full text-xs font-medium">
                          Toca izquierda - | derecha +
                        </div>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800">{p.nombre}</p>
                            <p className="text-orange-600 font-bold">${(parseFloat(p.precio) || 0).toFixed(2)}</p>
                            <p className="text-xs text-gray-500 mt-1">{p.categoria}</p>
                            {p.animal_origen && (
                              <div className="flex items-center gap-1 mt-1">
                                <span className="text-xs text-gray-600">Origen:</span>
                                <span className="text-xs font-medium text-gray-700">{p.animal_origen}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <img
                              src={obtenerImagenAnimal(p)}
                              alt={`Animal: ${p.animal_origen || 'Producto'}`}
                              className="w-16 h-12 rounded-lg object-cover border-2 border-orange-200"
                              title={`Origen: ${p.animal_origen || 'Producto'} | Categoría: ${p.categoria}`}
                              onError={(e) => {
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=64&h=48&fit=crop&crop=center'
                              }}
                            />
                            {p.animal_origen && (
                              <span className="text-xs text-gray-500 text-center max-w-[80px] truncate">
                                {p.animal_origen}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => cambiarCantidad(p.id, -1)}
                            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-bold text-2xl min-w-12 text-center text-orange-700">{cantidad}</span>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => cambiarCantidad(p.id, 1)}
                              className="p-2 rounded-lg bg-orange-100 text-orange-700 hover:bg-orange-200"
                              title="Aumentar cantidad"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {catalogo.length === 0 && !mensaje && (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">No se encontraron productos</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:w-96">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Tus Datos
              </h2>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={datosCliente.nombre}
                    onChange={(e) => setDatosCliente({ ...datosCliente, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Tu nombre completo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
                  <input
                    type="tel"
                    value={datosCliente.telefono}
                    onChange={(e) => setDatosCliente({ ...datosCliente, telefono: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Tu número de teléfono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email (opcional)</label>
                  <input
                    type="email"
                    value={datosCliente.email}
                    onChange={(e) => setDatosCliente({ ...datosCliente, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              <h3 className="text-lg font-bold text-gray-800 mb-4">Resumen del Pedido</h3>
              <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                {catalogo.filter((p) => (cantidades[p.id] || 0) > 0).map((p) => {
                  const cantidad = cantidades[p.id] || 0
                  return (
                    <div key={p.id} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">{p.nombre} x{cantidad}</span>
                      <span className="font-medium">${(p.precio * cantidad).toFixed(2)}</span>
                    </div>
                  )
                })}
                {catalogo.filter((p) => (cantidades[p.id] || 0) > 0).length === 0 && (
                  <p className="text-gray-500 text-sm">No hay productos seleccionados</p>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-bold">Total:</span>
                  <span className="text-2xl font-bold text-orange-600">${totalGeneral.toFixed(2)}</span>
                </div>

                <button
                  onClick={enviarPedido}
                  disabled={loading || catalogo.filter((p) => (cantidades[p.id] || 0) > 0).length === 0}
                  className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Enviar Pedido
                    </>
                  )}
                </button>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="text-xs text-blue-700">
                      <p className="font-medium mb-1">🔒 Pedido Seguro</p>
                      <p>Tus datos están protegidos. Nos comunicaremos contigo para confirmar tu pedido.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <Link to="/login" className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                    ¿Eres administrador? Inicia sesión
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
