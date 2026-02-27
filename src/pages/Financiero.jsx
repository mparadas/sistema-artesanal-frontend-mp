import { useEffect, useMemo, useState } from 'react'
import { Wallet, RefreshCw, Plus, X, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react'
import API_URL from '../config'

const money = (n) => `$${Number(n || 0).toFixed(2)}`

/** Parsea el body como JSON; si la respuesta es HTML (error del servidor), lanza error claro */
async function parseJsonResponse(response) {
  const text = await response.text()
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    if (text.trimStart().startsWith('<!DOCTYPE') || text.trimStart().startsWith('<html')) {
      throw new Error('El servidor devolvió una página en lugar de datos. Comprueba que el backend esté corriendo en el puerto correcto (ej: 3000).')
    }
    throw new Error('Respuesta del servidor no válida (no es JSON).')
  }
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('Respuesta del servidor no es JSON válido.')
  }
}

const CATEGORIAS_GASTO = [
  { value: 'general', label: 'General' },
  { value: 'servicios', label: 'Servicios' },
  { value: 'insumos', label: 'Insumos' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'otros', label: 'Otros' }
]

const METODOS_PAGO_GASTO = [
  { value: 'bs', label: 'Bolívares (Bs)' },
  { value: 'usd', label: 'Dólares ($)' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'pago_movil', label: 'Pago móvil' },
  { value: 'efectivo', label: 'Efectivo' }
]

