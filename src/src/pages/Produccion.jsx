import { useState, useEffect } from 'react'
import React from 'react'
import { Factory, Plus, AlertTriangle, CheckCircle, History, Package, Beaker, Pencil, Trash2, X } from 'lucide-react'

import API_URL from '../config'

export default function Produccion() {
  const [recetas, setRecetas] = useState([])
  const [ingredientes, setIngredientes] = useState([])
  const [productos, setProductos] = useState([])
  const [historialProduccion, setHistorialProduccion] = useState([])
  const [configProteinas, setConfigProteinas] = useState([])
  const [categorias, setCategorias] = useState([])
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [detalleUltimaProduccion, setDetalleUltimaProduccion] = useState(null)
  const [cargandoUltimaProduccion, setCargandoUltimaProduccion] = useState(false)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [mostrarConfigProteinas, setMostrarConfigProteinas] = useState(false)
  const [recetaEditando, setRecetaEditando] = useState(null)
  const [nuevoPatronProteina, setNuevoPatronProteina] = useState('')
  const [editandoPatronId, setEditandoPatronId] = useState(null)
  const [patronEditando, setPatronEditando] = useState('')
  
  const [nuevaReceta, setNuevaReceta] = useState({
    nombre: '',
    productoId: '',
    rendimiento: '1',
    ingredientes: [{ ingredienteId: '', cantidad: '' }]
  })

  // Función para obtener emoji según categoría
  const getCategoriaEmoji = (categoria) => {
    const emojis = {
      'Chorizos': '🌭',
      'Hamburguesas': '🍔',
      'Chistorras': '🌶️',
      'Quesos': '🧀',
      'Curados': '🥓',
      'Lácteos': '🥛',
      'Carnes Frías': '🥩',
      'Aderezos': '🥫',
      'Otros': '📦'
    }
    return emojis[categoria] || '📦'
  }
  
  const normalizarTexto = (v) =>
    String(v || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      
  const esProteina = (nombre) => {
    const n = normalizarTexto(nombre)
    const reglasActivas = (configProteinas || [])
      .filter(r => r.activo !== false)
      .map(r => normalizarTexto(r.patron))
      .filter(Boolean)
    const base = reglasActivas.length > 0 ? reglasActivas : ['pollo', 'cerdo', 'res', 'cordero', 'manteca']
    return base.some(p => n.includes(p))
  }
  
  const usuarioActual = (() => { try { return JSON.parse(localStorage.getItem('usuario') || '{}') } catch { return {} } })()
  const esAdmin = usuarioActual?.rol === 'admin'
  
  const authHeaders = (json = false) => {
    const token = localStorage.getItem('token')
    const h = {}
    if (token) h.Authorization = `Bearer ${token}`
    if (json) h['Content-Type'] = 'application/json'
    return h
  }

  // Función helper para hacer fetch con manejo de errores
  const fetchConManejo = async (url, opciones = {}) => {
    try {
      const res = await fetch(url, opciones)
      if (!res.ok) {
        // Si es 404, retornamos null para manejarlo como "no encontrado" pero no error crítico
        if (res.status === 404) return null
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }
      return await res.json()
    } catch (error) {
      console.warn(`Error fetching ${url}:`, error)
      return null
    }
  }

  const cargarDatos = async () => {
    try {
      // Cargar datos principales (requeridos)
      const [resR, resI, resP, resH] = await Promise.all([
        fetch(`${API_URL}/recetas`),
        fetch(`${API_URL}/ingredientes`),
        fetch(`${API_URL}/productos`),
        fetch(`${API_URL}/produccion/historial`)
      ])

      // Verificar que las respuestas principales sean OK
      if (!resR.ok || !resI.ok || !resP.ok || !resH.ok) {
        throw new Error('Error al cargar datos principales')
      }

      const [recetasData, ingredientesData, productosData, historialData] = await Promise.all([
        resR.json(),
        resI.json(),
        resP.json(),
        resH.json()
      ])

      // Cargar config de proteínas (opcional - si falla, usa array vacío)
      const configData = await fetchConManejo(`${API_URL}/produccion/config-proteinas`)
      
      console.log('🔍 Productos cargados:', productosData)
      
      // Extraer categorías únicas de los productos
      const categoriasUnicas = [...new Set(productosData.map(p => p.categoria))].sort()
      console.log('🔍 Categorías únicas encontradas:', categoriasUnicas)
      
      setRecetas(recetasData)
      setIngredientes(ingredientesData)
      setProductos(productosData)
      setHistorialProduccion(historialData)
      setConfigProteinas(configData || []) // Si es null, usa array vacío
      setCategorias(categoriasUnicas)
      
      // Si config-proteinas no existe, mostrar mensaje informativo una sola vez
      if (configData === null && esAdmin) {
        console.info('ℹ️ Endpoint config-proteinas no disponible (404). Usando valores por defecto.')
      }
      
    } catch (e) { 
      console.error('Error en cargarDatos:', e)
      setMensaje('❌ Error al sincronizar datos') 
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const agregarPatronProteina = async () => {
    const patron = normalizarTexto(nuevoPatronProteina)
    if (!patron) return
    try {
      const r = await fetch(`${API_URL}/produccion/config-proteinas`, {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({ patron, descripcion: 'Configurado por administrador', activo: true })
      })
      const data = await r.json()
      if (!r.ok) {
        setMensaje(`❌ ${data.error || 'No se pudo crear el patrón'}`)
        setTimeout(() => setMensaje(''), 3000)
        return
      }
      setNuevoPatronProteina('')
      setConfigProteinas((prev) => [...prev, data])
      setMensaje('✅ Patrón agregado')
      setTimeout(() => setMensaje(''), 2000)
    } catch {
      setMensaje('❌ Error al agregar patrón')
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  const guardarEdicionPatron = async (id) => {
    const patron = normalizarTexto(patronEditando)
    if (!patron) return
    try {
      const r = await fetch(`${API_URL}/produccion/config-proteinas/${id}`, {
        method: 'PUT',
        headers: authHeaders(true),
        body: JSON.stringify({ patron })
      })
      const data = await r.json()
      if (!r.ok) {
        setMensaje(`❌ ${data.error || 'No se pudo actualizar el patrón'}`)
        setTimeout(() => setMensaje(''), 3000)
        return
      }
      setConfigProteinas((prev) => prev.map((p) => (p.id === id ? data : p)))
      setEditandoPatronId(null)
      setPatronEditando('')
      setMensaje('✅ Patrón actualizado')
      setTimeout(() => setMensaje(''), 2000)
    } catch {
      setMensaje('❌ Error al actualizar patrón')
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  const eliminarPatron = async (id) => {
    if (!confirm('¿Eliminar este patrón de proteína?')) return
    try {
      const r = await fetch(`${API_URL}/produccion/config-proteinas/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      })
      if (!r.ok) {
        const data = await r.json().catch(() => ({}))
        setMensaje(`❌ ${data.error || 'No se pudo eliminar'}`)
        setTimeout(() => setMensaje(''), 3000)
        return
      }
      setConfigProteinas((prev) => prev.filter((p) => p.id !== id))
      setMensaje('✅ Patrón eliminado')
      setTimeout(() => setMensaje(''), 2000)
    } catch {
      setMensaje('❌ Error al eliminar patrón')
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  const togglePatronActivo = async (patron) => {
    try {
      const r = await fetch(`${API_URL}/produccion/config-proteinas/${patron.id}`, {
        method: 'PUT',
        headers: authHeaders(true),
        body: JSON.stringify({ activo: !(patron.activo !== false) })
      })
      const data = await r.json()
      if (!r.ok) {
        setMensaje(`❌ ${data.error || 'No se pudo actualizar el estado'}`)
        setTimeout(() => setMensaje(''), 3000)
        return
      }
      setConfigProteinas((prev) => prev.map((p) => (p.id === patron.id ? data : p)))
      setMensaje('✅ Estado actualizado')
      setTimeout(() => setMensaje(''), 2000)
    } catch {
      setMensaje('❌ Error al actualizar estado')
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  // Función para iniciar edición con datos completos
  const iniciarEdicion = (receta) => {
    // Mapear los ingredientes de la receta al formato del formulario
    const ingredientesFormateados = receta.ingredientes.map(ing => ({
      ingredienteId: ing.ingrediente_id.toString(),
      cantidad: ing.cantidad.toString()
    }))

    if (ingredientesFormateados.length === 0) {
      ingredientesFormateados.push({ ingredienteId: '', cantidad: '' })
    }

    setRecetaEditando({
      id: receta.id,
      nombre: receta.nombre,
      productoId: receta.producto_id ? receta.producto_id.toString() : '',
      rendimiento: '1',
      ingredientes: ingredientesFormateados
    })
    
    setMostrarFormulario(true)
  }

  const guardarReceta = async (e) => {
    e.preventDefault()
    setCargando(true)
    
    const esEdicion = Boolean(recetaEditando?.id)
    const dataAEnviar = esEdicion ? recetaEditando : nuevaReceta
    const url = esEdicion ? `${API_URL}/recetas/${recetaEditando.id}` : `${API_URL}/recetas`
    const metodo = esEdicion ? 'PUT' : 'POST'

    try {
      const productoCoincidente = productos.find(
        (p) => normalizarTexto(p.nombre) === normalizarTexto(dataAEnviar.nombre)
      )
      if (!productoCoincidente) {
        setMensaje(`❌ No existe producto final con el nombre "${dataAEnviar.nombre}". Créalo en Productos con ese mismo nombre.`)
        setCargando(false)
        return
      }

      const totalProteinas = (dataAEnviar.ingredientes || []).reduce((acc, ing) => {
        const ingDb = ingredientes.find(i => Number(i.id) === Number(ing.ingredienteId))
        const porcentaje = parseFloat(ing.cantidad) || 0
        if (!ingDb || !esProteina(ingDb.nombre)) return acc
        return acc + porcentaje
      }, 0)
      
      if (Math.abs(totalProteinas - 100) > 0.001) {
        setMensaje(`❌ Las proteínas deben totalizar 100%. Total actual: ${totalProteinas.toFixed(3)}%`)
        setCargando(false)
        return
      }

      const response = await fetch(url, {
        method: metodo,
        headers: authHeaders(true), // Agregado auth headers que faltaba
        body: JSON.stringify({
          ...dataAEnviar,
          categoria: productoCoincidente.categoria,
          productoId: String(productoCoincidente.id)
        })
      })

      if (response.ok) {
        setMensaje(esEdicion ? '✅ Receta actualizada' : '✅ Receta creada')
        setRecetaEditando(null)
        setMostrarFormulario(false)
        setNuevaReceta({ nombre: '', productoId: '', rendimiento: '1', ingredientes: [{ ingredienteId: '', cantidad: '' }] })
        cargarDatos()
        setTimeout(() => setMensaje(''), 3000)
      } else {
        const err = await response.json()
        setMensaje(`❌ Error: ${err.error || 'No se pudo guardar'}`)
      }
    } catch (error) {
      setMensaje('❌ Error de red')
    } finally { setCargando(false) }
  }

  const manejarCambioIngrediente = (index, campo, valor) => {
    const esEdicion = Boolean(recetaEditando)
    const base = esEdicion ? { ...recetaEditando } : { ...nuevaReceta }
    const nuevosIngredientes = [...base.ingredientes]
    
    nuevosIngredientes[index] = { ...nuevosIngredientes[index], [campo]: valor }
    
    if (esEdicion) setRecetaEditando({ ...base, ingredientes: nuevosIngredientes })
    else setNuevaReceta({ ...base, ingredientes: nuevosIngredientes })
  }

  const añadirFilaIngrediente = () => {
    const esEdicion = Boolean(recetaEditando)
    const base = esEdicion ? recetaEditando : nuevaReceta
    const setter = esEdicion ? setRecetaEditando : setNuevaReceta
    setter({ ...base, ingredientes: [...base.ingredientes, { ingredienteId: '', cantidad: '' }] })
  }

  const eliminarFilaIngrediente = (index) => {
    const esEdicion = Boolean(recetaEditando)
    const base = esEdicion ? { ...recetaEditando } : { ...nuevaReceta }
    const nuevosIngredientes = base.ingredientes.filter((_, i) => i !== index)
    
    if (nuevosIngredientes.length === 0) {
      nuevosIngredientes.push({ ingredienteId: '', cantidad: '' })
    }
    
    if (esEdicion) setRecetaEditando({ ...base, ingredientes: nuevosIngredientes })
    else setNuevaReceta({ ...base, ingredientes: nuevosIngredientes })
  }

  const producirReceta = async (receta) => {
    const cantidad = prompt(`¿Cuántos kg quieres producir de "${receta.nombre}"?`, '1');
    
    if (!cantidad || isNaN(cantidad) || parseFloat(cantidad) <= 0) {
      setMensaje('❌ Cantidad inválida');
      setTimeout(() => setMensaje(''), 3000);
      return;
    }
    
    const cantidadNumerica = parseFloat(cantidad);
    const producto = productos.find(p => p.id == receta.producto_id);
    
    if (!producto) {
      setMensaje('❌ Producto no encontrado');
      setTimeout(() => setMensaje(''), 3000);
      return;
    }
    
    const unidadNormalizada = (u) => String(u || '').toLowerCase().trim()
    const construirDetalle = () => {
      const detalle = []
      for (const ing of receta.ingredientes || []) {
        const ingrediente = ingredientes.find(i => i.id == ing.ingrediente_id)
        if (!ingrediente) continue
        const porcentaje = parseFloat(ing.cantidad) || 0
        const kgNecesarios = (porcentaje / 100) * cantidadNumerica
        const gramosNecesarios = kgNecesarios * 1000
        const costoUnitario = parseFloat(ingrediente.costo || 0)
        const unidadIng = unidadNormalizada(ingrediente.unidad)
        const cantidadCosto = ['gr', 'g', 'gramo', 'gramos'].includes(unidadIng) ? gramosNecesarios : kgNecesarios
        const costoTotal = cantidadCosto * costoUnitario
        detalle.push({
          nombre: ingrediente.nombre,
          porcentaje,
          gramos: gramosNecesarios,
          costo: costoTotal
        })
      }
      return detalle
    }

    const detalleIngredientes = construirDetalle()
    const costoTotalReceta = detalleIngredientes.reduce((acc, d) => acc + d.costo, 0)

    const ingredientesInsuficientes = [];
    for (const ing of receta.ingredientes || []) {
      const ingrediente = ingredientes.find(i => i.id == ing.ingrediente_id);
      if (ingrediente) {
        const kgRequeridos = ((parseFloat(ing.cantidad) || 0) / 100) * cantidadNumerica
        const cantidadRequerida = ['gr', 'g', 'gramo', 'gramos'].includes(unidadNormalizada(ingrediente.unidad))
          ? kgRequeridos * 1000
          : kgRequeridos
        if (ingrediente.stock < cantidadRequerida) {
          ingredientesInsuficientes.push({
            nombre: ingrediente.nombre,
            disponible: ingrediente.stock,
            requerido: cantidadRequerida
          });
        }
      }
    }
    
    if (ingredientesInsuficientes.length > 0) {
      const listaInsuficientes = ingredientesInsuficientes.map(i => 
        `${i.nombre}: ${i.disponible} disponible, ${i.requerido.toFixed(2)} requerido`
      ).join('\n');
      
      setMensaje(`❌ Stock insuficiente:\n${listaInsuficientes}`);
      setTimeout(() => setMensaje(''), 5000);
      return;
    }
    
    const listaDetalle = detalleIngredientes
      .map(d => `• ${d.nombre}: ${d.porcentaje.toFixed(3)}% | ${d.gramos.toFixed(2)} gr | $${d.costo.toFixed(2)}`)
      .join('\n')
    const confirmacion = confirm(
      `¿Confirmar producción de ${cantidadNumerica} kg de "${receta.nombre}"?\n\n` +
      `Detalle de ingredientes a utilizar:\n${listaDetalle}\n\n` +
      `Costo total estimado receta: $${costoTotalReceta.toFixed(2)}`
    );
    
    if (!confirmacion) return;
    
    try {
      setCargando(true);
      
      const response = await fetch(`${API_URL}/produccion`, {
        method: 'POST',
        headers: {
          ...authHeaders(true),
          'x-usuario': usuarioActual?.usuario || usuarioActual?.nombre || 'sistema'
        },
        body: JSON.stringify({
          receta_id: receta.id,
          cantidad: cantidadNumerica
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setMensaje(`✅ Producción completada: lote ${result?.lote || 'N/A'} | costo total $${(parseFloat(result?.costo_total_receta || 0)).toFixed(2)}`);
        await cargarDatos();
        setTimeout(() => setMensaje(''), 4000);
      } else {
        const error = await response.json();
        setMensaje(`❌ Error en producción: ${error.error || 'Error desconocido'}`);
        setTimeout(() => setMensaje(''), 4000);
      }
    } catch (error) {
      setMensaje('❌ Error de conexión');
      setTimeout(() => setMensaje(''), 3000);
    } finally {
      setCargando(false);
    }
  }

  const cancelarEdicion = () => {
    setRecetaEditando(null)
    setMostrarFormulario(false)
    setNuevaReceta({ nombre: '', productoId: '', rendimiento: '1', ingredientes: [{ ingredienteId: '', cantidad: '' }] })
  }

  const datosActuales = recetaEditando || nuevaReceta
  
  const porcentajeAGramos = (porcentaje) => {
    const p = parseFloat(porcentaje) || 0
    return p * 10
  }
  
  const formatearKgYGr = (valorKg) => {
    const kg = parseFloat(valorKg || 0)
    const kgTxt = kg.toFixed(2).replace('.', ',')
    const grTxt = (kg * 1000).toFixed(2).replace('.', ',')
    return `${kgTxt} kg (${grTxt} gr)`
  }
  
  const formatearFecha = (fecha) => {
    if (!fecha) return '-'
    const d = new Date(fecha)
    if (Number.isNaN(d.getTime())) return '-'
    return d.toLocaleString()
  }
  
  const consultarUltimaProduccion = async (receta) => {
    try {
      setCargandoUltimaProduccion(true)
      const ultima = historialProduccion.find(h => Number(h.receta_id) === Number(receta.id))
      if (!ultima?.id) {
        setMensaje(`❌ La receta "${receta.nombre}" no tiene producciones registradas`)
        setTimeout(() => setMensaje(''), 3000)
        return
      }
      const res = await fetch(`${API_URL}/produccion/detalle/${ultima.id}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setMensaje(`❌ No se pudo consultar el detalle: ${err.error || 'Error desconocido'}`)
        setTimeout(() => setMensaje(''), 3000)
        return
      }
      const data = await res.json()
      setDetalleUltimaProduccion(data)
    } catch {
      setMensaje('❌ Error al consultar la última producción')
      setTimeout(() => setMensaje(''), 3000)
    } finally {
      setCargandoUltimaProduccion(false)
    }
  }

  return (
    <div className="p-2 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center text-gray-800">
          <Factory className="mr-2 text-orange-600 w-5 h-5 sm:w-6 sm:h-6" /> Producción
        </h1>
        <div className="grid grid-cols-1 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          {esAdmin && (
            <button
              type="button"
              onClick={() => setMostrarConfigProteinas((v) => !v)}
              className="w-full sm:w-auto bg-amber-600 text-white px-3 sm:px-4 py-2.5 rounded-lg hover:bg-amber-700 text-sm"
            >
              {mostrarConfigProteinas ? 'Cerrar Config.' : 'Config. Proteínas'}
            </button>
          )}
          <button 
            onClick={() => { 
              if (mostrarFormulario && recetaEditando) {
                cancelarEdicion()
              } else {
                setMostrarFormulario(!mostrarFormulario)
                setRecetaEditando(null)
              }
            }}
            className="w-full sm:w-auto bg-orange-600 text-white px-3 sm:px-4 py-2.5 rounded-lg hover:bg-orange-700 text-sm"
          >
            {mostrarFormulario ? 'Cancelar' : 'Nueva Receta'}
          </button>
        </div>
      </div>

      {mensaje && <div className="p-3 bg-orange-50 border border-orange-200 text-orange-800 rounded-lg">{mensaje}</div>}

      {esAdmin && mostrarConfigProteinas && (
        <div className="bg-white rounded-xl shadow border border-orange-100 p-3 sm:p-4 space-y-3">
          <h3 className="font-bold text-sm sm:text-base text-orange-700">Configuración de Proteínas (100%)</h3>
          <p className="text-xs text-gray-500">Solo los ingredientes que coincidan con estos patrones se suman para validar el 100% de la receta.</p>
          
          {/* Alerta si no hay endpoint en backend */}
          {configProteinas.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-2 rounded text-xs">
              ⚠️ El endpoint de configuración no está disponible. Se usan valores por defecto: pollo, cerdo, res, cordero, manteca.
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              className="flex-1 border p-2 rounded text-sm"
              placeholder="Ej: pollo"
              value={nuevoPatronProteina}
              onChange={(e) => setNuevoPatronProteina(e.target.value)}
            />
            <button
              type="button"
              onClick={agregarPatronProteina}
              className="bg-orange-600 text-white px-3 py-2 rounded text-sm hover:bg-orange-700"
            >
              Agregar
            </button>
          </div>
          <div className="space-y-1">
            {(configProteinas || []).map((p) => (
              <div key={p.id} className="flex items-center gap-2 border rounded p-2 text-xs sm:text-sm">
                {editandoPatronId === p.id ? (
                  <>
                    <input
                      className="flex-1 border p-1.5 rounded"
                      value={patronEditando}
                      onChange={(e) => setPatronEditando(e.target.value)}
                    />
                    <button type="button" onClick={() => guardarEdicionPatron(p.id)} className="text-green-700 hover:underline">Guardar</button>
                    <button type="button" onClick={() => { setEditandoPatronId(null); setPatronEditando('') }} className="text-gray-600 hover:underline">Cancelar</button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 font-medium">{p.patron} <span className={`text-[10px] ml-1 ${p.activo !== false ? 'text-green-700' : 'text-gray-500'}`}>[{p.activo !== false ? 'Activo' : 'Inactivo'}]</span></span>
                    <button type="button" onClick={() => togglePatronActivo(p)} className="text-indigo-700 hover:underline">{p.activo !== false ? 'Desactivar' : 'Activar'}</button>
                    <button type="button" onClick={() => { setEditandoPatronId(p.id); setPatronEditando(p.patron || '') }} className="text-blue-700 hover:underline">Editar</button>
                    <button type="button" onClick={() => eliminarPatron(p.id)} className="text-red-700 hover:underline">Eliminar</button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {(mostrarFormulario || recetaEditando) && (
        <form onSubmit={guardarReceta} className="bg-white p-3 sm:p-6 rounded-xl shadow-lg border-2 border-orange-100 space-y-3">
          <h2 className="font-bold text-orange-700 text-sm sm:text-base">{recetaEditando ? 'Editando Receta' : 'Nueva Receta'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input 
              className="border p-2 rounded text-sm" placeholder="Nombre de receta" 
              value={datosActuales.nombre}
              onChange={(e) => recetaEditando 
                ? setRecetaEditando({...recetaEditando, nombre: e.target.value}) 
                : setNuevaReceta({...nuevaReceta, nombre: e.target.value})
              }
              required 
            />
            <input 
              className="border p-2 rounded text-sm bg-gray-100 text-gray-600" placeholder="Base receta" type="text"
              value="1 kg (fijo)"
              disabled
            />
            <div className="border p-2 rounded text-sm bg-blue-50 text-blue-800">
              Producto final automático por nombre: <span className="font-semibold">{datosActuales.nombre || '—'}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-bold text-gray-600">Ingredientes Requeridos:</label>
            {datosActuales.ingredientes.map((ing, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <select 
                  className="w-full sm:flex-1 border p-2 rounded text-sm"
                  value={ing.ingredienteId}
                  onChange={(e) => manejarCambioIngrediente(idx, 'ingredienteId', e.target.value)}
                  required
                >
                  <option value="">Seleccionar...</option>
                  {ingredientes
                    .filter(i => i.stock > 0)
                    .map(i => (
                      <option key={i.id} value={i.id.toString()}>
                        {i.nombre} ({i.unidad}) - Stock: {i.stock}
                      </option>
                    ))}
                </select>
                <input 
                  className="w-full sm:w-32 border p-2 rounded text-sm" placeholder="%"
                  type="number" step="0.001" min="0.001" max="100"
                  value={ing.cantidad}
                  onChange={(e) => manejarCambioIngrediente(idx, 'cantidad', e.target.value)}
                  required 
                />
                {datosActuales.ingredientes.length > 1 && (
                  <button type="button" onClick={() => eliminarFilaIngrediente(idx)} className="text-red-600 hover:bg-red-50 p-1.5 rounded">
                    <Trash2 size={16} />
                  </button>
                )}
                </div>
                <p className="text-[11px] text-gray-500 pl-1">
                  Equivalente receta 1kg: {porcentajeAGramos(ing.cantidad).toFixed(2)} g
                </p>
              </div>
            ))}
            <button type="button" onClick={añadirFilaIngrediente} className="text-orange-600 text-xs sm:text-sm font-bold uppercase hover:underline mt-1">
              + Añadir ingrediente
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button type="submit" disabled={cargando} className="w-full sm:w-auto bg-orange-600 text-white px-4 py-2.5 rounded-lg font-bold text-sm">
              {cargando ? 'Guardando...' : (recetaEditando ? 'Actualizar' : 'Crear Receta')}
            </button>
            {recetaEditando && (
              <button type="button" onClick={cancelarEdicion} className="w-full sm:w-auto bg-gray-100 px-4 py-2.5 rounded-lg hover:bg-gray-200 text-sm">
                Cancelar
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500">Solo proteínas (pollo, cerdo, res, cordero, manteca) deben sumar 100%. Los demás ingredientes son adicionales.</p>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {recetas.map(r => (
          <div key={r.id} className="bg-white p-3 sm:p-4 rounded-lg shadow border-l-4 border-orange-500 flex flex-col sm:flex-row sm:justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-gray-800">{r.nombre}</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Base: 1kg | {productos.find(p => p.id == r.producto_id)?.nombre || '---'}
              </p>
              {r.ingredientes && r.ingredientes.length > 0 && (
                <div className="mt-1.5 text-xs text-gray-600">
                  <ul className="space-y-0.5">
                    {r.ingredientes.slice(0, 3).map((ing, i) => (
                      <li key={i}>• {ing.nombre}: {ing.cantidad}% ({porcentajeAGramos(ing.cantidad).toFixed(2)} g)</li>
                    ))}
                    {r.ingredientes.length > 3 && (
                      <li className="text-gray-400">... y {r.ingredientes.length - 3} más</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
            <div className="grid grid-cols-4 sm:flex sm:flex-col gap-1 sm:ml-2">
              <button onClick={() => iniciarEdicion(r)} className="text-blue-600 hover:bg-blue-50 p-2 rounded border border-blue-100" title="Editar receta">
                <Pencil size={16} />
              </button>
              <button 
                onClick={() => producirReceta(r)} 
                className="text-green-600 hover:bg-green-50 p-2 rounded border border-green-100" 
                title="Producir"
                disabled={cargando}
              >
                <Factory size={16} />
              </button>
              <button
                onClick={() => consultarUltimaProduccion(r)}
                className="text-orange-700 hover:bg-orange-50 p-2 rounded border border-orange-100"
                title="Última producción"
                disabled={cargandoUltimaProduccion}
              >
                <History size={16} />
              </button>
              <button 
                onClick={async () => { 
                  if(confirm('¿Eliminar receta?')) { 
                    await fetch(`${API_URL}/recetas/${r.id}`, {
                      method:'DELETE',
                      headers: authHeaders()
                    }); 
                    cargarDatos(); 
                  } 
                }} 
                className="text-red-600 hover:bg-red-50 p-2 rounded border border-red-100" 
                title="Eliminar receta"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {detalleUltimaProduccion?.produccion && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4">
          <h3 className="font-bold text-sm sm:text-base text-amber-800 mb-2">Última producción de receta</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-amber-900">
            <p><span className="font-semibold">Receta:</span> {detalleUltimaProduccion.produccion.receta_nombre || '-'}</p>
            <p><span className="font-semibold">Producto:</span> {detalleUltimaProduccion.produccion.producto_nombre || '-'}</p>
            <p><span className="font-semibold">Fecha:</span> {formatearFecha(detalleUltimaProduccion.produccion.fecha_elaboracion || detalleUltimaProduccion.produccion.fecha)}</p>
            <p><span className="font-semibold">Lote:</span> {detalleUltimaProduccion.produccion.lote || '-'}</p>
            <p><span className="font-semibold">Kg:</span> <span className="inline-block px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-bold">{formatearKgYGr(detalleUltimaProduccion.produccion.cantidad_lotes || detalleUltimaProduccion.produccion.cantidad_producida || 0)}</span></p>
            <p><span className="font-semibold">Usuario:</span> {detalleUltimaProduccion.produccion.usuario_proceso || 'sistema'}</p>
            <p className="sm:col-span-2"><span className="font-semibold">Costo total:</span> ${parseFloat(detalleUltimaProduccion.costo_total_receta || 0).toFixed(2)}</p>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-[11px] sm:text-xs">
              <thead>
                <tr className="text-left border-b border-amber-200">
                  <th className="py-1 pr-2">Ingrediente</th>
                  <th className="py-1 pr-2">% receta</th>
                  <th className="py-1 pr-2">Gramos</th>
                  <th className="py-1 pr-2">Costo</th>
                </tr>
              </thead>
              <tbody>
                {(detalleUltimaProduccion.ingredientes || []).map((it) => (
                  <tr key={it.id} className="border-b border-amber-100 last:border-0">
                    <td className="py-1 pr-2">{it.ingrediente_nombre || '-'}</td>
                    <td className="py-1 pr-2">{parseFloat(it.porcentaje || 0).toFixed(3)}%</td>
                    <td className="py-1 pr-2">{parseFloat(it.gramos || 0).toFixed(2)} gr</td>
                    <td className="py-1 pr-2">${parseFloat(it.costo_total || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow border border-orange-100 p-3 sm:p-4">
        <h3 className="font-bold text-sm sm:text-base text-orange-700 mb-2">Histórico de Producciones</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] sm:text-xs">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-2">Fecha elaboración</th>
                <th className="py-2 pr-2">Lote</th>
                <th className="py-2 pr-2">Receta</th>
                <th className="py-2 pr-2">Kg</th>
                <th className="py-2 pr-2">Usuario</th>
              </tr>
            </thead>
            <tbody>
              {historialProduccion.slice(0, 50).map((h) => (
                <tr key={h.id} className="border-b last:border-0">
                  <td className="py-2 pr-2">{new Date(h.fecha_elaboracion || h.fecha).toLocaleString()}</td>
                  <td className="py-2 pr-2 font-mono">{h.lote || `LOT-${String(h.id).padStart(6, '0')}`}</td>
                  <td className="py-2 pr-2">{h.receta_nombre || '-'}</td>
                  <td className="py-2 pr-2">{parseFloat(h.cantidad_lotes || h.cantidad_producida || 0).toFixed(3)}</td>
                  <td className="py-2 pr-2">{h.usuario_proceso || 'sistema'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sección de depuración - Información de la Base de Datos */}
      <div className="mt-6 bg-gray-50 rounded-xl p-4 border border-gray-200">
        <h3 className="font-bold text-gray-700 text-sm mb-3 flex items-center">
          🔍 Ingredientes Disponibles
        </h3>
        
        <div className="bg-white rounded-lg p-3">
          <div className="max-h-64 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
              {ingredientes
                .sort((a, b) => {
                  if (a.stock !== b.stock) {
                    return b.stock - a.stock;
                  }
                  return a.nombre.localeCompare(b.nombre);
                })
                .map(ing => (
                  <div key={ing.id} className={`flex justify-between items-center rounded p-2 border ${
                    ing.stock <= 0
                      ? 'bg-red-50 border-red-200'
                      : ing.stock <= (ing.stock_minimo || 5)
                        ? 'bg-orange-50 border-orange-200'
                        : 'bg-green-50 border-green-200'
                  }`}>
                    <div className="flex-1">
                      <span className="font-medium text-gray-700">{ing.nombre}</span>
                      <span className="ml-1 text-gray-500">({ing.unidad})</span>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold font-mono text-sm ${
                        ing.stock <= 0
                          ? 'text-red-600'
                          : ing.stock <= (ing.stock_minimo || 5)
                            ? 'text-orange-600'
                            : 'text-green-600'
                      }`}>
                        {ing.stock}
                      </span>
                      {ing.stock <= (ing.stock_minimo || 5) && ing.stock > 0 && (
                        <AlertTriangle className="w-3 h-3 inline ml-1 text-orange-500" />
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-600">
              <span>Total ingredientes: {ingredientes.length}</span>
              <span className="text-green-600">Con stock: {ingredientes.filter(i => i.stock > 0).length}</span>
              <span className="text-red-600">Sin stock: {ingredientes.filter(i => i.stock <= 0).length}</span>
              <span className="text-orange-600">Stock mínimo: {ingredientes.filter(i => i.stock <= (i.stock_minimo || 5) && i.stock > 0).length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}