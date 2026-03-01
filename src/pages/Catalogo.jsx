import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Minus, Plus, User, Send, Search, ListFilter, Trash2, Phone, Mail, ShieldCheck } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import API_URL from '../config'
import { getImageUrl } from '../utils/imageUtils'

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
    return '🍔'
  }
  
  // Jamón
  if (nombre.includes('jamón') || nombre.includes('jamon') || nombre.includes('ham')) {
    return '🥓'
  }
  
  // Salchicha
  if (nombre.includes('salchicha') || categoria.includes('salchicha')) {
    return '🥩'
  }
  
  // Mortadela
  if (nombre.includes('mortadela')) {
    return '🥩'
  }
  
  // Leche
  if (nombre.includes('leche') || nombre.includes('milk')) {
    return '🥛'
  }
  
  // Huevo
  if (nombre.includes('huevo') || nombre.includes('egg')) {
    return '🥚'
  }
  
  // Pan
  if (nombre.includes('pan') || nombre.includes('bread')) {
    return '🍞'
  }
  
  // Tomate
  if (nombre.includes('tomate') || nombre.includes('tomato')) {
    return '🍅'
  }
  
  // Cebolla
  if (nombre.includes('cebolla') || nombre.includes('onion')) {
    return '🧅'
  }
  
  // Ajos
  if (nombre.includes('ajo') || nombre.includes('garlic')) {
    return '🧄'
  }
  
  // Pescado
  if (nombre.includes('pescado') || nombre.includes('fish')) {
    return '🐟'
  }
  
  // Camarón
  if (nombre.includes('camarón') || nombre.includes('shrimp')) {
    return '🦐'
  }
  
  // Hortalizas/verduras
  if (nombre.includes('verdura') || nombre.includes('hortaliza') || nombre.includes('vegetal')) {
    return '🥬'
  }
  
  // Frutas
  if (nombre.includes('fruta') || nombre.includes('fruit')) {
    return '🍎'
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
  
  // Imágenes de animales - formato grande 80x96 según categoría
  const imagenesPorCategoria = {
    // Categorías de pollo
    'pollo': 'https://images.unsplash.com/photo-1571098797179-2ac7696051d1?w=80&h=96&fit=crop&crop=center',
    'pollos': 'https://images.unsplash.com/photo-1571098797179-2ac7696051d1?w=80&h=96&fit=crop&crop=center',
    'aves': 'https://images.unsplash.com/photo-1571098797179-2ac7696051d1?w=80&h=96&fit=crop&crop=center',
    
    // Categorías de cerdo
    'cerdo': 'https://images.unsplash.com/photo-1589470311914-4d2b6568c3d6?w=80&h=96&fit=crop&crop=center',
    'cerdos': 'https://images.unsplash.com/photo-1589470311914-4d2b6568c3d6?w=80&h=96&fit=crop&crop=center',
    'cortes de cerdo': 'https://images.unsplash.com/photo-1589470311914-4d2b6568c3d6?w=80&h=96&fit=crop&crop=center',
    'embutidos': 'https://images.unsplash.com/photo-1589470311914-4d2b6568c3d6?w=80&h=96&fit=crop&crop=center',
    
    // Categorías de res
    'res': 'https://images.unsplash.com/photo-1588152326565-1e8c5b888c5b?w=80&h=96&fit=crop&crop=center',
    'reses': 'https://images.unsplash.com/photo-1588152326565-1e8c5b888c5b?w=80&h=96&fit=crop&crop=center',
    'cortes de res': 'https://images.unsplash.com/photo-1588152326565-1e8c5b888c5b?w=80&h=96&fit=crop&crop=center',
    'carnes': 'https://images.unsplash.com/photo-1588152326565-1e8c5b888c5b?w=80&h=96&fit=crop&crop=center',
    
    // Categorías de cordero
    'cordero': 'https://images.unsplash.com/photo-1628700992732-9f5f7b6e2b8c?w=80&h=96&fit=crop&crop=center',
    'corderos': 'https://images.unsplash.com/photo-1628700992732-9f5f7b6e2b8c?w=80&h=96&fit=crop&crop=center',
    'ovinos': 'https://images.unsplash.com/photo-1628700992732-9f5f7b6e2b8c?w=80&h=96&fit=crop&crop=center',
    
    // Categorías de pescado
    'pescado': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=80&h=96&fit=crop&crop=center',
    'pescados': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=80&h=96&fit=crop&crop=center',
    'mariscos': 'https://images.unsplash.com/photo-1594394907818-4bda41b2d7b2?w=80&h=96&fit=crop&crop=center',
    
    // Categorías de lácteos
    'quesos': 'https://images.unsplash.com/photo-1483695028938-f46d9ad51ba4?w=80&h=96&fit=crop&crop=center',
    'lacteos': 'https://images.unsplash.com/photo-1483695028938-f46d9ad51ba4?w=80&h=96&fit=crop&crop=center',
    'lácteos': 'https://images.unsplash.com/photo-1483695028938-f46d9ad51ba4?w=80&h=96&fit=crop&crop=center',
    
    // Categorías de granos
    'granos': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=80&h=96&fit=crop&crop=center',
    'harinas': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=80&h=96&fit=crop&crop=center',
    'cereales': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=80&h=96&fit=crop&crop=center',
    
    // Categorías de verduras
    'verduras': 'https://images.unsplash.com/photo-1566393028639-d108a42c46a7?w=80&h=96&fit=crop&crop=center',
    'vegetales': 'https://images.unsplash.com/photo-1566393028639-d108a42c46a7?w=80&h=96&fit=crop&crop=center',
    'hortalizas': 'https://images.unsplash.com/photo-1566393028639-d108a42c46a7?w=80&h=96&fit=crop&crop=center'
  }
  
  // Prioridad 1: Por categoría
  if (imagenesPorCategoria[categoria]) {
    return imagenesPorCategoria[categoria]
  }
  
  // Prioridad 2: Por animal_origen
  const imagenesPorAnimal = {
    'pollo': 'https://images.unsplash.com/photo-1571098797179-2ac7696051d1?w=80&h=96&fit=crop&crop=center',
    'cerdo': 'https://images.unsplash.com/photo-1589470311914-4d2b6568c3d6?w=80&h=96&fit=crop&crop=center',
    'res': 'https://images.unsplash.com/photo-1588152326565-1e8c5b888c5b?w=80&h=96&fit=crop&crop=center',
    'vaca': 'https://images.unsplash.com/photo-1588152326565-1e8c5b888c5b?w=80&h=96&fit=crop&crop=center',
    'cordero': 'https://images.unsplash.com/photo-1628700992732-9f5f7b6e2b8c?w=80&h=96&fit=crop&crop=center',
    'pescado': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=80&h=96&fit=crop&crop=center',
    'camarón': 'https://images.unsplash.com/photo-1594394907818-4bda41b2d7b2?w=80&h=96&fit=crop&crop=center'
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
  return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=80&h=96&fit=crop&crop=center'
}

const obtenerImagenProducto = (producto, idx) => {
  // Debug especial para hamburguesas
  const nombre = String(producto?.nombre || '').toLowerCase()
  if (nombre.includes('hamburguesa') || nombre.includes('hamburgues')) {
    console.log('🍔 HAMBURGUESA DETECTADA:', {
      nombre: producto?.nombre,
      imagen_url: producto?.imagen_url,
      animal_origen: producto?.animal_origen,
      categoria: producto?.categoria
    })
  }
  
  // Debug especial para chistorra
  if (nombre.includes('chistorra')) {
    console.log('🥓 CHISTORRA DETECTADA:', {
      nombre: producto?.nombre,
      imagen_url: producto?.imagen_url,
      animal_origen: producto?.animal_origen,
      categoria: producto?.categoria
    })
  }
  
  // Debug: Ver qué datos tenemos
  console.log('🔍 Producto:', {
    nombre: producto?.nombre,
    imagen_url: producto?.imagen_url,
    animal_origen: producto?.animal_origen,
    categoria: producto?.categoria
  })
  
  // Prioridad 1: Imagen personalizada del producto con procesamiento
  if (producto?.imagen_url) {
    const processedUrl = getImageUrl(producto.imagen_url)
    console.log('🖼️ Imagen personalizada procesada:', {
      original: producto.imagen_url,
      procesada: processedUrl
    })
    
    // Verificar si la URL es válida
    if (processedUrl.includes('https://agromae-b.onrender.com')) {
      console.log('✅ URL válida detectada:', processedUrl)
      return processedUrl
    } else {
      console.log('⚠️ URL procesada no parece válida:', processedUrl)
    }
  }

  // Prioridad 2: Imagen según animal de origen
  const animal = String(producto?.animal_origen || '').toLowerCase()
  const nombreLower = String(producto?.nombre || '').toLowerCase()
  const categoria = String(producto?.categoria || '').toLowerCase()
  
  console.log('🔍 Buscando imagen para:', { nombre: nombreLower, animal, categoria })
  
  // Imágenes específicas por animal de origen
  const imagenesAnimales = {
    'pollo': 'https://images.unsplash.com/photo-1587513863556-992c39b90c1b?w=600&h=400&fit=crop&crop=center',
    'cerdo': 'https://images.unsplash.com/photo-1603054739162-dae7846d1d9b?w=600&h=400&fit=crop&crop=center',
    'res': 'https://images.unsplash.com/photo-1586441379954-f2126101b354?w=600&h=400&fit=crop&crop=center',
    'vaca': 'https://images.unsplash.com/photo-1586441379954-f2126101b354?w=600&h=400&fit=crop&crop=center',
    'cordero': 'https://images.unsplash.com/photo-1628700992732-9f5f7b6e2b8c?w=600&h=400&fit=crop&crop=center',
    'pescado': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=400&fit=crop&crop=center',
    'camarón': 'https://images.unsplash.com/photo-1594394907818-4bda41b2d7b2?w=600&h=400&fit=crop&crop=center'
  }
  
  // Verificar si hay animal de origen específico
  if (imagenesAnimales[animal]) {
    console.log('🐾 Imagen por animal:', imagenesAnimales[animal])
    return imagenesAnimales[animal]
  }
  
  // Detectar animal por nombre si no está en animal_origen
  if (nombreLower.includes('pollo') || nombreLower.includes('chicken')) {
    console.log('🐔 Detectado pollo por nombre')
    return imagenesAnimales['pollo']
  }
  
  // Cortes específicos de cerdo
  if (nombreLower.includes('lomo') || nombreLower.includes('costilla') || nombreLower.includes('chuleta') || 
      nombreLower.includes('panceta') || nombreLower.includes('tocino') || nombreLower.includes('matambre') ||
      nombreLower.includes('bondiola') || nombreLower.includes('paleta')) {
    console.log('🐷 Detectado corte de cerdo')
    return imagenesAnimales['cerdo']
  }
  
  // Cortes específicos de res
  if (nombreLower.includes('bife') || nombreLower.includes('cuadril') || nombreLower.includes('picaña') || 
      nombreLower.includes('vacío') || nombreLower.includes('ojo de bife') || nombreLower.includes('tapa de cuadril') ||
      nombreLower.includes('lomo') || nombreLower.includes('carne') || nombreLower.includes('beef')) {
    console.log('🐄 Detectado corte de res')
    return imagenesAnimales['res']
  }
  
  // General de cerdo
  if (nombreLower.includes('cerdo') || nombreLower.includes('cochino') || nombreLower.includes('puerco') || nombreLower.includes('chancho')) {
    console.log('🐷 Detectado cerdo general')
    return imagenesAnimales['cerdo']
  }
  
  // General de res
  if (nombreLower.includes('res') || nombreLower.includes('vaca')) {
    console.log('🐄 Detectado res general')
    return imagenesAnimales['res']
  }
  
  if (nombreLower.includes('cordero') || nombreLower.includes('oveja') || nombreLower.includes('lamb')) {
    console.log('🐑 Detectado cordero')
    return imagenesAnimales['cordero']
  }
  if (nombreLower.includes('pescado') || nombreLower.includes('fish')) {
    console.log('🐟 Detectado pescado')
    return imagenesAnimales['pescado']
  }
  if (nombreLower.includes('camarón') || nombreLower.includes('shrimp')) {
    console.log('🦐 Detectado camarón')
    return imagenesAnimales['camarón']
  }

  // Prioridad 3: Categorías específicas
  const referencias = [
    {
      test: /chorizo|salchicha|embutido|morcilla|chistorra/,
      url: 'https://images.unsplash.com/photo-1587513863556-992c39b90c1b?w=600&h=400&fit=crop&crop=center'
    },
    {
      test: /hamburguesa|hamburgues/,
      url: 'https://images.unsplash.com/photo-1568901346408-3a254d4fd9f5?w=600&h=400&fit=crop&crop=center'
    },
    {
      test: /queso|lacteo|lácteo|mantequilla/,
      url: 'https://images.unsplash.com/photo-1586441379954-f2126101b354?w=600&h=400&fit=crop&crop=center'
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

  const texto = `${nombreLower} ${categoria}`
  const match = referencias.find((r) => r.test.test(texto))
  if (match?.url) {
    console.log('🥩 Imagen por referencia:', match.url)
    // Log especial para hamburguesas
    if (match.url.includes('1568901346408-3a254d4fd9f5')) {
      console.log('🍔 HAMBURGUESA: Usando imagen específica de hamburguesa')
    }
    // Log especial para chistorra
    if (match.url.includes('1587513863556-992c39b90c1b')) {
      console.log('🥓 CHISTORRA: Usando imagen de embutidos')
    }
    return match.url
  }

  // Prioridad 4: Imagen genérica de comida
  console.log('🍽️ Usando imagen genérica')
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
    .sort((a, b) => {
      // Primero ordenar por tipo de animal_origen
      const aAnimal = String(a?.animal_origen || '').toLowerCase();
      const bAnimal = String(b?.animal_origen || '').toLowerCase();
      
      if (aAnimal !== bAnimal) {
        return aAnimal.localeCompare(bAnimal, 'es');
      }
      
      // Si tienen el mismo animal_origen, ordenar por nombre
      return String(a?.nombre || '').localeCompare(String(b?.nombre || ''), 'es', { sensitivity: 'base' });
    })
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
      const tieneStock = (p.stock || 0) > 0 // Solo mostrar productos con stock > 0
      return coincideBusqueda && coincideCategoria && tieneStock
    })
  }, [catalogoCompleto, busqueda, categoriaSeleccionada])

  const cambiarCantidad = (id, delta) => {
    setCantidades((prev) => {
      const actual = parseFloat(prev[id] || 0)
      const producto = catalogoCompleto.find((p) => p.id === id) || {}
      const piezasDisponibles = parseFloat(producto?.cantidad_piezas || 0) || 0
      const stockDisponible = parseFloat(producto?.stock || 0) || 0
      const maximo = piezasDisponibles > 0 ? piezasDisponibles : stockDisponible
      const nuevo = Math.max(0, Math.min(maximo > 0 ? maximo : Number.POSITIVE_INFINITY, actual + delta))
      if (delta > 0 && maximo > 0 && actual >= maximo) {
        setMensaje(`❌ No puedes solicitar más piezas de las disponibles para "${producto?.nombre || 'producto'}"`)
      }
      return { ...prev, [id]: nuevo }
    })
  }

  const totalItems = useMemo(
    () => catalogoCompleto.reduce((acc, p) => acc + (parseFloat(cantidades[p.id] || 0) || 0), 0),
    [catalogoCompleto, cantidades]
  )

  const vaciarSeleccion = () => {
    setCantidades({})
    setMensaje('✅ Selección limpiada')
  }

  const normalizarTexto = (valor) => String(valor || '').trim()
  const normalizarEmail = (valor) => normalizarTexto(valor).toLowerCase()
  const normalizarTelefono = (valor) => normalizarTexto(valor).replace(/\D+/g, '')
  const esTelefonoVenezolanoValido = (telefono) => /^04\d{9}$/.test(telefono)
  const tieneNombreYApellido = (nombreCompleto) =>
    normalizarTexto(nombreCompleto).split(/\s+/).filter(Boolean).length >= 2

  const notaAutoguardado = 'Autoguardado por el mismo cliente desde catálogo'

  const resolverCliente = async () => {
    const nombre = normalizarTexto(datosCliente.nombre)
    const telefono = normalizarTelefono(datosCliente.telefono)
    const email = normalizarEmail(datosCliente.email)

    if (!nombre) throw new Error('Ingresa tu nombre y apellido')
    if (!tieneNombreYApellido(nombre)) throw new Error('Debes ingresar nombre y apellido')
    if (!telefono) throw new Error('Ingresa tu número telefónico')
    if (!esTelefonoVenezolanoValido(telefono)) {
      throw new Error('Número telefónico inválido. Usa formato venezolano 04xx1234567')
    }
    if (!email) throw new Error('Ingresa tu correo electrónico')
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Correo electrónico inválido')
    return { nombre, telefono, email }
  }

  const guardarPedidoAutomatico = async () => {
    const items = catalogo
      .map((p) => ({
        producto_id: p.id,
        cantidad_pedida: parseFloat(cantidades[p.id] || 0) || 0
      }))
      .filter((i) => i.cantidad_pedida > 0)

    for (const item of items) {
      const producto = catalogoCompleto.find((p) => p.id === item.producto_id) || {}
      const piezasDisponibles = parseFloat(producto?.cantidad_piezas || 0) || 0
      const stockDisponible = parseFloat(producto?.stock || 0) || 0
      const maximo = piezasDisponibles > 0 ? piezasDisponibles : stockDisponible
      if (maximo > 0 && item.cantidad_pedida > maximo) {
        setMensaje(`❌ La cantidad de "${producto?.nombre || 'producto'}" supera las piezas disponibles (${maximo})`)
        return
      }
    }

    if (items.length === 0) {
      setMensaje('❌ Debes seleccionar al menos 1 producto con cantidad mayor a 0')
      return
    }

    try {
      setLoading(true)
      const cliente = await resolverCliente()

      const res = await fetch(`${API_URL}/public/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente,
          notas: `${notaAutoguardado} - Pedido automático desde catálogo público`,
          items
        })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMensaje(`❌ ${data?.error || 'No se pudo crear el pedido'}`)
        return
      }

      setCantidades({})
      setMensaje('✅ Pedido recibido correctamente')
    } catch (error) {
      setMensaje(`❌ ${error?.message || 'Error de red al crear pedido'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-orange-600" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Catálogo</h1>
        </div>
        <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5" /> Canal público seguro
        </span>
      </div>

      {mensaje && (
        <div className={`p-3 rounded-lg text-sm font-medium ${mensaje.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {mensaje}
        </div>
      )}

      <div className="bg-white rounded-xl shadow border border-gray-100 p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <label className="text-sm text-gray-600 mb-1 block">Buscar en catálogo</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Ej: chorizo, salchicha..."
              className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>
        <div>
          <label className="text-sm text-gray-600 mb-1 block">Categoría</label>
          <div className="relative">
            <ListFilter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={categoriaSeleccionada}
              onChange={(e) => setCategoriaSeleccionada(e.target.value)}
              className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-orange-400"
            >
              {categoriasDisponibles.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'todas' ? 'Todas' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {catalogo.length === 0 && (
          <div className="col-span-full bg-white rounded-xl border border-gray-100 p-6 text-center text-gray-500">
            No hay productos activos para mostrar en el catálogo.
          </div>
        )}
        {catalogo.map((p) => {
          const cantidad = parseFloat(cantidades[p.id] || 0) || 0
          return (
            <div key={p.id} className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
              <div className="relative">
                <img
                  src={p.imagen}
                  alt={p.nombre}
                  className="w-full h-48 object-cover"
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
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-black/55 text-white px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap">
                  <span className="hidden sm:inline">Haz clic </span>
                  <span className="sm:hidden">Toca </span>
                  <span className="text-xs">izq-|der+</span>
                </div>
              </div>
              <div className="p-4 sm:p-4 space-y-3 sm:space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3">
                  <div className="flex-1 order-2 sm:order-1">
                    <p className="font-bold text-gray-800 text-xs sm:text-sm leading-tight">{p.nombre}</p>
                    <p className="text-orange-600 font-bold text-xs sm:text-sm mt-1">${(parseFloat(p.precio) || 0).toFixed(2)} x Kg</p>
                    <p className="text-xs text-gray-500 mt-1">{p.categoria}</p>
                    {p.animal_origen && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-gray-600">Origen:</span>
                        <span className="text-xs font-medium text-gray-700">{p.animal_origen}</span>
                      </div>
                    )}
                  </div>
                  <div className="w-14 h-14 sm:w-20 sm:h-24 rounded-lg border-2 border-orange-200 shadow-md flex items-center justify-center bg-white order-1 sm:order-2 mx-auto sm:mx-0">
                    <IconoProducto producto={p} className="text-2xl sm:text-5xl" />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 sm:pt-0">
                  <button
                    type="button"
                    onClick={() => cambiarCantidad(p.id, -1)}
                    className="p-1 sm:p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200"
                  >
                    <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </button>
                  <span className="font-bold text-base sm:text-lg min-w-6 sm:min-w-8 text-center text-orange-700">{cantidad}</span>
                  <button
                    type="button"
                    onClick={() => cambiarCantidad(p.id, 1)}
                    className="p-1 sm:p-1.5 rounded-lg bg-orange-100 text-orange-700 hover:bg-orange-200"
                    title="Aumentar cantidad"
                  >
                    <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="text-sm text-gray-600">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span>
            Total de unidades seleccionadas: <span className="font-bold text-gray-800">{totalItems}</span>
          </span>
          <button
            type="button"
            onClick={vaciarSeleccion}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 text-sm font-semibold"
          >
            <Trash2 className="w-4 h-4" />
            Vaciar selección
          </button>
        </div>
      </div>

      {mensaje.includes('✅') && (
        <div className="p-3 rounded-lg text-sm font-medium bg-green-100 text-green-800">
          {mensaje}
        </div>
      )}

      <div className="bg-white rounded-xl shadow border border-gray-100 p-4 flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Nombre y apellido</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={datosCliente.nombre}
                onChange={(e) => setDatosCliente((prev) => ({ ...prev, nombre: e.target.value }))}
                placeholder="Ej: Juan Perez"
                className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Ingresa ambos: nombre y apellido</p>
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Teléfono</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={datosCliente.telefono}
                onChange={(e) => {
                  const soloDigitos = String(e.target.value || '').replace(/\D+/g, '').slice(0, 11)
                  setDatosCliente((prev) => ({ ...prev, telefono: soloDigitos }))
                }}
                placeholder="Ej: 0414..."
                inputMode="numeric"
                maxLength={11}
                className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Formato requerido: 04xx1234567</p>
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Correo</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={datosCliente.email}
                onChange={(e) => setDatosCliente((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="correo@dominio.com"
                className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>
        </div>
        <div className="w-full sm:w-auto">
          <label className="text-sm text-gray-600 mb-1 block opacity-0 select-none">Acción</label>
          <div className="relative">
            <button
              onClick={guardarPedidoAutomatico}
              disabled={loading}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-60 flex items-center justify-center gap-2 text-sm w-full"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Generando...' : 'Generar pedido automático'}
            </button>
          </div>
        </div>
      </div>
      {location.pathname === '/catalogo-publico' && (
        <div className="flex justify-center sm:justify-end pt-1">
          <Link
            to="/login"
            className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Volver al inicio
          </Link>
        </div>
      )}
    </div>
  )
}
