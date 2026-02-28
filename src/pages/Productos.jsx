import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Plus, Trash2, AlertTriangle, Loader2, RefreshCw, Pencil, TrendingUp, Settings, Eye } from 'lucide-react'

import { getImageUrl } from '../utils/imageUtils'
import API_URL from '../config'

const PESO_UNIDAD_HAMBURGUESA_KG = 0.15
const formatearKg = (valor) => (parseFloat(valor || 0) || 0).toFixed(3).replace('.', ',')

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
    return '🥩'
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
const esProductoPorUnidadExacta = (producto = {}) => {
  const tipo = String(producto?.tipo_producto || '').toLowerCase()
  const categoria = String(producto?.categoria || '').toLowerCase()
  const nombre = String(producto?.nombre || '').toLowerCase()
  if (tipo === 'corte') return false
  return categoria.includes('hamburgues') || nombre.includes('hamburguesa')
}

export default function Productos() {
  const navigate = useNavigate()
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [productoEditandoCorte, setProductoEditandoCorte] = useState(null)
  const [formIncremento, setFormIncremento] = useState({ piezas: '', peso_kg: '', precio_canal: '' })
  const [productoAgregandoExistencia, setProductoAgregandoExistencia] = useState(null)
  const [formAgregarExistencia, setFormAgregarExistencia] = useState({ cantidad: '', piezas: '', peso_kg: '' })
  const [mostrarGanancia, setMostrarGanancia] = useState(false)
  const [gananciaPorProducto, setGananciaPorProducto] = useState([])
  const [cargandoGanancia, setCargandoGanancia] = useState(false)
  const [mostrarMantenimiento, setMostrarMantenimiento] = useState(false)
  const [historialMantenimiento, setHistorialMantenimiento] = useState([])
  const [productoMantenimientoId, setProductoMantenimientoId] = useState('')
  const [mantenimientoForm, setMantenimientoForm] = useState({ precio: '', precio_canal: '', imagen_url: '' })
  const [subiendoImagenMantenimiento, setSubiendoImagenMantenimiento] = useState(false)
  const [subiendoImagenNuevo, setSubiendoImagenNuevo] = useState(false)
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '',
    categoria: 'Chorizos',
    tipo_producto: 'producido',
    animal_origen: '',
    precio: '',
    stock: '',
    cantidad_piezas: '',
    peso_total: '',
    precio_canal: '',
    imagen_url: ''
  })
  const imagenFallback = 'https://placehold.co/120x90/F97316/FFFFFF?text=Producto'
  const inputArchivoMantenimientoRef = useRef(null)

  const cargarProductos = async () => {
    try {
      setCargando(true)
      const response = await fetch(`${API_URL}/productos`)
      const data = await response.json()
      
      const datosConvertidos = data.map((p) => {
        const stockNum = parseFloat(p.stock) || 0
        const porUnidad = esProductoPorUnidadExacta(p)
        const pesoTotalNormalizado = porUnidad
          ? (stockNum * PESO_UNIDAD_HAMBURGUESA_KG)
          : stockNum

        return {
          ...p,
          precio: parseFloat(p.precio) || 0,
          stock: stockNum,
          stock_minimo: parseFloat(p.stock_minimo) || 10,
          peso_total: pesoTotalNormalizado,
          cantidad_piezas: parseInt(p.cantidad_piezas, 10) || (porUnidad ? Math.round(stockNum) : 0),
          precio_canal: parseFloat(p.precio_canal) || 0,
          imagen_url: p.imagen_url || ''
        }
      })
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
      
      setProductos(datosConvertidos)
    } catch (error) {
      setMensaje('❌ Error al cargar productos')
    } finally {
      setCargando(false)
    }
  }
  useEffect(() => {
    cargarProductos()
    
    // Recargar datos cada 30 segundos para actualizar stock de producción
    const interval = setInterval(() => {
      cargarProductos()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const agregarProducto = async (e) => {
    e.preventDefault()
    try {
      const porUnidad = esProductoPorUnidadExacta(nuevoProducto)
      const piezasIngresadas = parseInt(nuevoProducto.cantidad_piezas || '0', 10) || 0
      const pesoIngresado = parseFloat(nuevoProducto.peso_total || '0') || 0
      const stockCalculado = porUnidad
        ? (piezasIngresadas > 0 ? piezasIngresadas : Math.max(0, Math.floor(pesoIngresado / PESO_UNIDAD_HAMBURGUESA_KG)))
        : pesoIngresado
      const pesoCalculado = porUnidad
        ? (stockCalculado * PESO_UNIDAD_HAMBURGUESA_KG)
        : stockCalculado

      const response = await fetch(`${API_URL}/productos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nuevoProducto.nombre,
          categoria: nuevoProducto.categoria,
          tipo_producto: nuevoProducto.tipo_producto,
          animal_origen: nuevoProducto.tipo_producto === 'corte' ? nuevoProducto.animal_origen : null,
          precio: parseFloat(nuevoProducto.precio),
          precio_canal: nuevoProducto.tipo_producto === 'corte' ? (parseFloat(nuevoProducto.precio_canal) || 0) : 0,
          imagen_url: (nuevoProducto.imagen_url || '').trim() || null,
          stock: stockCalculado,
          cantidad_piezas: porUnidad ? stockCalculado : (parseInt(nuevoProducto.cantidad_piezas, 10) || 0),
          peso_total: pesoCalculado
        })
      })

      // Intentar obtener más detalles del error
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('❌ Respuesta no JSON:', text);
        data = { error: text || 'Error desconocido' };
      }
      
      if (!response.ok) {
        console.error('❌ Error detallado:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          headers: Object.fromEntries(response.headers.entries()),
          data: data
        });
        setMensaje(`❌ ${data.error || 'No se pudo agregar producto'}`)
        return
      }
      
      setNuevoProducto({ nombre: '', categoria: 'Chorizos', tipo_producto: 'producido', animal_origen: '', precio: '', stock: '', cantidad_piezas: '', peso_total: '', precio_canal: '', imagen_url: '' })
      setMostrarFormulario(false)
      cargarProductos()
      setMensaje('✅ Producto agregado')
      setTimeout(() => setMensaje(''), 3000)
    } catch (error) {
      console.error('💥 Error al agregar producto:', error)
      setMensaje('❌ Error al guardar')
    }
  }

  const eliminarProducto = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return
    try {
      await fetch(`${API_URL}/productos/${id}`, { method: 'DELETE' })
      cargarProductos()
    } catch (error) {
      setMensaje('❌ Error al eliminar')
    }
  }
  const abrirModificarCorte = (p) => {
    setProductoEditandoCorte(p)
    setFormIncremento({ piezas: '', peso_kg: '', precio_canal: p?.precio_canal ? String(p.precio_canal) : '' })
  }
  const cerrarModificarCorte = () => {
    setProductoEditandoCorte(null)
    setFormIncremento({ piezas: '', peso_kg: '', precio_canal: '' })
  }
  const guardarIncrementoCorte = async (e) => {
    e.preventDefault()
    if (!productoEditandoCorte) return
    try {
      const piezas = parseInt(formIncremento.piezas || '0', 10) || 0
      const peso_kg = parseFloat(formIncremento.peso_kg || '0') || 0
      const precio_canal = parseFloat(formIncremento.precio_canal || '0') || 0
      if (piezas <= 0 && peso_kg <= 0 && precio_canal <= 0) {
        setMensaje('❌ Debes indicar piezas, peso o precio en canal')
        return
      }
      const response = await fetch(`${API_URL}/productos/${productoEditandoCorte.id}/incrementar-corte`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ piezas, peso_kg, precio_canal: precio_canal > 0 ? precio_canal : null })
      })
      const data = await response.json()
      if (!response.ok) {
        setMensaje(`❌ ${data.error || 'No se pudo actualizar el corte'}`)
        return
      }
      setMensaje('✅ Incremento aplicado en producto de corte')
      setTimeout(() => setMensaje(''), 3000)
      cerrarModificarCorte()
      cargarProductos()
    } catch (error) {
      setMensaje('❌ Error al modificar corte')
    }
  }
  const abrirAgregarExistencia = (p) => {
    setProductoAgregandoExistencia(p)
    setFormAgregarExistencia({ cantidad: '', piezas: '', peso_kg: '' })
  }
  const cerrarAgregarExistencia = () => {
    setProductoAgregandoExistencia(null)
    setFormAgregarExistencia({ cantidad: '', piezas: '', peso_kg: '' })
  }
  const guardarAgregarExistencia = async (e) => {
    e.preventDefault()
    if (!productoAgregandoExistencia) return
    try {
      const cantidad = parseFloat(formAgregarExistencia.cantidad || '0') || 0
      const piezas = parseInt(formAgregarExistencia.piezas || '0', 10) || 0
      const peso_kg = parseFloat(formAgregarExistencia.peso_kg || '0') || 0
      if (cantidad <= 0 && piezas <= 0 && peso_kg <= 0) {
        setMensaje('❌ Debes indicar al menos un valor para agregar')
        return
      }
      const response = await fetch(`${API_URL}/productos/${productoAgregandoExistencia.id}/agregar-existencia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cantidad, piezas, peso_kg })
      })
      const data = await response.json()
      if (!response.ok) {
        setMensaje(`❌ ${data.error || 'No se pudo agregar existencia'}`)
        return
      }
      setMensaje('✅ Existencia agregada')
      setTimeout(() => setMensaje(''), 3000)
      cerrarAgregarExistencia()
      cargarProductos()
    } catch (error) {
      setMensaje('❌ Error al agregar existencia')
    }
  }

  const categorias = ['Chorizos', 'Hamburguesas', 'Chistorras', 'Curados', 'Quesos', 'Embutidos', 'Lácteos', 'Carnes Frías', 'Aderezos', 'Otros']
  const esCorte = (p) => String(p?.tipo_producto || '').toLowerCase() === 'corte' || String(p?.tipo_producto || '').toLowerCase() === 'desposte'
  const productoMantenimientoSeleccionado = productos.find((p) => String(p.id) === String(productoMantenimientoId))
  const usuarioActual = (() => { try { return JSON.parse(localStorage.getItem('usuario') || '{}') } catch { return {} } })()
  const esAdmin = usuarioActual?.rol === 'admin'
  const cargarGananciaPorProducto = async () => {
    try {
      setCargandoGanancia(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/financiero/ganancia-por-producto`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      const data = await response.json()
      if (!response.ok) {
        setMensaje(`❌ ${data.error || 'No se pudo calcular ganancia por producto'}`)
        return
      }
      setGananciaPorProducto(Array.isArray(data) ? data : [])
      setMostrarGanancia(true)
    } catch (error) {
      setMensaje('❌ Error al calcular ganancia por producto')
    } finally {
      setCargandoGanancia(false)
    }
  }
  const abrirMantenimiento = async () => {
    if (!esAdmin) return
    setProductoMantenimientoId('')
    setMantenimientoForm({ precio: '', precio_canal: '', imagen_url: '' })
    setMostrarMantenimiento(true)
    try {
      const token = localStorage.getItem('token')
      
      // Agregar timestamp para evitar cache
      const timestamp = new Date().getTime()
      const response = await fetch(`${API_URL}/productos/mantenimiento/historial?limit=200&timestamp=${timestamp}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      const data = await response.json()
      
      if (!response.ok) {
        console.log('❌ Error en respuesta:', data.error)
        setMensaje(`❌ ${data.error || 'No se pudo cargar historial de mantenimiento'}`)
        return
      }
      
      const historialArray = Array.isArray(data) ? data : []
      
      // Limpiar cache forzada
      setHistorialMantenimiento([])
      await new Promise(resolve => setTimeout(resolve, 100))
      setHistorialMantenimiento(historialArray)
      
      if (historialArray.length === 0) {
        console.log('ℹ️ La tabla de historial está vacía')
        setMensaje('ℹ️ No hay historial de modificaciones registrado')
        setTimeout(() => setMensaje(''), 3000)
      }
    } catch (error) {
      console.error('💥 Error al cargar historial:', error)
      setMensaje('❌ Error al cargar historial de mantenimiento')
    }
  }
  const aplicarMantenimiento = async (e) => {
    e.preventDefault()
    console.log('🔥 FUNCIÓN aplicarMantenimiento llamada!')
    console.log('📋 productoMantenimientoId:', productoMantenimientoId)
    console.log('📝 mantenimientoForm:', mantenimientoForm)
    
    if (!productoMantenimientoId) {
      console.log('❌ No hay producto seleccionado')
      setMensaje('❌ Debes seleccionar un producto')
      return
    }
    
    // Validar que al menos un campo tenga cambios
    const precio = mantenimientoForm.precio !== '' ? parseFloat(mantenimientoForm.precio) : null
    const precio_canal = mantenimientoForm.precio_canal !== '' ? parseFloat(mantenimientoForm.precio_canal) : null
    const imagen_url = (mantenimientoForm.imagen_url || '').trim()
    
    console.log('💰 Valores procesados:', { 
      precio_original: mantenimientoForm.precio, 
      precio_canal_original: mantenimientoForm.precio_canal,
      precio: precio, 
      precio_canal: precio_canal, 
      imagen_url: imagen_url 
    })
    
    // Validación más flexible - si el precio es diferente al actual, enviarlo
    const productoActual = productos.find(p => String(p.id) === String(productoMantenimientoId))
    console.log('📦 Producto actual:', productoActual)
    
    const precioCambiado = precio !== null && precio !== parseFloat(productoActual?.precio || 0)
    const precioCanalCambiado = precio_canal !== null && precio_canal !== parseFloat(productoActual?.precio_canal || 0)
    const imagenCambiada = imagen_url && imagen_url !== (productoActual?.imagen_url || '')
    
    console.log('🔄 Cambios detectados:', { 
      precioCambiado, 
      precioCanalCambiado, 
      imagenCambiada,
      precioActual: productoActual?.precio,
      precioNuevo: precio,
      precioCanalActual: productoActual?.precio_canal,
      precioCanalNuevo: precio_canal
    })
    
    if (!precioCambiado && !precioCanalCambiado && !imagenCambiada) {
      console.log('❌ No hay cambios reales para aplicar')
      setMensaje('❌ No se detectaron cambios. Modifica al menos un campo.')
      return
    }
    
    console.log('🚀 Iniciando petición al servidor...')
    try {
      const token = localStorage.getItem('token')
      const url = `${API_URL}/productos/${productoMantenimientoId}/mantenimiento`
      console.log('🌐 Enviando a:', url)
      console.log('🔑 Token:', token ? 'presente' : 'ausente')
      
      const requestBody = {
        precio: precioCambiado ? precio : null,
        precio_canal: precioCanalCambiado ? precio_canal : null,
        imagen_url: imagenCambiada ? imagen_url : null
      }
      console.log('📦 Body:', requestBody)
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(requestBody)
      })
      
      console.log('📡 Respuesta status:', response.status)
      const data = await response.json()
      console.log('📄 Respuesta data:', data)
      
      if (!response.ok) {
        console.log('❌ Error en respuesta:', data.error)
        setMensaje(`❌ ${data.error || 'No se pudo aplicar mantenimiento'}`)
        return
      }
      
      console.log('✅ Éxito en la aplicación')
      setMensaje('✅ Mantenimiento aplicado correctamente')
      setTimeout(() => setMensaje(''), 3000)
      
      // Limpiar formulario
      setMantenimientoForm({ precio: '', precio_canal: '', imagen_url: '' })
      setProductoMantenimientoId('')
      
      await cargarProductos()
      await abrirMantenimiento()
    } catch (error) {
      console.error('💥 Error catch:', error)
      setMensaje('❌ Error al aplicar mantenimiento')
    }
  }
  const seleccionarArchivoMantenimiento = () => {
    inputArchivoMantenimientoRef.current?.click()
  }
  const convertirArchivoABase64 = (archivo) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
      reader.readAsDataURL(archivo)
    })
  const subirImagenAlServidor = async (archivo) => {
    const token = localStorage.getItem('token')
    const imageData = await convertirArchivoABase64(archivo)
    const response = await fetch(`${API_URL}/uploads/productos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        image_data: imageData,
        file_name: archivo.name || 'producto'
      })
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data?.error || 'No se pudo subir la imagen')
    }
    return data?.url || data?.relative_url || ''
  }
  const cargarArchivoMantenimiento = async (e) => {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    if (!archivo.type.startsWith('image/')) {
      setMensaje('❌ Debes seleccionar un archivo de imagen')
      return
    }
    if (archivo.size > 5 * 1024 * 1024) {
      setMensaje('❌ La imagen no debe superar 5MB')
      return
    }
    try {
      setSubiendoImagenMantenimiento(true)
      const urlImagen = await subirImagenAlServidor(archivo)
      setMantenimientoForm((prev) => ({ ...prev, imagen_url: urlImagen }))
      setMensaje('✅ Imagen subida y URL aplicada en mantenimiento')
      setTimeout(() => setMensaje(''), 3000)
    } catch {
      setMensaje('❌ Error al subir imagen al servidor')
    } finally {
      setSubiendoImagenMantenimiento(false)
      e.target.value = ''
    }
  }
  const inputArchivoNuevoRef = useRef(null)
  const seleccionarArchivoNuevo = () => {
    inputArchivoNuevoRef.current?.click()
  }
  const cargarArchivoNuevo = async (e) => {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    if (!archivo.type.startsWith('image/')) {
      setMensaje('❌ Debes seleccionar un archivo de imagen')
      return
    }
    if (archivo.size > 5 * 1024 * 1024) {
      setMensaje('❌ La imagen no debe superar 5MB')
      return
    }
    try {
      setSubiendoImagenNuevo(true)
      const urlImagen = await subirImagenAlServidor(archivo)
      setNuevoProducto((prev) => ({ ...prev, imagen_url: urlImagen }))
      setMensaje('✅ Imagen subida y lista para crear producto')
      setTimeout(() => setMensaje(''), 3000)
    } catch {
      setMensaje('❌ Error al subir imagen del nuevo producto')
    } finally {
      setSubiendoImagenNuevo(false)
      e.target.value = ''
    }
  }

  return (
    <div className="space-y-5 p-2 sm:p-3">
      <div className="space-y-2">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Productos Finales</h1>
        <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
          {esAdmin && (
            <button
              onClick={() => navigate('/productos-disponibles')}
              className="flex-1 sm:flex-none min-w-0 bg-cyan-700 text-white px-3 py-2 rounded-lg hover:bg-cyan-800 flex items-center justify-center text-sm whitespace-nowrap"
              title="Ver pantalla de productos disponibles (seguimiento)"
              aria-label="Seguimiento"
            >
              <Eye className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Seguimiento</span>
            </button>
          )}
          <button 
            onClick={cargarProductos}
            className="flex-1 sm:flex-none min-w-0 bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 flex items-center justify-center text-sm whitespace-nowrap"
            title="Recargar productos"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={cargarGananciaPorProducto}
            className="flex-1 sm:flex-none min-w-0 bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 flex items-center justify-center text-sm whitespace-nowrap"
            title="Calcular ganancia por producto"
            aria-label="Ganancia por producto"
          >
            <TrendingUp className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">{cargandoGanancia ? 'Calculando...' : 'Ganancia por producto'}</span>
          </button>
          {esAdmin && (
            <button
              onClick={abrirMantenimiento}
              className="flex-1 sm:flex-none min-w-0 bg-slate-700 text-white px-3 py-2 rounded-lg hover:bg-slate-800 flex items-center justify-center text-sm whitespace-nowrap"
              title="Mantenimiento de productos"
              aria-label="Mantenimiento"
            >
              <Settings className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Mantenimiento</span>
            </button>
          )}
          <button 
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            className="flex-1 sm:flex-none min-w-0 bg-orange-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center justify-center text-sm whitespace-nowrap"
            aria-label={mostrarFormulario ? 'Cerrar formulario' : 'Nuevo producto'}
          >
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">{mostrarFormulario ? 'Cerrar' : 'Nuevo Producto'}</span>
          </button>
        </div>
      </div>

      {mensaje && (
        <div className={`p-3 rounded-lg text-center text-sm font-medium ${mensaje.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {mensaje}
        </div>
      )}

      {mostrarFormulario && (
        <form onSubmit={agregarProducto} className="bg-white p-3 sm:p-6 rounded-lg shadow space-y-4 border-2 border-orange-100">
          {/* Primera fila: campos principales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Nombre del producto"
              value={nuevoProducto.nombre}
              onChange={(e) => setNuevoProducto({...nuevoProducto, nombre: e.target.value})}
              className="border rounded-lg px-3 py-2 text-sm"
              required
            />
            <select
              value={nuevoProducto.tipo_producto}
              onChange={(e) => setNuevoProducto({...nuevoProducto, tipo_producto: e.target.value, animal_origen: e.target.value === 'corte' ? nuevoProducto.animal_origen : ''})}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="producido">Producto producido</option>
              <option value="corte">Corte</option>
            </select>
            <select
              value={nuevoProducto.categoria}
              onChange={(e) => setNuevoProducto({...nuevoProducto, categoria: e.target.value})}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              {categorias.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {nuevoProducto.tipo_producto === 'corte' && (
              <select
                value={nuevoProducto.animal_origen}
                onChange={(e) => setNuevoProducto({...nuevoProducto, animal_origen: e.target.value})}
                className="border rounded-lg px-3 py-2 text-sm"
                required
              >
                <option value="">Animal de origen...</option>
                <option value="Cerdo">Cerdo</option>
                <option value="Res">Res</option>
                <option value="Pollo">Pollo</option>
                <option value="Cordero">Cordero</option>
                <option value="Otro">Otro</option>
              </select>
            )}
            {nuevoProducto.tipo_producto === 'corte' && (
              <input
                type="number"
                step="0.01"
                placeholder="Precio en canal ($)"
                value={nuevoProducto.precio_canal}
                onChange={(e) => setNuevoProducto({...nuevoProducto, precio_canal: e.target.value})}
                className="border rounded-lg px-3 py-2 text-sm"
              />
            )}
            <input
              type="number"
              step="0.01"
              placeholder="Precio de venta ($)"
              value={nuevoProducto.precio}
              onChange={(e) => setNuevoProducto({...nuevoProducto, precio: e.target.value})}
              className="border rounded-lg px-3 py-2 text-sm"
              required
            />
            <input
              type="url"
              placeholder="URL de imagen del producto"
              value={nuevoProducto.imagen_url}
              onChange={(e) => setNuevoProducto({...nuevoProducto, imagen_url: e.target.value})}
              className="border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="border rounded-lg p-2 bg-slate-50">
              <p className="text-xs text-gray-500 mb-1">Vista previa de imagen</p>
              <img
                src={getImageUrl(nuevoProducto.imagen_url) || imagenFallback}
                alt="Vista previa nuevo producto"
                className="w-full h-32 object-cover rounded border"
                onError={(e) => { e.currentTarget.src = imagenFallback }}
              />
            </div>
            <div className="border rounded-lg p-2 bg-slate-50 text-xs text-gray-600 flex items-center">
              Si no colocas URL, se usará la imagen por defecto.
            </div>
            <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
              <input
                ref={inputArchivoNuevoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={cargarArchivoNuevo}
              />
              <button
                type="button"
                onClick={seleccionarArchivoNuevo}
                disabled={subiendoImagenNuevo}
                className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-60"
              >
                {subiendoImagenNuevo ? 'Subiendo imagen...' : 'Seleccionar imagen y subir'}
              </button>
            </div>
          </div>
          
          {/* Segunda fila: cantidad, peso y stock - siempre horizontal */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Piezas</label>
              <input
                type="number"
                placeholder="10"
                value={nuevoProducto.cantidad_piezas}
                onChange={(e) => setNuevoProducto({...nuevoProducto, cantidad_piezas: e.target.value})}
                className="border rounded-lg px-2 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Peso (kg)</label>
              <input
                type="number"
                step="0.1"
                placeholder="2.5"
                value={nuevoProducto.peso_total}
                onChange={(e) => setNuevoProducto({...nuevoProducto, peso_total: e.target.value})}
                className="border rounded-lg px-2 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Stock</label>
              <div className="bg-gray-100 border rounded-lg px-2 py-2 text-sm text-gray-600">
                {(() => {
                  const porUnidad = esProductoPorUnidadExacta(nuevoProducto)
                  const piezas = parseInt(nuevoProducto.cantidad_piezas || '0', 10) || 0
                  const peso = parseFloat(nuevoProducto.peso_total || '0') || 0
                  if (porUnidad) {
                    const unidades = piezas > 0 ? piezas : Math.max(0, Math.floor(peso / PESO_UNIDAD_HAMBURGUESA_KG))
                    const pesoTotal = unidades * PESO_UNIDAD_HAMBURGUESA_KG
                    return `${unidades} und · ${formatearKg(pesoTotal)} kg`
                  }
                  return `${formatearKg(peso)} kg`
                })()}
              </div>
            </div>
          </div>
          
          {/* Botón guardar en fila separada */}
          <div className="flex justify-center">
            <button type="submit" className="w-full sm:w-auto bg-orange-600 text-white px-8 py-2 rounded-lg hover:bg-orange-700 text-sm">
              Guardar Producto
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        {cargando && (
          <div className="p-6 text-center text-gray-500">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-orange-500" />
          </div>
        )}

        {/* Vista móvil: tarjetas */}
        <div className="block sm:hidden divide-y divide-gray-200">
          {productos.map((p) => (
            <div key={p.id} className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <img
                      src={getImageUrl(p?.imagen_url) || imagenFallback}
                      alt={p?.nombre || 'Producto'}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded object-cover border shrink-0"
                      onError={(e) => { e.currentTarget.src = imagenFallback }}
                    />
                    <p className="font-medium text-sm truncate">{p.nombre}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span className={`px-2 py-0.5 rounded text-[11px] ${esCorte(p) ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {esCorte(p) ? `Corte${p.animal_origen ? ` · ${p.animal_origen}` : ''}` : 'Producido'}
                    </span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[11px]">{p.categoria}</span>
                  </div>
                  <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5">
                    <span className="text-[11px] text-gray-500">Precio:</span>
                    <span className="text-[11px] font-medium text-right">${p.precio.toFixed(2)}</span>
                    <span className="text-[11px] text-gray-500">Piezas:</span>
                    <span className="text-[11px] font-medium text-right">{p.cantidad_piezas || 0}</span>
                    <span className="text-[11px] text-gray-500">Peso:</span>
                    <span className="text-[11px] font-medium text-right">{formatearKg(p.peso_total)} kg</span>
                    {esCorte(p) && (
                      <>
                        <span className="text-[11px] text-gray-500">Canal:</span>
                        <span className="text-[11px] font-medium text-right">${(parseFloat(p.precio_canal) || 0).toFixed(2)}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="w-[106px] shrink-0 flex flex-col items-end gap-2">
                  <div className={`text-[11px] font-semibold flex items-center ${Number(p.stock || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <span
                      className={`inline-block w-2 h-2 rounded-full mr-1.5 align-middle ${Number(p.stock || 0) > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                      title={Number(p.stock || 0) > 0 ? 'Con stock' : 'Sin stock'}
                    />
                  </div>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {esAdmin && (
                      <button
                        onClick={() => abrirAgregarExistencia(p)}
                        className="bg-green-600 text-white rounded-lg w-8 h-8 text-[11px] font-medium flex items-center justify-center hover:bg-green-700"
                        title="Agregar existencia"
                        aria-label={`Agregar existencia a ${p.nombre}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {esCorte(p) && (
                      <button
                        onClick={() => abrirModificarCorte(p)}
                        className="bg-blue-600 text-white rounded-lg w-8 h-8 text-[11px] font-medium flex items-center justify-center hover:bg-blue-700"
                        title="Modificar corte"
                        aria-label={`Modificar corte ${p.nombre}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {esAdmin && (
                      <button
                        onClick={() => eliminarProducto(p.id)}
                        className="bg-red-100 text-red-700 rounded-lg w-8 h-8 text-[11px] font-medium flex items-center justify-center hover:bg-red-200"
                        title="Eliminar producto"
                        aria-label={`Eliminar ${p.nombre}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <IconoProducto producto={p} className="text-4xl" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Vista escritorio: tabla */}
        <table className="hidden sm:table w-full">
          <thead className="bg-gray-100 text-gray-700 text-sm">
            <tr>
              <th className="px-4 py-3 text-left">Producto</th>
              <th className="px-4 py-3 text-left">Categoría</th>
              <th className="px-4 py-3 text-left">Precio</th>
              <th className="px-4 py-3 text-center">Piezas</th>
              <th className="px-4 py-3 text-center">Peso (kg)</th>
              <th className="px-4 py-3 text-left">Stock Actual</th>
              <th className="px-4 py-3 text-center">Tipo</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {productos.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-2">
                    <img
                      src={getImageUrl(p.imagen_url) || imagenFallback}
                      alt={p.nombre}
                      className="w-12 h-10 rounded object-cover border"
                      onError={(e) => { e.currentTarget.src = imagenFallback }}
                    />
                    <span>{p.nombre}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <span className={`px-2 py-1 rounded text-[11px] w-fit ${esCorte(p) ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {esCorte(p) ? `Corte${p.animal_origen ? ` · ${p.animal_origen}` : ''}` : 'Producido'}
                    </span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs w-fit">{p.categoria}</span>
                  </div>
                </td>
                <td className="px-4 py-3">${p.precio.toFixed(2)}</td>
                <td className="px-4 py-3 text-center">{p.cantidad_piezas || 0}</td>
                <td className="px-4 py-3 text-center">{formatearKg(p.peso_total)} kg</td>
                <td className="px-4 py-3">
                  <span className={`text-sm font-medium flex items-center ${Number(p.stock || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <span
                      className={`inline-block w-2.5 h-2.5 rounded-full align-middle ${Number(p.stock || 0) > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                      title={Number(p.stock || 0) > 0 ? 'Con stock' : 'Sin stock'}
                    />
                  </span>
                  {esCorte(p) && (
                    <div className="text-[11px] text-gray-500 mt-1">
                      Canal: ${(parseFloat(p.precio_canal) || 0).toFixed(2)}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <IconoProducto producto={p} className="text-4xl" />
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="inline-flex items-center gap-1.5">
                      {esAdmin && (
                        <button onClick={() => abrirAgregarExistencia(p)} className="bg-green-600 text-white px-2.5 py-1 rounded text-xs hover:bg-green-700" title="Agregar existencia">
                          Agregar
                        </button>
                      )}
                      {esCorte(p) && (
                        <button onClick={() => abrirModificarCorte(p)} className="bg-blue-600 text-white px-2.5 py-1 rounded text-xs hover:bg-blue-700" title="Modificar corte">
                          Modificar
                        </button>
                      )}
                      {esAdmin && (
                        <button onClick={() => eliminarProducto(p.id)} className="bg-red-100 text-red-700 px-2.5 py-1 rounded text-xs hover:bg-red-200">
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {productos.length === 0 && !cargando && (
          <div className="p-12 text-center text-gray-500">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>No hay productos registrados</p>
          </div>
        )}
      </div>

      {productoEditandoCorte && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-4 space-y-3">
            <h3 className="font-bold text-gray-800 text-sm sm:text-base">
              Modificar corte: {productoEditandoCorte.nombre}
            </h3>
            <p className="text-xs text-gray-500">
              Incrementa piezas y peso. Ejemplo: 6 piezas y 12kg.
            </p>
            <form onSubmit={guardarIncrementoCorte} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Piezas +</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={formIncremento.piezas}
                    onChange={(e) => setFormIncremento({ ...formIncremento, piezas: e.target.value })}
                    placeholder="6"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Peso kg +</label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={formIncremento.peso_kg}
                    onChange={(e) => setFormIncremento({ ...formIncremento, peso_kg: e.target.value })}
                    placeholder="12"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Precio en canal ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={formIncremento.precio_canal}
                  onChange={(e) => setFormIncremento({ ...formIncremento, precio_canal: e.target.value })}
                  placeholder="Ej: 4.50"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700">
                  Guardar incremento
                </button>
                <button type="button" onClick={cerrarModificarCorte} className="flex-1 bg-gray-100 rounded-lg py-2 text-sm hover:bg-gray-200">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {productoAgregandoExistencia && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-4 space-y-3">
            <h3 className="font-bold text-gray-800 text-sm sm:text-base">
              Agregar existencia: {productoAgregandoExistencia.nombre}
            </h3>
            <form onSubmit={guardarAgregarExistencia} className="space-y-3">
              {!esCorte(productoAgregandoExistencia) && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cantidad a agregar</label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={formAgregarExistencia.cantidad}
                    onChange={(e) => setFormAgregarExistencia({ ...formAgregarExistencia, cantidad: e.target.value })}
                    placeholder="Ej: 5"
                  />
                </div>
              )}
              {esCorte(productoAgregandoExistencia) && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Piezas +</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      value={formAgregarExistencia.piezas}
                      onChange={(e) => setFormAgregarExistencia({ ...formAgregarExistencia, piezas: e.target.value })}
                      placeholder="6"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Peso kg +</label>
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      value={formAgregarExistencia.peso_kg}
                      onChange={(e) => setFormAgregarExistencia({ ...formAgregarExistencia, peso_kg: e.target.value })}
                      placeholder="12"
                    />
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button type="submit" className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm hover:bg-green-700">
                  Agregar
                </button>
                <button type="button" onClick={cerrarAgregarExistencia} className="flex-1 bg-gray-100 rounded-lg py-2 text-sm hover:bg-gray-200">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {mostrarGanancia && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-4xl rounded-xl shadow-xl p-4 space-y-3 max-h-[85vh] overflow-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800 text-sm sm:text-base">Ganancia por producto</h3>
              <button
                type="button"
                onClick={() => setMostrarGanancia(false)}
                className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-200"
              >
                Cerrar
              </button>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left px-3 py-2">Producto</th>
                    <th className="text-left px-3 py-2">Tipo</th>
                    <th className="text-right px-3 py-2">Ingresos</th>
                    <th className="text-right px-3 py-2">Costo</th>
                    <th className="text-right px-3 py-2">Ganancia</th>
                    <th className="text-right px-3 py-2">Margen</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {gananciaPorProducto.map((g) => (
                    <tr key={g.producto_id}>
                      <td className="px-3 py-2">{g.producto_nombre}</td>
                      <td className="px-3 py-2">
                        {String(g.tipo_producto || '').toLowerCase() === 'corte'
                          ? `Corte${g.precio_canal ? ` · Canal $${Number(g.precio_canal).toFixed(2)}` : ''}`
                          : 'Producido'}
                      </td>
                      <td className="px-3 py-2 text-right">${Number(g.ingresos_venta || 0).toFixed(2)}</td>
                      <td className="px-3 py-2 text-right">${Number(g.costo_estimado_total || 0).toFixed(2)}</td>
                      <td className={`px-3 py-2 text-right font-semibold ${Number(g.ganancia_estimada || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        ${Number(g.ganancia_estimada || 0).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right">{Number(g.margen_porcentaje || 0).toFixed(2)}%</td>
                    </tr>
                  ))}
                  {gananciaPorProducto.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center text-gray-500 py-5">Sin datos de ventas para calcular</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {mostrarMantenimiento && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-5xl rounded-xl shadow-xl p-4 space-y-4 max-h-[88vh] overflow-auto relative">
            <div className="flex items-center justify-between sticky top-0 bg-white pb-2 border-b">
              <h3 className="font-bold text-gray-800 text-sm sm:text-base">Mantenimiento de productos</h3>
              <button
                type="button"
                onClick={() => setMostrarMantenimiento(false)}
                className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-200"
              >
                Cerrar
              </button>
            </div>

            <form 
              onSubmit={aplicarMantenimiento} 
              className="grid grid-cols-1 md:grid-cols-2 gap-3 border rounded-lg p-3 bg-slate-50"
              id="mantenimiento-form"
              onInvalid={(e) => {
                console.log('❌ Formulario inválido:', e.target.name, e.target.validationMessage);
                setMensaje('❌ Por favor completa todos los campos requeridos');
              }}
            >
              <select
                value={productoMantenimientoId}
                onChange={(e) => setProductoMantenimientoId(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
                required
              >
                <option value="">Selecciona producto...</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} {esCorte(p) ? '(Corte)' : '(Producido)'}
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                placeholder="Nuevo precio venta ($)"
                value={mantenimientoForm.precio}
                onChange={(e) => setMantenimientoForm({ ...mantenimientoForm, precio: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Nuevo precio canal ($)"
                value={mantenimientoForm.precio_canal}
                onChange={(e) => setMantenimientoForm({ ...mantenimientoForm, precio_canal: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="url"
                placeholder="URL de imagen del producto"
                value={mantenimientoForm.imagen_url}
                onChange={(e) => setMantenimientoForm({ ...mantenimientoForm, imagen_url: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm"
              />
              <div className="md:col-span-2 flex flex-wrap items-center gap-2">
                <input
                  ref={inputArchivoMantenimientoRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={cargarArchivoMantenimiento}
                />
                <button
                  type="button"
                  onClick={seleccionarArchivoMantenimiento}
                  disabled={subiendoImagenMantenimiento}
                  className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-60"
                >
                  {subiendoImagenMantenimiento ? 'Cargando imagen...' : 'Seleccionar imagen desde directorio'}
                </button>
                <span className="text-xs text-gray-500">
                  También puedes pegar URL manualmente.
                </span>
              </div>
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="border rounded-lg p-2 bg-white">
                  <p className="text-xs text-gray-500 mb-1">Imagen actual</p>
                  <img
                    src={getImageUrl(productoMantenimientoSeleccionado?.imagen_url) || imagenFallback}
                    alt="Imagen actual"
                    className="w-full h-32 object-cover rounded border"
                    onError={(e) => { e.currentTarget.src = imagenFallback }}
                  />
                </div>
                <div className="border rounded-lg p-2 bg-white">
                  <p className="text-xs text-gray-500 mb-1">Vista previa nueva URL</p>
                  <img
                    src={getImageUrl(mantenimientoForm.imagen_url) || imagenFallback}
                    alt="Vista previa"
                    className="w-full h-32 object-cover rounded border"
                    onError={(e) => { e.currentTarget.src = imagenFallback }}
                  />
                </div>
              </div>
              <div className="md:col-span-2 flex justify-end gap-2">
                <button 
                  type="button"  // Cambiado a type="button" para evitar conflicto con form
                  onClick={async (e) => {
                    console.log('🔘 Botón clickeado - ejecutando mantenimiento directamente');
                    
                    if (!productoMantenimientoId) {
                      console.log('❌ No hay producto seleccionado');
                      setMensaje('❌ Debes seleccionar un producto');
                      return;
                    }
                    
                    // Validar cambios
                    const precio = mantenimientoForm.precio !== '' ? parseFloat(mantenimientoForm.precio) : null;
                    const precio_canal = mantenimientoForm.precio_canal !== '' ? parseFloat(mantenimientoForm.precio_canal) : null;
                    const imagen_url = (mantenimientoForm.imagen_url || '').trim();
                    
                    console.log('💰 Valores a procesar:', { precio, precio_canal, imagen_url });
                    
                    if (precio === null && precio_canal === null && !imagen_url) {
                      console.log('❌ No hay cambios para aplicar');
                      setMensaje('❌ Debes indicar al menos un cambio (precio, precio canal o imagen)');
                      return;
                    }
                    
                    // Ejecutar la misma lógica que aplicarMantenimiento pero directamente
                    try {
                      const token = localStorage.getItem('token');
                      const usuario = (() => { try { return JSON.parse(localStorage.getItem('usuario') || '{}') } catch { return {} } })();
                      
                      // Verificar si el usuario tiene permisos
                      if (!token) {
                        console.log('❌ No hay token de autenticación');
                        setMensaje('❌ Debes iniciar sesión para realizar cambios');
                        return;
                      }
                      
                      if (!usuario || usuario.rol !== 'admin') {
                        console.log('❌ Usuario no tiene permisos de administrador');
                        setMensaje('❌ Solo los administradores pueden realizar mantenimiento');
                        return;
                      }
                      
                      const url = `${API_URL}/productos/${productoMantenimientoId}/mantenimiento`;
                      
                      const requestBody = { precio, precio_canal, imagen_url: imagen_url || null };
                      
                      const response = await fetch(url, {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify(requestBody)
                      });
                      
                      // Manejar diferentes tipos de respuesta
                      let data;
                      const contentType = response.headers.get('content-type');
                      if (contentType && contentType.includes('application/json')) {
                        data = await response.json();
                      } else {
                        const text = await response.text();
                        data = { error: text || 'Error desconocido' };
                      }
                      
                      if (!response.ok) {
                        console.log('❌ Error en respuesta:', data.error);
                        
                        // Mensajes específicos según el error
                        if (response.status === 401) {
                          setMensaje('❌ Sesión expirada. Por favor inicia sesión nuevamente');
                        } else if (response.status === 403) {
                          setMensaje('❌ No tienes permisos para realizar esta acción');
                        } else if (response.status === 404) {
                          setMensaje('❌ El endpoint de mantenimiento no existe. Contacta al administrador');
                        } else if (response.status === 500) {
                          setMensaje('❌ Error del servidor. Intenta nuevamente más tarde');
                        } else {
                          setMensaje(`❌ ${data.error || 'No se pudo aplicar mantenimiento'}`);
                        }
                        return;
                      }
                      
                      setMensaje('✅ Mantenimiento aplicado correctamente');
                      setTimeout(() => setMensaje(''), 3000);
                      
                      // Limpiar y recargar
                      setMantenimientoForm({ precio: '', precio_canal: '', imagen_url: '' });
                      setProductoMantenimientoId('');
                      await cargarProductos();
                      await abrirMantenimiento();
                      
                    } catch (error) {
                      console.error('💥 Error en ejecución directa:', error);
                      setMensaje('❌ Error de conexión. Verifica tu internet e intenta nuevamente');
                    }
                  }}
                  className="bg-slate-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-800"
                >
                  Aplicar mantenimiento
                </button>
              </div>
            </form>

            <div className="rounded-lg border overflow-hidden">
              <div className="bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700">
                Tabla de modificaciones (precio e imagen)
              </div>
              <div className="max-h-[380px] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2">Fecha</th>
                      <th className="text-left px-3 py-2">Producto</th>
                      <th className="text-left px-3 py-2">Tipo</th>
                      <th className="text-left px-3 py-2">Anterior</th>
                      <th className="text-left px-3 py-2">Nuevo</th>
                      <th className="text-left px-3 py-2">Usuario</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {historialMantenimiento.map((h, index) => {
                      return (
                        <tr key={h.id}>
                          <td className="px-3 py-2">{new Date(h.fecha).toLocaleString('es-VE')}</td>
                          <td className="px-3 py-2">{h.producto_nombre || `ID ${h.producto_id}`}</td>
                          <td className="px-3 py-2">{h.tipo_modificacion}</td>
                          <td className="px-3 py-2">{h.valor_anterior ? (h.tipo_modificacion === 'imagen' ? getImageUrl(h.valor_anterior) : h.valor_anterior) : '-'}</td>
                          <td className="px-3 py-2">{h.valor_nuevo ? (h.tipo_modificacion === 'imagen' ? getImageUrl(h.valor_nuevo) : h.valor_nuevo) : '-'}</td>
                          <td className="px-3 py-2">{h.usuario || 'sistema'}</td>
                        </tr>
                      )
                    })}
                    {historialMantenimiento.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center text-gray-500 py-5">Sin modificaciones registradas</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
