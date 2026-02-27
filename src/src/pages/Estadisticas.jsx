import { useState, useEffect } from 'react'

import { useNavigate } from 'react-router-dom'
import {
  BarChart2, TrendingUp, TrendingDown, ShoppingCart, Package,
  Users, Factory, AlertTriangle, DollarSign, Calendar, Award, Layers
} from 'lucide-react'

import API_URL from '../config'

// ── Mini bar chart (SVG) ──────────────────────────────────────────────────────
function BarChart({ data, color = '#ea580c', height = 80 }) {
  if (!data || data.length === 0) return <div className="text-xs text-gray-400 text-center py-4">Sin datos</div>
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-1 w-full" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5" style={{ minWidth: 0 }}>
          <div
            className="w-full rounded-t transition-all duration-500"
            style={{ height: `${(d.value / max) * (height - 18)}px`, backgroundColor: color, minHeight: d.value > 0 ? 3 : 0 }}
            title={`${d.label}: ${d.value}`}
          />
          <span className="text-xs text-gray-400 w-full text-center" style={{ fontSize: 9, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.label}>{d.label}</span>
        </div>
      ))}
    </div>
  )
}

// ── Donut chart (SVG) ─────────────────────────────────────────────────────────
function DonutChart({ data, size = 100 }) {
  if (!data || data.length === 0) return <div className="text-xs text-gray-400 text-center py-4">Sin datos</div>
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <div className="text-xs text-gray-400 text-center py-4">Sin datos</div>
  const colors = ['#ea580c', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']
  const r = 38, cx = 50, cy = 50, stroke = 14
  let cumulative = 0
  const slices = data.map((d, i) => {
    const pct = d.value / total
    const start = cumulative
    cumulative += pct
    return { ...d, pct, start, color: colors[i % colors.length] }
  })
  const polarToCartesian = (pct) => {
    const angle = pct * 2 * Math.PI - Math.PI / 2
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  }
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 100 100">
        {slices.map((s, i) => {
          if (s.pct === 0) return null
          const start = polarToCartesian(s.start)
          const end = polarToCartesian(s.start + s.pct)
          const large = s.pct > 0.5 ? 1 : 0
          return (
            <path
              key={i}
              d={`M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y} Z`}
              fill={s.color}
              opacity={0.85}
            />
          )
        })}
        <circle cx={cx} cy={cy} r={r - stroke} fill="white" />
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#374151">{total}</text>
      </svg>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-xs text-gray-600">{s.label} ({s.value})</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, title, value, sub, color, trend, to }) {
  const navigate = useNavigate()
  return (
    <div
      onClick={() => to && navigate(to)}
      className={`${color} rounded-xl p-3 sm:p-4 shadow-sm ${to ? 'cursor-pointer hover:opacity-90 active:scale-95 transition-all' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium opacity-75 truncate">{title}</p>
          <p className="text-xl sm:text-2xl font-bold mt-0.5">{value}</p>
          {sub && <p className="text-xs opacity-70 mt-0.5 truncate">{sub}</p>}
        </div>
        <div className="flex flex-col items-end gap-1 ml-2 flex-shrink-0">
          <Icon className="w-6 h-6 opacity-50" />
          {trend !== undefined && (
            <span className={`text-xs font-bold ${trend >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, icon: Icon, children, color = 'text-orange-600', to }) {
  const navigate = useNavigate()
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${color}`} />
          <h2 className="font-bold text-gray-800 text-sm sm:text-base">{title}</h2>
        </div>
        {to && (
          <button
            onClick={() => navigate(to)}
            className="text-xs text-orange-600 hover:text-orange-800 font-medium flex items-center gap-1"
          >
            Ver módulo →
          </button>
        )}
      </div>
      <div className="p-3 sm:p-4">{children}</div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Estadisticas() {
  const [ventas, setVentas] = useState([])
  const [productos, setProductos] = useState([])
  const [ingredientes, setIngredientes] = useState([])
  const [clientes, setClientes] = useState([])
  const [recetas, setRecetas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [periodo, setPeriodo] = useState('30') // días

  useEffect(() => { cargarTodo() }, [])

  const cargarTodo = async () => {
    setCargando(true)
    try {
      const [rv, rp, ri, rc, rr] = await Promise.all([
        fetch(`${API_URL}/ventas`),
        fetch(`${API_URL}/productos`),
        fetch(`${API_URL}/ingredientes`),
        fetch(`${API_URL}/clientes`),
        fetch(`${API_URL}/recetas`),
      ])
      setVentas(await rv.json())
      setProductos(await rp.json())
      setIngredientes(await ri.json())
      setClientes(await rc.json())
      setRecetas(await rr.json())
    } catch (e) {
      console.error(e)
    } finally {
      setCargando(false)
    }
  }

  // ── Filtrar ventas por período ──────────────────────────────────────────────
  const diasAtras = parseInt(periodo)
  const fechaCorte = new Date()
  fechaCorte.setDate(fechaCorte.getDate() - diasAtras)

  const ventasPeriodo = ventas.filter(v => new Date(v.fecha) >= fechaCorte)

  // ── Métricas de ventas ──────────────────────────────────────────────────────
  const totalVentas = ventasPeriodo.length
  const ingresoTotal = ventasPeriodo.reduce((s, v) => s + parseFloat(v.total || 0), 0)
  const ventasPagadas = ventasPeriodo.filter(v => v.estado === 'pagada' || v.estado === 'pagado').length
  const ventasPendientes = ventasPeriodo.filter(v => v.estado === 'pendiente').length
  const ticketPromedio = totalVentas > 0 ? ingresoTotal / totalVentas : 0

  // Ventas por día (últimos N días, agrupadas)
  const ventasPorDia = (() => {
    const map = {}
    ventasPeriodo.forEach(v => {
      const d = new Date(v.fecha)
      const key = `${d.getDate()}/${d.getMonth() + 1}`
      map[key] = (map[key] || 0) + parseFloat(v.total || 0)
    })
    // Últimos 10 días con datos
    return Object.entries(map)
      .slice(-10)
      .map(([label, value]) => ({ label, value: Math.round(value) }))
  })()

  // Ventas por estado
  const estadosVenta = (() => {
    const map = {}
    ventasPeriodo.forEach(v => { map[v.estado] = (map[v.estado] || 0) + 1 })
    return Object.entries(map).map(([label, value]) => ({ label, value }))
  })()

  // Top 5 clientes por monto
  const topClientes = (() => {
    const map = {}
    ventasPeriodo.forEach(v => {
      const nombre = v.cliente_nombre || 'Sin nombre'
      map[nombre] = (map[nombre] || 0) + parseFloat(v.total || 0)
    })
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, value]) => ({ label: label.length > 10 ? label.slice(0, 10) + '…' : label, value: Math.round(value) }))
  })()

  // ── Métricas de productos ───────────────────────────────────────────────────
  const stockBajoProductos = productos.filter(p => p.stock <= (p.stock_minimo || 10))
  const categorias = (() => {
    const map = {}
    productos.forEach(p => { map[p.categoria || 'Sin cat.'] = (map[p.categoria || 'Sin cat.'] || 0) + 1 })
    return Object.entries(map).map(([label, value]) => ({ label, value }))
  })()

  const stockPorProducto = productos
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 8)
    .map(p => ({ label: p.nombre.length > 10 ? p.nombre.slice(0, 10) + '…' : p.nombre, value: parseFloat(p.stock) || 0 }))

  // ── Métricas de ingredientes ────────────────────────────────────────────────
  const stockBajoIng = ingredientes.filter(i => parseFloat(i.stock) <= parseFloat(i.stock_minimo || 5))
  const valorInventario = ingredientes.reduce((s, i) => s + (parseFloat(i.costo || 0) * parseFloat(i.stock || 0)), 0)

  const stockIngredientes = ingredientes
    .sort((a, b) => parseFloat(b.stock) - parseFloat(a.stock))
    .slice(0, 8)
    .map(i => ({ label: i.nombre.length > 10 ? i.nombre.slice(0, 10) + '…' : i.nombre, value: parseFloat(i.stock) || 0 }))

  // ── Métricas de clientes ────────────────────────────────────────────────────
  const tiposCliente = (() => {
    const map = {}
    clientes.forEach(c => { map[c.tipo || 'regular'] = (map[c.tipo || 'regular'] || 0) + 1 })
    return Object.entries(map).map(([label, value]) => ({ label, value }))
  })()

  // Clientes con más compras en el período
  const clientesActivos = (() => {
    const map = {}
    ventasPeriodo.forEach(v => {
      if (v.cliente_nombre) {
        const key = v.cliente_nombre.length > 10 ? v.cliente_nombre.slice(0, 10) + '…' : v.cliente_nombre
        map[key] = (map[key] || 0) + 1
      }
    })
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value]) => ({ label, value }))
  })()

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BarChart2 className="w-10 h-10 mx-auto animate-pulse text-orange-500 mb-2" />
          <p className="text-gray-500 text-sm">Cargando estadísticas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-2 sm:p-6 space-y-4">

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center text-gray-800">
            <BarChart2 className="mr-2 text-orange-600 w-5 h-5 sm:w-6 sm:h-6" />
            Estadísticas
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Resumen general del negocio</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Período:</label>
          <select
            value={periodo}
            onChange={e => setPeriodo(e.target.value)}
            className="border rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-500"
          >
            <option value="7">Últimos 7 días</option>
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 90 días</option>
            <option value="365">Último año</option>
          </select>
          <button onClick={cargarTodo} className="text-sm text-orange-600 hover:text-orange-800 px-2 py-1.5 border rounded-lg">
            🔄
          </button>
        </div>
      </div>

      {/* ── KPIs globales ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <StatCard icon={DollarSign} title="Ingresos" value={`$${ingresoTotal.toFixed(0)}`} sub={`${totalVentas} ventas`} color="bg-orange-100 text-orange-900" to="/ventas" />
        <StatCard icon={ShoppingCart} title="Ticket Promedio" value={`$${ticketPromedio.toFixed(0)}`} sub={`${ventasPagadas} pagadas`} color="bg-green-100 text-green-900" to="/ventas" />
        <StatCard icon={Users} title="Clientes" value={clientes.length} sub={`${clientesActivos.length} activos`} color="bg-blue-100 text-blue-900" to="/clientes" />
        <StatCard icon={AlertTriangle} title="Alertas Stock" value={stockBajoProductos.length + stockBajoIng.length} sub="productos + ingredientes" color="bg-red-100 text-red-900" to="/ingredientes" />
      </div>

      {/* ── VENTAS ── */}
      <Section title="Ventas" icon={ShoppingCart} color="text-orange-600" to="/ventas">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* Ventas por día */}
          <div className="sm:col-span-2">
            <p className="text-xs font-semibold text-gray-500 mb-2">Ingresos por día ($)</p>
            <BarChart data={ventasPorDia} color="#ea580c" height={90} />
          </div>

          {/* Estado de ventas */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2 text-center">Estado de ventas</p>
            <DonutChart data={estadosVenta} size={110} />
          </div>
        </div>

        {/* Top clientes */}
        <div className="mt-4">
          <p className="text-xs font-semibold text-gray-500 mb-2">Top clientes por monto ($)</p>
          <BarChart data={topClientes} color="#f97316" height={80} />
        </div>

        {/* Resumen rápido */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-orange-50 rounded-lg p-2 text-center">
            <p className="text-xs text-orange-700">Total</p>
            <p className="font-bold text-orange-900">{totalVentas}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <p className="text-xs text-green-700">Pagadas</p>
            <p className="font-bold text-green-900">{ventasPagadas}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-2 text-center">
            <p className="text-xs text-yellow-700">Pendientes</p>
            <p className="font-bold text-yellow-900">{ventasPendientes}</p>
          </div>
        </div>
      </Section>

      {/* ── PRODUCTOS ── */}
      <Section title="Productos Finales" icon={Package} color="text-blue-600" to="/productos">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Stock por producto */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Stock actual (top 8)</p>
            <BarChart data={stockPorProducto} color="#3b82f6" height={90} />
          </div>

          {/* Por categoría */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2 text-center">Por categoría</p>
            <DonutChart data={categorias} size={110} />
          </div>
        </div>

        {/* Stock bajo */}
        {stockBajoProductos.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-red-600 mb-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Stock bajo ({stockBajoProductos.length})
            </p>
            <div className="flex flex-wrap gap-1">
              {stockBajoProductos.map(p => (
                <span key={p.id} className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">
                  {p.nombre} ({p.stock})
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <p className="text-xs text-blue-700">Total</p>
            <p className="font-bold text-blue-900">{productos.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <p className="text-xs text-green-700">OK</p>
            <p className="font-bold text-green-900">{productos.length - stockBajoProductos.length}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-2 text-center">
            <p className="text-xs text-red-700">Stock bajo</p>
            <p className="font-bold text-red-900">{stockBajoProductos.length}</p>
          </div>
        </div>
      </Section>

      {/* ── INGREDIENTES ── */}
      <Section title="Materia Prima" icon={Layers} color="text-green-600" to="/ingredientes">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Stock ingredientes */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Stock actual (top 8)</p>
            <BarChart data={stockIngredientes} color="#10b981" height={90} />
          </div>

          {/* Alertas */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Estado del inventario</p>
            <DonutChart
              data={[
                { label: 'OK', value: ingredientes.length - stockBajoIng.length },
                { label: 'Bajo', value: stockBajoIng.length }
              ]}
              size={110}
            />
          </div>
        </div>

        {stockBajoIng.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-red-600 mb-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Ingredientes con stock bajo ({stockBajoIng.length})
            </p>
            <div className="flex flex-wrap gap-1">
              {stockBajoIng.map(i => (
                <span key={i.id} className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">
                  {i.nombre} ({parseFloat(i.stock).toFixed(1)} {i.unidad})
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <p className="text-xs text-green-700">Total</p>
            <p className="font-bold text-green-900">{ingredientes.length}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <p className="text-xs text-blue-700">Valor inv.</p>
            <p className="font-bold text-blue-900">${valorInventario.toFixed(0)}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-2 text-center">
            <p className="text-xs text-red-700">Stock bajo</p>
            <p className="font-bold text-red-900">{stockBajoIng.length}</p>
          </div>
        </div>
      </Section>

      {/* ── CLIENTES ── */}
      <Section title="Clientes" icon={Users} color="text-purple-600" to="/clientes">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Actividad */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Compras por cliente (período)</p>
            <BarChart data={clientesActivos} color="#8b5cf6" height={90} />
          </div>

          {/* Tipos */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2 text-center">Por tipo</p>
            <DonutChart data={tiposCliente} size={110} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="bg-purple-50 rounded-lg p-2 text-center">
            <p className="text-xs text-purple-700">Total</p>
            <p className="font-bold text-purple-900">{clientes.length}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <p className="text-xs text-blue-700">Activos</p>
            <p className="font-bold text-blue-900">{clientesActivos.length}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-2 text-center">
            <p className="text-xs text-orange-700">Sin compras</p>
            <p className="font-bold text-orange-900">{clientes.length - clientesActivos.length}</p>
          </div>
        </div>
      </Section>

      {/* ── PRODUCCIÓN ── */}
      <Section title="Producción y Recetas" icon={Factory} color="text-yellow-600" to="/produccion">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Recetas por producto */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Ingredientes por receta</p>
            <BarChart
              data={recetas.slice(0, 8).map(r => ({
                label: (() => { const n = r.nombre.replace(/^receta\s*/i, '').trim(); return n.length > 12 ? n.slice(0, 12) + '…' : n })(),
                value: r.ingredientes ? r.ingredientes.length : 0
              }))}
              color="#f59e0b"
              height={90}
            />
          </div>

          {/* Rendimiento */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Rendimiento por receta</p>
            <BarChart
              data={recetas.slice(0, 8).map(r => ({
                label: (() => { const n = r.nombre.replace(/^receta\s*/i, '').trim(); return n.length > 12 ? n.slice(0, 12) + '…' : n })(),
                value: parseFloat(r.rendimiento) || 0
              }))}
              color="#d97706"
              height={90}
            />
          </div>
        </div>

        {/* Lista de recetas */}
        {recetas.length > 0 && (
          <div className="mt-3 space-y-1">
            <p className="text-xs font-semibold text-gray-500 mb-2">Recetas registradas</p>
            {recetas.map(r => (
              <div key={r.id} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-800 font-medium">{r.nombre}</span>
                <div className="flex gap-3 text-xs text-gray-500">
                  <span>Rinde: <strong>{r.rendimiento}</strong></span>
                  <span>{r.ingredientes?.length || 0} ingredientes</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="bg-yellow-50 rounded-lg p-2 text-center">
            <p className="text-xs text-yellow-700">Recetas</p>
            <p className="font-bold text-yellow-900">{recetas.length}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-2 text-center">
            <p className="text-xs text-orange-700">Ingredientes únicos</p>
            <p className="font-bold text-orange-900">{ingredientes.length}</p>
          </div>
        </div>
      </Section>

    </div>
  )
}