export default function Financiero() {
  const [resumen, setResumen] = useState(null)
  const [movimientos, setMovimientos] = useState([])
  const [gastos, setGastos] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)
  const [mostrarFormGasto, setMostrarFormGasto] = useState(false)
  const [expandirMovimientos, setExpandirMovimientos] = useState(true)
  const [expandirGastos, setExpandirGastos] = useState(true)
  const [tasaCambio, setTasaCambio] = useState(0)
  const [filtros, setFiltros] = useState({ fecha_inicio: '', fecha_fin: '' })
  const [gastoForm, setGastoForm] = useState({
    concepto: '',
    categoria: 'general',
    monto_usd: '',
    monto_bs: '',
    metodo_pago: 'bs',
    referencia_pago: '',
    notas: ''
  })

  const authHeaders = (json = false) => {
    const token = localStorage.getItem('token')
    const headers = {}
    if (json) headers['Content-Type'] = 'application/json'
    if (token) headers.Authorization = `Bearer ${token}`
    return headers
  }

  const manejar401 = (response) => {
    if (response?.status !== 401) return false
    setMensaje('❌ Sesión expirada. Inicia sesión nuevamente.')
    setTimeout(() => {
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
      window.location.href = '/login'
    }, 900)
    return true
  }

  const queryFiltros = () => {
    const params = new URLSearchParams()
    if (filtros.fecha_inicio) params.set('fecha_inicio', filtros.fecha_inicio)
    if (filtros.fecha_fin) params.set('fecha_fin', filtros.fecha_fin)
    return params.toString()
  }

  const format2 = (valor) => {
    const n = Number(valor)
    if (!Number.isFinite(n)) return ''
    return n.toFixed(2)
  }

  const cargarTasaCambio = async () => {
    try {
      const response = await fetch(`${API_URL}/tasas-cambio/actual`, { headers: authHeaders() })
      if (manejar401(response)) return
      const data = await parseJsonResponse(response)
      if (!response.ok) return
      const tasa = Number(data?.tasa || 0)
      if (Number.isFinite(tasa) && tasa > 0) {
        setTasaCambio(tasa)
      }
    } catch {
      // Si falla la tasa, el módulo sigue funcionando con montos manuales
    }
  }

  const cargar = async () => {
    setCargando(true)
    setMensaje('')
    try {
      const qs = queryFiltros()
      const urlGastos = `${API_URL}/financiero/gastos?limit=80${qs ? `&${qs}` : ''}`
      const [rResumen, rMov, rGastos] = await Promise.all([
        fetch(`${API_URL}/financiero/resumen${qs ? `?${qs}` : ''}`, { headers: authHeaders() }),
        fetch(`${API_URL}/financiero/movimientos${qs ? `?${qs}` : ''}`, { headers: authHeaders() }),
        fetch(urlGastos, { headers: authHeaders() })
      ])
      if (manejar401(rResumen) || manejar401(rMov) || manejar401(rGastos)) return

      const dataResumen = await parseJsonResponse(rResumen)
      const dataMov = await parseJsonResponse(rMov)
      const dataGastos = await parseJsonResponse(rGastos)
      if (!rResumen.ok) throw new Error(dataResumen.error || 'Error al cargar resumen financiero')
      if (!rMov.ok) throw new Error(dataMov.error || 'Error al cargar movimientos')
      if (!rGastos.ok) throw new Error(dataGastos.error || 'Error al cargar gastos')

      setResumen(dataResumen)
      setMovimientos(Array.isArray(dataMov) ? dataMov : [])
      setGastos(Array.isArray(dataGastos) ? dataGastos : [])
    } catch (e) {
      setMensaje(`❌ ${e.message || 'Error de red'}`)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
    cargarTasaCambio()
  }, [])

  const onMontoUsdChange = (valor) => {
    const usdText = valor
    const usdNum = parseFloat(usdText)
    if (!usdText) {
      setGastoForm((prev) => ({ ...prev, monto_usd: '', monto_bs: '' }))
      return
    }
    if (!Number.isFinite(usdNum) || usdNum < 0) {
      setGastoForm((prev) => ({ ...prev, monto_usd: usdText }))
      return
    }
    if (tasaCambio > 0) {
      const bs = usdNum * tasaCambio
      setGastoForm((prev) => ({ ...prev, monto_usd: usdText, monto_bs: format2(bs) }))
      return
    }
    setGastoForm((prev) => ({ ...prev, monto_usd: usdText }))
  }

  const onMontoBsChange = (valor) => {
    const bsText = valor
    const bsNum = parseFloat(bsText)
    if (!bsText) {
      setGastoForm((prev) => ({ ...prev, monto_bs: '', monto_usd: '' }))
      return
    }
    if (!Number.isFinite(bsNum) || bsNum < 0) {
      setGastoForm((prev) => ({ ...prev, monto_bs: bsText }))
      return
    }
    if (tasaCambio > 0) {
      const usd = bsNum / tasaCambio
      setGastoForm((prev) => ({ ...prev, monto_bs: bsText, monto_usd: format2(usd) }))
      return
    }
    setGastoForm((prev) => ({ ...prev, monto_bs: bsText }))
  }

  const requiereReferencia = ['transferencia', 'pago_movil'].includes(String(gastoForm.metodo_pago || ''))

  const registrarGasto = async (e) => {
    e.preventDefault()
    const concepto = String(gastoForm.concepto || '').trim()
    const montoUsd = parseFloat(gastoForm.monto_usd) || 0
    const montoBs = parseFloat(gastoForm.monto_bs) || 0

    if (!concepto) {
      setMensaje('❌ El concepto es obligatorio')
      return
    }
    if (montoUsd <= 0 && montoBs <= 0) {
      setMensaje('❌ Debes indicar monto en USD o Bs')
      return
    }
    if (requiereReferencia && !String(gastoForm.referencia_pago || '').trim()) {
      setMensaje('❌ La referencia es obligatoria para pago móvil o transferencia')
      return
    }

    try {
      const response = await fetch(`${API_URL}/financiero/gastos`, {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({
          concepto,
          categoria: gastoForm.categoria,
          monto_usd: montoUsd,
          monto_bs: montoBs,
          metodo_pago: gastoForm.metodo_pago,
          referencia_pago: requiereReferencia ? (gastoForm.referencia_pago || null) : null,
          tasa_aplicada: tasaCambio > 0 ? Number(format2(tasaCambio)) : null,
          notas: gastoForm.notas || null
        })
      })
      if (manejar401(response)) return
      const data = await parseJsonResponse(response)
      if (!response.ok) throw new Error(data.error || 'No se pudo guardar gasto')

      setMensaje('✅ Gasto operativo registrado')
      setMostrarFormGasto(false)
      setGastoForm({
        concepto: '',
        categoria: 'general',
        monto_usd: '',
        monto_bs: '',
        metodo_pago: 'bs',
        referencia_pago: '',
        notas: ''
      })
      cargar()
    } catch (e) {
      setMensaje(`❌ ${e.message || 'Error al guardar gasto'}`)
    }
  }

  const eliminarGasto = async (gastoId) => {
    if (!confirm('¿Eliminar este gasto operativo?')) return
    try {
      const response = await fetch(`${API_URL}/financiero/gastos/${gastoId}`, {
        method: 'DELETE',
        headers: authHeaders()
      })
      if (manejar401(response)) return
      const data = await parseJsonResponse(response)
      if (!response.ok) throw new Error(data.error || 'No se pudo eliminar gasto')
      setMensaje('✅ Gasto eliminado')
      cargar()
    } catch (e) {
      setMensaje(`❌ ${e.message || 'Error al eliminar gasto'}`)
    }
  }

  const kpis = useMemo(() => ([
    {
      label: 'Ingresos totales',
      value: money(resumen?.ingresos_totales_usd),
      className: 'bg-green-50 text-green-800 border-green-200',
      icon: TrendingUp
    },
    {
      label: 'Egresos totales',
      value: money(resumen?.egresos_totales_usd),
      className: 'bg-red-50 text-red-800 border-red-200',
      icon: TrendingDown
    },
    {
      label: 'Gastos operativos',
      value: money(resumen?.gastos_operativos_usd),
      className: 'bg-purple-50 text-purple-800 border-purple-200',
      icon: TrendingDown
    },
    {
      label: 'Costo materia prima',
      value: money(resumen?.costo_materia_prima_usd),
      className: 'bg-orange-50 text-orange-800 border-orange-200',
      icon: TrendingDown
    },
    {
      label: 'Ingreso bruto',
      value: money(resumen?.ingreso_bruto_usd),
      className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: TrendingUp
    },
    {
      label: 'Ingreso neto',
      value: money(resumen?.ingreso_neto_usd),
      className: 'bg-cyan-50 text-cyan-800 border-cyan-200',
      icon: TrendingUp
    }
  ]), [resumen])

  return (
    <div className="p-2 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center text-gray-800">
          <Wallet className="mr-2 text-orange-600" /> Financiero
        </h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setMostrarFormGasto(true)
              cargarTasaCambio()
            }}
            className="bg-purple-600 text-white px-3 py-2 rounded-lg text-sm inline-flex items-center hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-1" /> Nuevo gasto
          </button>
          <button onClick={cargar} className="bg-gray-100 px-3 py-2 rounded-lg text-sm inline-flex items-center">
            <RefreshCw className="w-4 h-4 mr-1" /> Actualizar
          </button>
        </div>
      </div>

      {mensaje && (
        <div className={`p-3 rounded-lg text-sm ${mensaje.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {mensaje}
        </div>
      )}

      {mostrarFormGasto && (
        <div className="bg-white rounded-xl shadow-lg border-2 border-purple-100 p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-purple-700 text-lg">Registrar gasto operativo</h2>
            <button type="button" onClick={() => setMostrarFormGasto(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={registrarGasto} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2 text-xs rounded-lg border border-blue-200 bg-blue-50 text-blue-800 px-3 py-2">
              Tasa actual: <span className="font-semibold">{tasaCambio > 0 ? `${format2(tasaCambio)} Bs/$` : 'No disponible'}</span>. Al escribir en un monto, el otro se calcula automáticamente.
            </div>
            <input
              type="text"
              required
              value={gastoForm.concepto}
              onChange={(e) => setGastoForm({ ...gastoForm, concepto: e.target.value })}
              placeholder="Concepto"
              className="border rounded-lg px-3 py-2 text-sm sm:col-span-2"
            />
            <select
              value={gastoForm.categoria}
              onChange={(e) => setGastoForm({ ...gastoForm, categoria: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              {CATEGORIAS_GASTO.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <select
              value={gastoForm.metodo_pago}
              onChange={(e) => {
                const metodo = e.target.value
                setGastoForm((prev) => ({
                  ...prev,
                  metodo_pago: metodo,
                  referencia_pago: ['transferencia', 'pago_movil'].includes(metodo) ? prev.referencia_pago : ''
                }))
              }}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              {METODOS_PAGO_GASTO.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <input
              type="number"
              min="0"
              step="0.01"
              value={gastoForm.monto_usd}
              onChange={(e) => onMontoUsdChange(e.target.value)}
              placeholder="Monto USD"
              className="border rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={gastoForm.monto_bs}
              onChange={(e) => onMontoBsChange(e.target.value)}
              placeholder="Monto Bs"
              className="border rounded-lg px-3 py-2 text-sm"
            />
            {requiereReferencia && (
              <input
                type="text"
                required
                value={gastoForm.referencia_pago}
                onChange={(e) => setGastoForm({ ...gastoForm, referencia_pago: e.target.value })}
                placeholder="Referencia de pago (obligatoria)"
                className="border rounded-lg px-3 py-2 text-sm sm:col-span-2"
              />
            )}
            <textarea
              value={gastoForm.notas}
              onChange={(e) => setGastoForm({ ...gastoForm, notas: e.target.value })}
              placeholder="Notas"
              className="border rounded-lg px-3 py-2 text-sm sm:col-span-2"
              rows="2"
            />
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700">
                Guardar gasto
              </button>
              <button type="button" onClick={() => setMostrarFormGasto(false)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          type="date"
          value={filtros.fecha_inicio}
          onChange={(e) => setFiltros({ ...filtros, fecha_inicio: e.target.value })}
          className="border rounded-lg px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={filtros.fecha_fin}
          onChange={(e) => setFiltros({ ...filtros, fecha_fin: e.target.value })}
          className="border rounded-lg px-3 py-2 text-sm"
        />
        <button onClick={cargar} className="bg-orange-600 text-white rounded-lg px-3 py-2 text-sm">Aplicar filtros</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {kpis.map((k) => {
          const Icon = k.icon
          return (
            <div key={k.label} className={`rounded-xl border p-4 ${k.className}`}>
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide opacity-80">{k.label}</p>
                <Icon className="w-4 h-4 opacity-80" />
              </div>
              <p className="text-2xl font-bold mt-1">{k.value}</p>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <button
          type="button"
          onClick={() => setExpandirMovimientos((v) => !v)}
          className="w-full p-3 border-b bg-gray-50 font-semibold text-gray-700 flex items-center justify-between hover:bg-gray-100 transition-colors"
        >
          <span>Movimientos financieros</span>
          {expandirMovimientos ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {expandirMovimientos && (
          <div className="divide-y max-h-[360px] overflow-y-auto">
            {movimientos.map((m) => (
              <div key={`${m.tipo}-${m.origen}-${m.id}-${m.fecha}`} className="p-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{m.concepto}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(m.fecha).toLocaleString('es-VE')} · {String(m.origen || m.tipo).toUpperCase()}
                  </p>
                </div>
                <p className={`text-sm font-semibold ${m.tipo === 'ingreso' ? 'text-green-700' : 'text-red-700'}`}>
                  {m.tipo === 'ingreso' ? '+' : '-'}{money(m.monto_usd)}
                </p>
              </div>
            ))}
            {!cargando && movimientos.length === 0 && (
              <div className="p-6 text-sm text-center text-gray-500">No hay movimientos en el período seleccionado</div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <button
          type="button"
          onClick={() => setExpandirGastos((v) => !v)}
          className="w-full p-3 border-b bg-gray-50 font-semibold text-gray-700 flex items-center justify-between hover:bg-gray-100 transition-colors"
        >
          <span>Gastos operativos recientes</span>
          {expandirGastos ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {expandirGastos && (
          <div className="divide-y">
            {gastos.map((g) => (
              <div key={g.id} className="p-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{g.concepto}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(g.fecha).toLocaleString('es-VE')} · {String(g.categoria || 'general').toUpperCase()} · {String(g.metodo_pago || '').toUpperCase()}
                  </p>
                  <p className="text-xs text-blue-700">
                    Tasa aplicada: {g.tasa_aplicada ? `${Number(g.tasa_aplicada).toFixed(2)} Bs/$` : 'No registrada'}
                  </p>
                  {(g.referencia_pago || g.notas) && (
                    <p className="text-xs text-gray-400 truncate">
                      {g.referencia_pago ? `Ref: ${g.referencia_pago}` : ''} {g.notas ? `· ${g.notas}` : ''}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-red-700">-{money(g.monto_usd)}</p>
                  <button onClick={() => eliminarGasto(g.id)} className="text-xs text-red-500 hover:text-red-700">
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
            {!cargando && gastos.length === 0 && (
              <div className="p-6 text-sm text-center text-gray-500">No hay gastos operativos registrados</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
