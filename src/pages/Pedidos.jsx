import { useState, useEffect } from 'react'
import { ClipboardList, Plus, Search, User, Package, Trash2, Save, X, CheckCircle, Clock, AlertTriangle, FileText, Edit2, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react'

import API_URL from '../config'
const ESTADOS = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  parcial:   { label: 'Parcial',   color: 'bg-blue-100 text-blue-700',    icon: AlertTriangle },
  listo:     { label: 'Listo',     color: 'bg-green-100 text-green-700',  icon: CheckCircle },
  facturado: { label: 'Facturado', color: 'bg-gray-100 text-gray-600',    icon: FileText },
  despachado: { label: 'Procesado', color: 'bg-green-100 text-green-700',  icon: CheckCircle },
}

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([])
  const [productos, setProductos] = useState([])
  const [clientes, setClientes] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [filtro, setFiltro] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [clienteSel, setClienteSel] = useState(null)
  const [busqCliente, setBusqCliente] = useState('')
  const [dropCliente, setDropCliente] = useState(false)
  const [busqProd, setBusqProd] = useState('')
  const [dropProd, setDropProd] = useState(false)
  const [items, setItems] = useState([])
  const [notas, setNotas] = useState('')
  const [fechaEntrega, setFechaEntrega] = useState('')
  const [entregandoId, setEntregandoId] = useState(null)
  const [pesoEntrega, setPesoEntrega] = useState({})
  const [expandido, setExpandido] = useState(null)
  const [totalForm, setTotalForm] = useState(0)

  useEffect(() => { cargar() }, [])

  // Actualizar totalForm cuando cambian los items
  useEffect(() => {
    setTotalForm(items.length)
  }, [items])

  const cargar = async () => {
    try {
      const [rP, rPr, rC] = await Promise.all([fetch(`${API_URL}/pedidos`), fetch(`${API_URL}/productos`), fetch(`${API_URL}/clientes`)])
      setPedidos(await rP.json()); setProductos(await rPr.json()); setClientes(await rC.json())
    } catch { msg('❌ Error al cargar') }
  }

  const msg = (m) => { setMensaje(m); setTimeout(() => setMensaje(''), 3000) }

  const agregarProd = (p) => {
    const ex = items.find(i => i.producto_id === p.id)
    if (ex) setItems(items.map(i => i.producto_id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i))
    else setItems([...items, { producto_id: p.id, nombre: p.nombre, unidad: p.unidad, cantidad: 1 }])
    setBusqProd(''); setDropProd(false)
  }

  const guardarPedido = async (e) => {
    e.preventDefault()
    if (!items.length) { msg('❌ Agrega al menos un producto'); return }
    try {
      const r = await fetch(`${API_URL}/pedidos`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente_id: clienteSel?.id || null, cliente_nombre: clienteSel?.nombre || '', notas, fecha_entrega: fechaEntrega || null,
          items: items.map(i => ({ producto_id: i.producto_id, cantidad_pedida: parseFloat(i.cantidad) })) }) })
      const d = await r.json()
      if (!r.ok) { msg('❌ ' + (d.error || 'Error')); return }
      msg('✅ Pedido creado'); setMostrarForm(false); setClienteSel(null); setItems([]); setNotas(''); setFechaEntrega(''); cargar()
    } catch { msg('❌ Error de red') }
  }

  const guardarEntrega = async (pedido) => {
    // Preparar items para despachar
    const itemsDespachados = (pedido.items || []).filter(i => i?.id).map(i => ({
      producto_id: i.producto_id,
      cantidad_entregada: parseFloat(i.cantidad_entregada ?? 0),
      peso_entregado: parseFloat(pesoEntrega[i.id] ?? i.peso_entregado ?? i.cantidad_entregada ?? 0)
    })).filter(item => item.cantidad_entregada > 0 || item.peso_entregado > 0);

    if (itemsDespachados.length === 0) {
      msg('❌ Debe especificar cantidades entregadas');
      return;
    }

    try {
      const r = await fetch(`${API_URL}/pedidos/${pedido.id}/despachar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items_despachados: itemsDespachados,
          metodo_pago: 'efectivo',
          tipo_venta: 'inmediato',
          moneda_original: 'USD',
          tasa_cambio_usada: 1,
          referencia_pago: null
        })
      });
      const d = await r.json();
      if (!r.ok) { 
        msg('❌ ' + (d.error || 'Error al despachar')); 
        return; 
      }
      msg(`✅ Pedido despachado - Venta #${d.venta_id} creada (Total: $${d.total.toFixed(2)})`);
      setEntregandoId(null); 
      setPesoEntrega({}); 
      cargar();
    } catch { 
      msg('❌ Error de red') 
    }
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar pedido?')) return
    await fetch(`${API_URL}/pedidos/${id}`, { method: 'DELETE' }); msg('🗑️ Eliminado'); cargar()
  }

  const pedidosFiltrados = filtro ? pedidos.filter(p => p.estado === filtro) : pedidos
  const prodsFiltrados = busqProd ? productos.filter(p => p.nombre.toLowerCase().includes(busqProd.toLowerCase())) : productos
  const clientesFiltrados = busqCliente ? clientes.filter(c => c.nombre.toLowerCase().includes(busqCliente.toLowerCase())) : clientes

  return (
    <div className="p-2 sm:p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center text-gray-800">
          <ClipboardList className="mr-2 text-orange-600 w-5 h-5 sm:w-6 sm:h-6" /> Pedidos
        </h1>
        <button onClick={() => { setMostrarForm(true); setClienteSel(null); setItems([]); setNotas(''); setFechaEntrega('') }}
          className="bg-orange-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center text-sm gap-1">
          <Plus className="w-4 h-4" /><span className="hidden sm:inline">Nuevo Pedido</span><span className="sm:hidden">Nuevo</span>
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFiltro('')} className={`px-3 py-1 rounded-full text-xs font-medium border ${!filtro ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-600 border-gray-200'}`}>Todos ({pedidos.length})</button>
        {Object.entries(ESTADOS).map(([k, v]) => (
          <button key={k} onClick={() => setFiltro(filtro === k ? '' : k)} className={`px-3 py-1 rounded-full text-xs font-medium border ${filtro === k ? 'bg-orange-600 text-white border-orange-600' : `${v.color} border-transparent`}`}>
            {v.label} ({pedidos.filter(p => p.estado === k).length})
          </button>
        ))}
      </div>

      {mensaje && <div className={`p-3 rounded-lg text-center text-sm font-medium ${mensaje.includes('✅') ? 'bg-green-100 text-green-800 border border-green-200' : mensaje.includes('❌') ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-blue-100 text-blue-800'}`}>{mensaje}</div>}

      {mostrarForm && (
        <div className="bg-white rounded-xl shadow-lg border-2 border-orange-100 p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-orange-700">Nuevo Pedido</h2>
            <button onClick={() => setMostrarForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
          </div>
          <form onSubmit={guardarPedido} className="space-y-3">
            {clienteSel ? (
              <div className="flex items-center justify-between bg-orange-50 p-2.5 rounded-lg">
                <span className="text-sm font-medium flex items-center gap-2"><User className="w-4 h-4 text-orange-500" />{clienteSel.nombre}</span>
                <button type="button" onClick={() => setClienteSel(null)}><X className="w-4 h-4 text-gray-400" /></button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Buscar cliente..." value={busqCliente} onChange={e => { setBusqCliente(e.target.value); setDropCliente(true) }} onFocus={() => setDropCliente(true)} onBlur={() => setTimeout(() => setDropCliente(false), 150)} className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-orange-400" autoComplete="off" />
                {dropCliente && <div className="absolute z-20 w-full bg-white border rounded-lg mt-1 shadow-xl max-h-40 overflow-auto">{clientesFiltrados.map(c => <button key={c.id} type="button" onMouseDown={() => { setClienteSel(c); setBusqCliente(''); setDropCliente(false) }} className="w-full text-left px-4 py-2 hover:bg-orange-50 text-sm border-b last:border-0 flex items-center gap-2"><User className="w-3.5 h-3.5 text-orange-400" />{c.nombre}</button>)}</div>}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs text-gray-500 mb-1 block">Fecha entrega</label><input type="date" value={fechaEntrega} onChange={e => setFechaEntrega(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400" /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">Notas</label><input type="text" value={notas} onChange={e => setNotas(e.target.value)} placeholder="Observaciones..." className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400" /></div>
            </div>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Buscar y agregar producto..." value={busqProd} onChange={e => { setBusqProd(e.target.value); setDropProd(true) }} onFocus={() => setDropProd(true)} onBlur={() => setTimeout(() => setDropProd(false), 150)} className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-orange-400" autoComplete="off" />
              {dropProd && <div className="absolute z-20 w-full bg-white border rounded-lg mt-1 shadow-xl max-h-44 overflow-auto">{prodsFiltrados.map(p => <button key={p.id} type="button" onMouseDown={() => agregarProd(p)} className="w-full text-left px-4 py-2.5 hover:bg-orange-50 text-sm border-b last:border-0 flex justify-between"><span className="font-medium">{p.nombre} <span className="text-gray-400 font-normal text-xs">({p.unidad})</span></span><span className="text-orange-600">${parseFloat(p.precio).toFixed(2)}</span></button>)}</div>}
            </div>
            {items.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                {/* Móvil: tarjetas */}
                <div className="block sm:hidden divide-y divide-gray-100">
                  {items.map((it, idx) => (
                    <div key={idx} className="p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-sm">{it.nombre} <span className="text-gray-400 text-xs">{it.unidad}</span></p>
                        <button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-red-400 ml-2"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <div><label className="text-xs text-gray-400 block mb-0.5">Cantidad solicitada</label><input type="number" min="0.01" step="0.01" value={it.cantidad} onChange={e => setItems(items.map((x, i) => i === idx ? { ...x, cantidad: e.target.value } : x))} className="w-full border rounded px-2 py-1.5 text-center text-sm" /></div>
                      </div>
                    </div>
                  ))}
                  <div className="bg-orange-50 px-3 py-2 flex justify-between items-center">
                    <span className="text-sm font-bold">Total productos:</span>
                    <span className="font-bold text-orange-700">{items.length}</span>
                  </div>
                </div>
                {/* Escritorio: tabla */}
                <table className="hidden sm:table w-full text-sm">
                  <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">Producto</th><th className="px-2 py-2 text-center">Cantidad solicitada</th><th className="px-2 py-2 text-center"></th></tr></thead>
                  <tbody>{items.map((it, idx) =>
                    <tr key={idx}>
                      <td className="px-3 py-2 font-medium">{it.nombre} <span className="text-gray-400 text-xs">{it.unidad}</span></td>
                      <td className="px-2 py-2"><input type="number" min="0.01" step="0.01" value={it.cantidad} onChange={e => setItems(items.map((x, i) => i === idx ? { ...x, cantidad: e.target.value } : x))} className="w-16 border rounded px-1.5 py-1 text-center text-sm" /></td>
                      <td className="px-2 py-2"><button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></td>
                    </tr>
                  )}</tbody>
                  <tfoot className="bg-orange-50"><tr><td colSpan={2} className="px-3 py-2 text-right text-sm font-bold">Total productos:</td><td className="px-2 py-2 text-center font-bold text-orange-700">{items.length}</td></tr></tfoot>
                </table>
              </div>
            )}
            <div className="flex gap-2">
              <button type="submit" className="flex-1 sm:flex-none bg-orange-600 text-white px-5 py-2 rounded-lg hover:bg-orange-700 flex items-center justify-center gap-1 text-sm"><Save className="w-4 h-4" /> Guardar Pedido</button>
              <button type="button" onClick={() => setMostrarForm(false)} className="flex-1 sm:flex-none bg-gray-200 text-gray-700 px-5 py-2 rounded-lg text-sm">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {pedidosFiltrados.length === 0 && <div className="bg-white rounded-xl p-10 text-center text-gray-400 shadow"><ClipboardList className="w-12 h-12 mx-auto mb-2 text-gray-200" /><p>No hay pedidos</p></div>}

      {pedidosFiltrados.map(pedido => {
        const cfg = ESTADOS[pedido.estado] || ESTADOS.pendiente
        const Icon = cfg.icon
        const its = Array.isArray(pedido.items) ? pedido.items.filter(i => i?.producto_id) : []
        // No calcular totales ya que los pedidos no manejan costos
        const totalP = 0
        const totalPagosPedido = 0
        const saldoPendiente = 0
        const exp = expandido === pedido.id
        const entr = entregandoId === pedido.id
        return (
          <div key={pedido.id} className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
            <div className="p-3 sm:p-4 flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-gray-800">Pedido #{pedido.id}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${cfg.color}`}><Icon className="w-3 h-3" />{cfg.label}</span>
                  {pedido.fecha_entrega && <span className="text-xs text-gray-400">📅 {new Date(pedido.fecha_entrega).toLocaleDateString('es-VE')}</span>}
                </div>
                <p className="text-sm text-gray-600 mt-0.5">{pedido.cliente_nombre || 'Sin cliente'}</p>
                <p className="text-xs text-gray-400 mt-0.5">{its.length} producto(s) · {pedido.estado === 'despachado' ? '✅ Procesado' : pedido.estado_procesamiento === 'venta por procesar' ? '🔄 Venta por procesar' : '⏳ Pendiente'}
                  {pedido.notas && <span className="italic ml-2">"{pedido.notas}"</span>}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {pedido.estado !== 'facturado' && pedido.estado !== 'despachado' && (
                  <button 
                    onClick={() => { 
                      setEntregandoId(entr ? null : pedido.id); 
                      const initPeso = {}; 
                      its.forEach(i => { 
                        initPeso[i.id] = i.peso_entregado ?? i.cantidad_entregada ?? 0 
                      }); 
                      setPesoEntrega(initPeso) 
                    }} 
                    className="p-1.5 text-green-600 hover:bg-green-50 rounded" 
                    title="Despachar pedido (crear venta)"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                {pedido.estado !== 'facturado' && pedido.estado !== 'despachado' && (
                  <button 
                    onClick={() => eliminar(pedido.id)} 
                    className="p-1.5 text-red-400 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button 
                  onClick={() => setExpandido(exp ? null : pedido.id)} 
                  className="p-1.5 text-gray-400 hover:bg-gray-50 rounded"
                >
                  {exp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {exp && its.length > 0 && (
              <div className="border-t bg-gray-50 px-3 sm:px-4 py-3">
                {/* Móvil: tarjetas */}
                <div className="block sm:hidden space-y-2">
                  {its.map(i => {
                    const ent = parseFloat(i.cantidad_entregada) || 0
                    const ped = parseFloat(i.cantidad_pedida) || 0
                    return (
                      <div key={i.id} className="bg-white rounded-lg p-2.5 border border-gray-100">
                        <p className="font-medium text-sm">{i.producto_nombre}</p>
                        <div className="flex gap-3 mt-1 text-xs flex-wrap">
                          <span className="text-gray-500">Pedido: <b>{ped}</b></span>
                          <span className={`font-medium ${ent >= ped ? 'text-green-600' : ent > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>Entregado: <b>{ent} {i.unidad}</b></span>
                          {parseFloat(i.peso_entregado) > 0 && <span className="text-blue-600">Kg: <b>{parseFloat(i.peso_entregado).toFixed(3)}</b></span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
                {/* Escritorio: tabla */}
                <table className="hidden sm:table w-full text-sm">
                  <thead className="text-xs text-gray-500"><tr><th className="text-left pb-1">Producto</th><th className="text-center pb-1">Pedido</th><th className="text-center pb-1">Entregado</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">{its.map(i => { const ent = parseFloat(i.cantidad_entregada)||0; const ped = parseFloat(i.cantidad_pedida)||0; return (<tr key={i.id}><td className="py-1.5 font-medium">{i.producto_nombre}</td><td className="py-1.5 text-center">{ped}</td><td className={`py-1.5 text-center font-medium ${ent>=ped?'text-green-600':ent>0?'text-yellow-600':'text-gray-400'}`}>{ent} {i.unidad}{parseFloat(i.peso_entregado)>0 && <span className="text-xs text-blue-600 ml-1">({parseFloat(i.peso_entregado).toFixed(3)} kg)</span>}</td></tr>) })}</tbody>
                </table>
              </div>
            )}
            {entr && (
              <div className="border-t bg-green-50 px-3 sm:px-4 py-3 space-y-2">
                <p className="text-sm font-bold text-green-700">Despachar pedido (crear venta)</p>
                <p className="text-xs text-gray-600">Ingrese las cantidades exactas a despachar. Se creará automáticamente una venta.</p>
                <ul className="space-y-2">
                  {its.map(i => {
                    const ped = parseFloat(i.cantidad_pedida) || 0
                    return (
                      <li key={i.id} className="flex items-center justify-between bg-white p-2.5 border rounded-lg">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{i.producto_nombre}</p>
                          <p className="text-xs text-gray-500 mt-0.5">Pedido: {ped}</p>
                        </div>
                        <div className="w-36 sm:w-56">
                          <input
                            type="number"
                            min="0"
                            step="0.001"
                            value={pesoEntrega[i.id] ?? i.peso_entregado ?? i.cantidad_entregada ?? 0}
                            onChange={e => setPesoEntrega({ ...pesoEntrega, [i.id]: e.target.value })}
                            className="w-full border rounded px-3 py-2 text-center text-sm focus:ring-2 focus:ring-blue-400"
                          />
                        </div>
                      </li>
                    )
                  })}
                </ul>
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button onClick={() => guardarEntrega(pedido)} className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 flex items-center justify-center gap-1"><ArrowRight className="w-3.5 h-3.5" /> Despachar y Crear Venta</button>
                  <button onClick={() => setEntregandoId(null)} className="w-full sm:w-auto bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm">Cancelar</button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}