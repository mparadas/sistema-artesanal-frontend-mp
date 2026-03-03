import React, { 
  useState, useEffect, useMemo, useCallback, useRef, memo, useReducer 
} from 'react';
import { 
  ShoppingCart, Plus, Trash2, Search, User, Package, DollarSign, 
  CheckCircle, X, Clock, Receipt, Banknote, 
  Smartphone, CreditCard, TrendingUp, FileText, AlertCircle,
  ChevronDown, ChevronUp, RefreshCw, ArrowRightLeft, Filter, Ban, Edit, ArrowLeft, Eye, Share2
} from 'lucide-react';
import html2canvas from 'html2canvas';
import API_URL from '../config';

// ==========================================
// CONSTANTES
// ==========================================
const METODOS_PAGO = [
  { value: 'efectivo', label: 'Efectivo', icon: Banknote, color: 'bg-green-100 text-green-700' },
  { value: 'transferencia', label: 'Transferencia', icon: CreditCard, color: 'bg-blue-100 text-blue-700' },
  { value: 'pago_movil', label: 'Pago Móvil', icon: Smartphone, color: 'bg-purple-100 text-purple-700' }
];

const ESTADOS_DEFAULT = [
  { codigo: 'pagado', nombre: 'Pagado', color: 'green' },
  { codigo: 'parcial', nombre: 'Parcial', color: 'yellow' },
  { codigo: 'pendiente', nombre: 'Pendiente', color: 'red' },
  { codigo: 'liquidado', nombre: 'Liquidado', color: 'emerald' },
  { codigo: 'cancelado', nombre: 'Cancelado', color: 'gray' },
  { codigo: 'anulado', nombre: 'Anulado', color: 'red' }
];

const CONFIG = {
  TASA_DEFAULT: 405.3518,
  DEBOUNCE_DELAY: 300,
  MESSAGE_DURATION: 5000
};

// ==========================================
// UTILIDADES
// ==========================================
const toNumber = (val) => {
  if (val == null) return 0;
  const num = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : Number(val);
  return Number.isFinite(num) ? num : 0;
};

const formatearMonto = (monto, moneda = 'USD') => {
  const valor = toNumber(monto);
  try {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: moneda,
      minimumFractionDigits: 2
    }).format(valor);
  } catch {
    return moneda === 'VES' ? `Bs ${valor.toFixed(2)}` : `$ ${valor.toFixed(2)}`;
  }
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  try {
    return new Date(date).toLocaleDateString('es-ES');
  } catch {
    return 'N/A';
  }
};

const formatDateTime = (date) => {
  if (!date) return 'N/A';
  try {
    return new Date(date).toLocaleString('es-VE');
  } catch {
    return 'N/A';
  }
};

const formatearNumero = (monto) => {
  const valor = toNumber(monto);
  try {
    return new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(valor);
  } catch {
    return valor.toFixed(2);
  }
};

const formatNumeroNotaEntrega = (fecha, clienteId, ventaId) => {
  const d = new Date(fecha || Date.now());
  const y = Number.isNaN(d.getTime()) ? '0000' : String(d.getFullYear());
  const m = Number.isNaN(d.getTime()) ? '00' : String(d.getMonth() + 1).padStart(2, '0');
  const day = Number.isNaN(d.getTime()) ? '00' : String(d.getDate()).padStart(2, '0');
  const cliente = String(Math.max(0, Math.trunc(toNumber(clienteId)))).padStart(4, '0');
  const venta = String(Math.max(0, Math.trunc(toNumber(ventaId))));
  return `${y}${m}${day}${cliente}${venta}`;
};

const _estaPagada = (venta) => ['pagado', 'liquidado', 'cancelado', 'anulado'].includes(venta?.estado_pago);

const puedeDevolverAPedidos = (venta) => {
  // Permitir devolver a pedidos solo ventas pendientes o parciales
  const puedeAnular = ['pendiente', 'parcial'].includes(venta?.estado_pago);
  const noEstaAnulada = !['anulada', 'devuelta_a_pedidos'].includes(venta?.estado_pago);
  return puedeAnular && noEstaAnulada;
};

const puedeAbonarVenta = (venta) => {
  if (!venta) return false;
  if (ES_VENTA_NO_CONTABILIZABLE(venta?.estado_pago)) return false;
  if (['pagado', 'liquidado', 'cancelado', 'anulado'].includes(String(venta?.estado_pago || '').toLowerCase())) return false;
  return toNumber(venta?.saldo_pendiente) > 0;
};

const puedeReabrirVentaPagada = (venta) => {
  if (!venta) return false;
  const estado = String(venta?.estado_pago || '').toLowerCase();
  if (estado !== 'pagado') return false;
  const ts = Date.parse(venta?.fecha || '');
  if (!Number.isFinite(ts)) return false;
  const diffDias = (Date.now() - ts) / (1000 * 60 * 60 * 24);
  return diffDias >= 0 && diffDias <= 2;
};

const _puedeModificarVenta = (venta) => {
  return venta?.estado_pago !== 'anulado';
};

const getEstadoColor = (estado) => {
  const map = {
    pagado: 'bg-green-100 text-green-700 border-green-200',
    parcial: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    pendiente: 'bg-red-100 text-red-700 border-red-200',
    liquidado: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    cancelado: 'bg-gray-100 text-gray-700 border-gray-200',
    anulado: 'bg-red-100 text-red-700 border-red-200',
    devuelta_a_pedidos: 'bg-orange-100 text-orange-700 border-orange-200'
  };
  return map[estado] || 'bg-gray-100 text-gray-700 border-gray-200';
};

const _getOrigenVenta = (venta) => {
  const origen = String(venta?.origen_venta || '').toLowerCase();
  if (origen === 'catalogo' || origen === 'pedido' || origen === 'directa') return origen;
  return 'directa';
};

const parseResponseBody = async (res) => {
  const raw = await res.text().catch(() => '');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return { error: raw };
  }
};

const getApiErrorMessage = (res, body, fallback = 'Error de servidor') => {
  const base = body?.error || body?.detalle || body?.mensaje || `${fallback} (HTTP ${res.status})`;
  return base;
};

const ES_VENTA_NO_CONTABILIZABLE = (estado) => ['anulado', 'devuelta_a_pedidos'].includes(String(estado || '').toLowerCase());

const ventasOrdenadasMasAntiguaPrimero = (lista = []) =>
  [...lista].sort((a, b) => {
    const fa = Date.parse(a?.fecha || 0) || 0;
    const fb = Date.parse(b?.fecha || 0) || 0;
    if (fa !== fb) return fa - fb;
    return (toNumber(a?.id) - toNumber(b?.id));
  });

const Button = memo(({ children, onClick, variant = 'primary', size = 'md', loading = false, disabled = false, className = '', type = 'button', title, ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500',
    outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500'
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      title={title}
      {...props}
    >
      {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
      {children}
    </button>
  );
});

const SimpleModal = memo(({ open, title, onClose, children, zIndexClass = 'z-50', panelClass = 'max-w-xl', bodyClass = 'p-4' }) => {
  if (!open) return null;
  return (
    <div className={`fixed inset-0 ${zIndexClass} flex items-start sm:items-center justify-center overflow-y-auto bg-black/40 p-4`}>
      <div className={`w-full ${panelClass} rounded-lg bg-white shadow-xl border border-gray-200`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100" type="button">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <div className={bodyClass}>{children}</div>
      </div>
    </div>
  );
});

const VistaCompacta = memo(({ ventas, onVerDetalle, onAbonar, onDevolverAPedidos, onReabrirPendiente, submitting, esAdmin }) => (
  <div className="space-y-3">
    {ventas.map((venta) => (
      <div
        key={venta.id}
        className={`rounded-lg border p-3 transition-shadow ${
          String(venta?.estado_pago || '').toLowerCase() === 'anulado'
            ? 'bg-red-50 border-red-300 text-red-900 shadow-sm'
            : 'bg-white border-gray-200 hover:shadow-md'
        }`}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <div className="font-medium text-gray-900">
              Venta #{venta.id}
              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(venta.estado_pago)}`}>
                {venta.estado_pago}
              </span>
            </div>
            <div className="text-sm text-gray-600">{venta.cliente_nombre}</div>
            <div className="text-xs text-gray-500">{formatDate(venta.fecha)}</div>
          </div>
          <div className="text-right">
            <div className="font-medium text-gray-900">{formatearMonto(venta.total, venta.moneda_original)}</div>
            {toNumber(venta.saldo_pendiente) > 0 && (
              <div className="text-xs text-orange-600">Pendiente: {formatearMonto(venta.saldo_pendiente, venta.moneda_original)}</div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onVerDetalle(venta)}>
            <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="ml-1">Ver</span>
          </Button>
          {puedeAbonarVenta(venta) ? (
            <Button
              variant={venta.tipo_venta === 'credito' ? 'primary' : 'success'}
              size="sm"
              onClick={() => onAbonar(venta)}
              className="flex-1 min-h-10 text-sm font-medium"
            >
              <DollarSign className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">{venta.tipo_venta === 'credito' ? 'Abonar' : 'Pagar'}</span>
            </Button>
          ) : null}
          {esAdmin && puedeReabrirVentaPagada(venta) && (
            <Button
              variant="warning"
              size="sm"
              onClick={() => onReabrirPendiente(venta)}
              disabled={submitting}
              loading={submitting}
              title="Devolver venta a pendiente por error (max 2 dias)"
            >
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="ml-1">Devolver</span>
            </Button>
          )}
          {esAdmin && puedeDevolverAPedidos(venta) && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDevolverAPedidos(venta)}
              disabled={submitting}
              loading={submitting}
              title="Devolver a pedidos (montos en cero)"
            >
              <Ban className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline ml-1">Devolver</span>
            </Button>
          )}

        </div>
      </div>
    ))}
  </div>
));

// ==========================================
// HOOKS
// ==========================================

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function Ventas() {
  const [state, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case 'FETCH_START': return { ...state, loading: true, error: null };
      case 'FETCH_SUCCESS': return { ...state, ...action.payload, loading: false, lastUpdated: new Date().toISOString() };
      case 'FETCH_ERROR': return { ...state, error: action.payload, loading: false };
      case 'UPDATE_VENTA':
        return {
          ...state,
          ventas: state.ventas.map((v) => (
            v?.id === action.payload?.id
              ? { ...v, ...action.payload?.changes }
              : v
          )),
          lastUpdated: new Date().toISOString()
        };
      default: return state;
    }
  }, {
    ventas: [],
    productos: [],
    clientes: [],
    estadosVenta: ESTADOS_DEFAULT,
    loading: true,
    error: null,
    lastUpdated: null
  });

  const abortControllerRef = useRef(null);
  const notaDetalleRef = useRef(null);

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) dispatch({ type: 'FETCH_START' });

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      const endpoints = [
        { key: 'ventas', url: `${API_URL}/ventas` },
        { key: 'productos', url: `${API_URL}/productos` },
        { key: 'clientes', url: `${API_URL}/clientes` },
        { key: 'estadosVenta', url: `${API_URL}/estados-venta`, optional: true }
      ];

      const results = await Promise.allSettled(
        endpoints.map(async ({ key, url, optional }) => {
          try {
            const res = await fetch(`${url}${url.includes('?') ? '&' : '?'}_ts=${Date.now()}`, {
              signal: abortControllerRef.current.signal,
              cache: 'no-store'
            });
            const data = await parseResponseBody(res);
            if (!res.ok && !optional) throw new Error(getApiErrorMessage(res, data, `Error en ${key}`));
            return { key, data: data?.data || data || (key === 'estadosVenta' ? ESTADOS_DEFAULT : []) };
          } catch (err) {
            if (err.name === 'AbortError' || optional) {
              return { key, data: key === 'estadosVenta' ? ESTADOS_DEFAULT : [] };
            }
            throw err;
          }
        })
      );

      const payload = {};
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          payload[result.value.key] = result.value.data;
        }
      });

      dispatch({ type: 'FETCH_SUCCESS', payload });
    } catch (err) {
      dispatch({ type: 'FETCH_ERROR', payload: err.message });
    }
  }, []);

  const refresh = useCallback(() => fetchData(true), [fetchData]);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  useEffect(() => () => abortControllerRef.current?.abort(), []);

  const { ventas, estadosVenta, loading, error, lastUpdated } = state;

  // Obtener usuario actual para verificar rol de admin
  const usuarioActual = (() => { 
    try { 
      return JSON.parse(localStorage.getItem('usuario') || '{}') 
    } catch { 
      return {}; 
    } 
  })();

  const esAdmin = usuarioActual?.rol === 'admin';

  const [ui, setUi] = useState({
    mensaje: null,
    modalVenta: false,
    modalDetalle: null,
    modalAbono: null,
    modalEstadoCuenta: false,
    tipoEstadoCuenta: 'general',
    estadoCuentaDetalleTipo: 'ventas',
    expandedClients: new Set()
  });

  const [filtros, setFiltros] = useState({ fecha: '', tipo: '', estado: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [isSharingDetalle, setIsSharingDetalle] = useState(false);
  const [tasaActual, setTasaActual] = useState(CONFIG.TASA_DEFAULT);
  const [abonoDraft, setAbonoDraft] = useState({
    monto: '',
    moneda: 'USD',
    metodoPago: 'efectivo',
    referenciaPago: ''
  });
  const [abonoGeneralVentasDetalle, setAbonoGeneralVentasDetalle] = useState([]);
  const [abonoGeneralAccordionOpen, setAbonoGeneralAccordionOpen] = useState([]);
  const [abonosHistorialAccordionOpen, setAbonosHistorialAccordionOpen] = useState(false);
  const [abonosHistorial, setAbonosHistorial] = useState([]);
  const [abonosPendientes, setAbonosPendientes] = useState([]);

  const showMessage = useCallback((msg, tipo = 'success') => {
    setUi(prev => ({ ...prev, mensaje: { texto: msg, tipo } }));
    setTimeout(() => setUi(prev => ({ ...prev, mensaje: null })), CONFIG.MESSAGE_DURATION);
  }, []);

  const handleModalToggle = useCallback((key, value = null) => {
    setUi(prev => ({ ...prev, [`modal${key.charAt(0).toUpperCase() + key.slice(1)}`]: value }));
  }, []);

  const cargarHistorialAbonos = useCallback(async (ventasDestino = []) => {
    const idsVenta = [...new Set(
      (ventasDestino || [])
        .map(v => toNumber(v?.id))
        .filter(id => id > 0)
    )];
    if (idsVenta.length === 0) {
      setAbonosHistorial([]);
      return;
    }

    const resultados = await Promise.allSettled(
      idsVenta.map(async (ventaId) => {
        const res = await fetch(`${API_URL}/ventas/${ventaId}`);
        const data = await parseResponseBody(res);
        if (!res.ok) throw new Error(getApiErrorMessage(res, data, `No se pudo obtener historial de abonos de venta #${ventaId}`));
        return { ventaId, pagos: Array.isArray(data?.pagos) ? data.pagos : [] };
      })
    );

    const historial = resultados.flatMap((resultado) => {
      if (resultado.status !== 'fulfilled') return [];
      const { ventaId, pagos } = resultado.value;
      return pagos.map((p) => {
        const tasa = Math.max(toNumber(p?.tasa_cambio) || toNumber(tasaActual), 1);
        const monedaOriginal = String(p?.moneda_original || 'USD').toUpperCase();
        const montoVes = toNumber(p?.monto_bs) > 0
          ? toNumber(p?.monto_bs)
          : toNumber(p?.monto_ves) > 0
          ? toNumber(p?.monto_ves)
          : (monedaOriginal === 'VES'
            ? toNumber(p?.monto_original || p?.monto)
            : (toNumber(p?.monto_original || p?.monto) * tasa));
        const montoUsd = toNumber(p?.monto_usd) > 0
          ? toNumber(p?.monto_usd)
          : monedaOriginal === 'USD'
          ? toNumber(p?.monto_original || p?.monto)
          : (montoVes / tasa);

        return {
          ventaId,
          montoVes,
          montoUsd,
          tasaDelDia: tasa,
          fechaAbono: p?.fecha,
          metodoPago: p?.metodo_pago || 'N/A',
          referenciaPago: p?.referencia_pago || ''
        };
      });
    });

    historial.sort((a, b) => {
      const fa = Date.parse(a?.fechaAbono || 0) || 0;
      const fb = Date.parse(b?.fechaAbono || 0) || 0;
      return fa - fb;
    });
    setAbonosHistorial(historial);
  }, [tasaActual]);

  const handleFilterChange = useCallback((key, value) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
  }, []);

  const obtenerTasaActual = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/tasas-cambio/actual`);
      const data = await parseResponseBody(res);
      if (!res.ok) throw new Error(getApiErrorMessage(res, data, 'No se pudo obtener tasa actual'));
      const tasa = toNumber(data?.tasa);
      if (tasa > 0) {
        setTasaActual(tasa);
        return tasa;
      }
    } catch {
      return tasaActual;
    }
    return tasaActual;
  }, [tasaActual]);

  const ventasFiltradas = useMemo(() => {
    let filtradas = ventas;
    if (filtros.fecha) {
      filtradas = filtradas.filter(v => {
        if (!v?.fecha) return false;
        try {
          const fechaVenta = new Date(v.fecha).toISOString().split('T')[0];
          return fechaVenta === filtros.fecha;
        } catch {
          return false;
        }
      });
    }
    if (filtros.tipo) filtradas = filtradas.filter(v => v?.tipo_venta === filtros.tipo);
    if (filtros.estado) filtradas = filtradas.filter(v => v?.estado_pago === filtros.estado);
    return filtradas;
  }, [ventas, filtros]);

  const handleDevolverAPedidos = useCallback(async (venta) => {
    if (!esAdmin) {
      showMessage('Solo administradores pueden devolver ventas', 'error');
      return;
    }
    if (!venta || !venta.id) {
      showMessage('Error: Venta no válida', 'error');
      return;
    }

    if (!puedeDevolverAPedidos(venta)) {
      showMessage('Error: Esta venta no puede ser devuelta a pedidos.', 'error');
      return;
    }

    // Crear diálogo simple con confirmación
    const confirmacion = confirm(
      `¿Está seguro que desea devolver a pedidos la venta #${venta.id}?\n\n` +
      `Cliente: ${venta.cliente_nombre || 'Cliente general'}\n` +
      `Monto: ${formatearMonto(venta.total, venta.moneda_original)}\n\n` +
      `Esta acción:\n` +
      `• Pondrá los montos en cero\n` +
      `• Cambiará el estado a "devuelta a pedidos"\n` +
      `• No afectará las estadísticas`
    );

    if (!confirmacion) {
      showMessage('Operación cancelada por el usuario');
      return;
    }

    // Proceder con anulación
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/ventas/${venta.id}/devolver-a-pedidos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          motivo_devolucion: 'Anulada por administrador',
          fecha_devolucion: new Date().toISOString()
        })
      });

      if (!res.ok) {
        const data = await parseResponseBody(res);
        throw new Error(getApiErrorMessage(res, data, 'Error al devolver venta a pedidos'));
      }

      // Reflejo inmediato para evitar UI stale por caché intermedio
      dispatch({
        type: 'UPDATE_VENTA',
        payload: {
          id: venta.id,
          changes: {
            estado_pago: 'devuelta_a_pedidos',
            total: 0,
            monto_pagado: 0,
            saldo_pendiente: 0
          }
        }
      });

      showMessage(`Venta #${venta.id} devuelta a pedidos correctamente - No afectará estadísticas`);
      setTimeout(() => { refresh(); }, 300);
    } catch (error) {
      showMessage(error.message || 'Error al devolver venta a pedidos', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [showMessage, refresh, esAdmin]);

  const handleReabrirVentaPagada = useCallback(async (venta) => {
    if (!esAdmin) {
      showMessage('Solo administradores pueden devolver ventas pagadas', 'error');
      return;
    }
    if (!venta?.id) return;
    if (!puedeReabrirVentaPagada(venta)) {
      return showMessage('Solo se puede reabrir una venta pagada dentro de los primeros 2 dias', 'error');
    }
    const confirmacion = window.confirm(
      `¿Marcar venta #${venta.id} nuevamente como pendiente?\n\n` +
      `Cliente: ${venta.cliente_nombre || 'Cliente general'}\n` +
      `Total: ${formatearMonto(venta.total, venta.moneda_original)}`
    );
    if (!confirmacion) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/ventas/${venta.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado_pago: 'pendiente',
          saldo_pendiente: toNumber(venta.total)
        })
      });
      const data = await parseResponseBody(res);
      if (!res.ok) throw new Error(getApiErrorMessage(res, data, `No se pudo reabrir venta #${venta.id}`));

      dispatch({
        type: 'UPDATE_VENTA',
        payload: {
          id: venta.id,
          changes: {
            estado_pago: 'pendiente',
            monto_pagado: 0,
            saldo_pendiente: toNumber(venta.total)
          }
        }
      });
      showMessage(`Venta #${venta.id} reabierta como pendiente`);
      setTimeout(() => { refresh(); }, 250);
    } catch (error) {
      showMessage(error.message || 'Error al reabrir venta', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [showMessage, refresh, esAdmin]);

  const handleAbonar = useCallback(async (venta) => {
    if (!venta || !venta.id) {
      showMessage('Error: Venta no válida', 'error');
      return;
    }
    const tasa = await obtenerTasaActual();
    setAbonoDraft({
      monto: '',
      moneda: String(venta?.moneda_original || 'USD').toUpperCase() === 'VES' ? 'VES' : 'USD',
      metodoPago: 'efectivo',
      referenciaPago: ''
    });
    setAbonoGeneralVentasDetalle([]);
    setAbonoGeneralAccordionOpen([]);
    setAbonosHistorialAccordionOpen(false);
    setAbonosHistorial([]);
    setAbonosPendientes([]);
    setTasaActual(tasa);
    handleModalToggle('abono', venta);
    cargarHistorialAbonos([venta]).catch(() => {
      setAbonosHistorial([]);
    });
  }, [handleModalToggle, showMessage, obtenerTasaActual, cargarHistorialAbonos]);

  const cerrarModalAbono = useCallback(() => {
    setUi(prev => ({ ...prev, modalAbono: null }));
    setAbonoGeneralVentasDetalle([]);
    setAbonoGeneralAccordionOpen([]);
    setAbonosHistorialAccordionOpen(false);
    setAbonosHistorial([]);
    setAbonosPendientes([]);
    setAbonoDraft({ monto: '', moneda: 'USD', metodoPago: 'efectivo', referenciaPago: '' });
  }, []);

  const montoVentaActualVes = useMemo(() => {
    const venta = ui.modalAbono;
    if (!venta) return 0;
    const montoVenta = toNumber(venta.total) > 0 ? toNumber(venta.total) : toNumber(venta.saldo_pendiente);
    const moneda = String(venta.moneda_original || 'USD').toUpperCase();
    return moneda === 'USD' ? montoVenta * toNumber(tasaActual) : montoVenta;
  }, [ui.modalAbono, tasaActual]);

  const abonosMostrados = useMemo(
    () => [...abonosHistorial, ...abonosPendientes],
    [abonosHistorial, abonosPendientes]
  );
  const subtotalAbonosVes = useMemo(
    () => abonosMostrados.reduce((sum, a) => sum + toNumber(a.montoVes), 0),
    [abonosMostrados]
  );
  const subtotalAbonosUsd = useMemo(
    () => subtotalAbonosVes / Math.max(toNumber(tasaActual), 1),
    [subtotalAbonosVes, tasaActual]
  );
  const restanteVes = useMemo(
    () => Math.max(0, montoVentaActualVes - subtotalAbonosVes),
    [montoVentaActualVes, subtotalAbonosVes]
  );
  const montoVentaActualUsd = useMemo(
    () => montoVentaActualVes / Math.max(toNumber(tasaActual), 1),
    [montoVentaActualVes, tasaActual]
  );
  const restanteUsd = useMemo(
    () => Math.max(0, montoVentaActualUsd - subtotalAbonosUsd),
    [montoVentaActualUsd, subtotalAbonosUsd]
  );

  const handleAgregarAbonoLinea = useCallback(async (e) => {
    e.preventDefault();
    const venta = ui.modalAbono;
    if (!venta) return;
    const monto = toNumber(abonoDraft.monto);
    if (monto <= 0) return showMessage('Ingresa un monto válido', 'error');
    if (['transferencia', 'pago_movil'].includes(abonoDraft.metodoPago) && !String(abonoDraft.referenciaPago || '').trim()) {
      return showMessage('La referencia es obligatoria para transferencia y pago móvil', 'error');
    }

    const montoVes = abonoDraft.moneda === 'VES' ? monto : monto * toNumber(tasaActual);
    const tasaDelDia = toNumber(tasaActual);
    const montoUsd = abonoDraft.moneda === 'USD' ? monto : (monto / Math.max(tasaDelDia, 1));
    if (montoVes > (restanteVes + 0.01)) {
      return showMessage('Los abonos no pueden superar el saldo total', 'error');
    }

    setIsSubmitting(true);
    try {
      const tasa = await obtenerTasaActual();
      const ventasDestino = Array.isArray(venta?._ventasPendientes) && venta._ventasPendientes.length > 0
        ? ventasOrdenadasMasAntiguaPrimero(venta._ventasPendientes)
        : [venta];

      let restanteAbonoVes = montoVes;
      for (const ventaDestino of ventasDestino) {
        if (restanteAbonoVes <= 0.0001) break;
        const factorVenta = String(ventaDestino?.moneda_original || 'USD').toUpperCase() === 'USD' ? tasa : 1;
        const saldoVentaVes = toNumber(ventaDestino?.saldo_pendiente) * factorVenta;
        if (saldoVentaVes <= 0.0001) continue;

        const montoAplicarVes = Math.min(restanteAbonoVes, saldoVentaVes);
        const montoOriginalAplicado = abonoDraft.moneda === 'VES'
          ? montoAplicarVes
          : (montoAplicarVes / tasa);

        const res = await fetch(`${API_URL}/ventas/${ventaDestino.id}/pagos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            monto_ves: Number(montoAplicarVes.toFixed(2)),
            metodo_pago: abonoDraft.metodoPago,
            referencia_pago: ['transferencia', 'pago_movil'].includes(abonoDraft.metodoPago)
              ? (String(abonoDraft.referenciaPago || '').trim() || null)
              : null,
            tasa_cambio: tasa,
            moneda_original: abonoDraft.moneda,
            monto_original: Number(montoOriginalAplicado.toFixed(2))
          })
        });
        const data = await parseResponseBody(res);
        if (!res.ok) throw new Error(getApiErrorMessage(res, data, `No se pudo registrar abono en venta #${ventaDestino.id}`));
        restanteAbonoVes -= montoAplicarVes;
      }

      setAbonosPendientes(prev => [
        ...prev,
        {
          monto,
          moneda: abonoDraft.moneda,
          metodoPago: abonoDraft.metodoPago,
          referenciaPago: String(abonoDraft.referenciaPago || '').trim(),
          montoVes,
          montoUsd,
          tasaDelDia: toNumber(tasa),
          fechaAbono: new Date().toISOString()
        }
      ]);
      setUi(prev => {
        const modal = prev.modalAbono;
        if (!modal) return prev;
        const monedaVenta = String(modal.moneda_original || 'USD').toUpperCase();
        const descuento = monedaVenta === 'VES' ? montoVes : montoUsd;
        return {
          ...prev,
          modalAbono: {
            ...modal,
            saldo_pendiente: Math.max(0, toNumber(modal.saldo_pendiente) - descuento)
          }
        };
      });
      setAbonoDraft(prev => ({ ...prev, monto: '', referenciaPago: '' }));
      showMessage('Abono guardado correctamente');
      setTimeout(() => { refresh(); }, 250);
    } catch (error) {
      showMessage(error.message || 'Error al registrar abono', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [ui.modalAbono, abonoDraft, showMessage, tasaActual, restanteVes, obtenerTasaActual, refresh]);

  const handlePagarTotal = useCallback(() => {
    if (restanteVes <= 0) return;
    const moneda = abonoDraft.moneda;
    const monto = moneda === 'VES' ? restanteVes : (restanteVes / toNumber(tasaActual));
    setAbonoDraft(prev => ({ ...prev, monto: Number(monto.toFixed(2)).toString() }));
  }, [restanteVes, abonoDraft.moneda, tasaActual]);

  const ventasMesActual = useMemo(() => {
    const ahora = new Date();
    const mes = ahora.getMonth();
    const anio = ahora.getFullYear();
    return ventasFiltradas.filter((v) => {
      const fecha = new Date(v?.fecha || '');
      if (Number.isNaN(fecha.getTime())) return false;
      return fecha.getMonth() === mes && fecha.getFullYear() === anio;
    });
  }, [ventasFiltradas]);

  const totalGeneral = useMemo(() => ({
    ventas: ventasMesActual.filter(v => !ES_VENTA_NO_CONTABILIZABLE(v?.estado_pago)).length,
    monto_total: ventasMesActual
      .filter(v => !ES_VENTA_NO_CONTABILIZABLE(v?.estado_pago))
      .reduce((sum, v) => sum + toNumber(v.total), 0),
    monto_pagado: ventasMesActual.reduce((sum, v) => sum + toNumber(v.monto_pagado), 0),
    monto_pagado_usd: ventasMesActual
      .filter(v => !ES_VENTA_NO_CONTABILIZABLE(v?.estado_pago))
      .reduce((sum, v) => {
        const factor = String(v?.moneda_original || 'USD').toUpperCase() === 'VES'
          ? (1 / Math.max(toNumber(tasaActual), 1))
          : 1;
        const totalUsd = toNumber(v?.total) * factor;
        const pendienteUsd = toNumber(v?.saldo_pendiente) * factor;
        return sum + Math.max(0, totalUsd - pendienteUsd);
      }, 0),
    monto_pendiente: ventasMesActual.reduce((sum, v) => sum + toNumber(v.saldo_pendiente), 0),
    ventas_pagadas: ventasMesActual.filter(v => v.estado_pago === 'pagado').length,
    ventas_pendientes: ventasMesActual.filter(v => v.estado_pago === 'pendiente').length,
    ventas_parciales: ventasMesActual.filter(v => v.estado_pago === 'parcial').length,
    ventas_anuladas: ventasMesActual.filter(v => ES_VENTA_NO_CONTABILIZABLE(v?.estado_pago)).length
  }), [ventasMesActual, tasaActual]);

  const estadoCuentaClientes = useMemo(() => {
    const map = new Map();
    for (const v of ventasMesActual) {
      if (ES_VENTA_NO_CONTABILIZABLE(v?.estado_pago)) continue;
      const key = String(v?.cliente_nombre || 'Cliente general');
      const acc = map.get(key) || { cliente: key, totalUsd: 0, pagadoUsd: 0, pendienteUsd: 0, ventas: 0, ventasDetalle: [] };
      const factor = String(v?.moneda_original || 'USD').toUpperCase() === 'VES' ? (1 / Math.max(toNumber(tasaActual), 1)) : 1;
      const totalUsd = toNumber(v?.total) * factor;
      const pendienteUsd = toNumber(v?.saldo_pendiente) * factor;
      const pagadoUsd = Math.max(0, totalUsd - pendienteUsd);
      acc.totalUsd += totalUsd;
      acc.pagadoUsd += pagadoUsd;
      acc.pendienteUsd += pendienteUsd;
      acc.ventas += 1;
      acc.ventasDetalle.push(v);
      map.set(key, acc);
    }
    return Array.from(map.values()).sort((a, b) => b.pendienteUsd - a.pendienteUsd);
  }, [ventasMesActual, tasaActual]);

  const estadoCuentaStats = useMemo(() => {
    const totalVentas = estadoCuentaClientes.reduce((s, c) => s + c.totalUsd, 0);
    const totalPagado = estadoCuentaClientes.reduce((s, c) => s + c.pagadoUsd, 0);
    const totalPendiente = estadoCuentaClientes.reduce((s, c) => s + c.pendienteUsd, 0);
    return {
      totalVentas,
      totalPagado,
      totalPendiente,
      porcentajePagado: totalVentas > 0 ? (totalPagado / totalVentas) * 100 : 0
    };
  }, [estadoCuentaClientes]);

  const estadoCuentaHistorial = useMemo(() => {
    const base = ventasMesActual
      .filter(v => !ES_VENTA_NO_CONTABILIZABLE(v?.estado_pago))
      .map((v) => {
        const factor = String(v?.moneda_original || 'USD').toUpperCase() === 'VES'
          ? (1 / Math.max(toNumber(tasaActual), 1))
          : 1;
        const totalUsd = toNumber(v?.total) * factor;
        const pendienteUsd = toNumber(v?.saldo_pendiente) * factor;
        const pagadoUsd = Math.max(0, totalUsd - pendienteUsd);
        const porcentajePagado = totalUsd > 0 ? (pagadoUsd / totalUsd) * 100 : 0;
        return {
          id: v?.id,
          cliente: v?.cliente_nombre || 'Cliente general',
          fecha: v?.fecha,
          estado: v?.estado_pago || 'N/A',
          totalUsd,
          pagadoUsd,
          pendienteUsd,
          porcentajePagado
        };
      });

    return {
      ventas: base,
      pagado: base.filter(x => x.pagadoUsd > 0.001),
      pendiente: base.filter(x => x.pendienteUsd > 0.001),
      porcentaje: [...base].sort((a, b) => b.porcentajePagado - a.porcentajePagado)
    };
  }, [ventasMesActual, tasaActual]);

  const toggleClienteExpandido = useCallback((cliente) => {
    setUi(prev => {
      const set = new Set(prev.expandedClients || []);
      if (set.has(cliente)) set.delete(cliente);
      else set.add(cliente);
      return { ...prev, expandedClients: set };
    });
  }, []);

  const toggleVentaAbonoGeneralAccordion = useCallback((ventaId) => {
    setAbonoGeneralAccordionOpen((prev) => (
      prev.includes(ventaId)
        ? prev.filter((id) => id !== ventaId)
        : [...prev, ventaId]
    ));
  }, []);

  const toggleHistorialAbonosAccordion = useCallback(() => {
    setAbonosHistorialAccordionOpen((prev) => !prev);
  }, []);

  const handleAbonarCliente = useCallback(async (clienteItem) => {
    const ventasPendientes = ventasOrdenadasMasAntiguaPrimero(
      (clienteItem?.ventasDetalle || []).filter(v => toNumber(v?.saldo_pendiente) > 0)
    );
    if (ventasPendientes.length === 0) return showMessage('El cliente no tiene saldo pendiente', 'error');
    const tasa = await obtenerTasaActual();
    const saldoVes = ventasPendientes.reduce((s, v) => {
      const factor = String(v?.moneda_original || 'USD').toUpperCase() === 'USD' ? tasa : 1;
      return s + (toNumber(v?.saldo_pendiente) * factor);
    }, 0);
    setAbonoDraft({ monto: '', moneda: 'VES', metodoPago: 'efectivo', referenciaPago: '' });
    setAbonoGeneralVentasDetalle([]);
    setAbonoGeneralAccordionOpen([]);
    setAbonosHistorialAccordionOpen(false);
    setAbonosHistorial([]);
    setAbonosPendientes([]);
    setTasaActual(tasa);
    setUi(prev => ({
      ...prev,
      modalAbono: {
        id: `cliente-${clienteItem?.cliente}`,
        cliente_nombre: clienteItem?.cliente,
        moneda_original: 'VES',
        saldo_pendiente: saldoVes,
        _ventasPendientes: ventasPendientes
      }
    }));
    cargarHistorialAbonos(ventasPendientes).catch(() => {
      setAbonosHistorial([]);
    });
    Promise.allSettled(
      ventasPendientes.map(async (v) => {
        const res = await fetch(`${API_URL}/ventas/${v.id}`);
        const data = await parseResponseBody(res);
        if (!res.ok) throw new Error(getApiErrorMessage(res, data, `No se pudo cargar detalle de venta #${v.id}`));
        return { ...v, ...data };
      })
    ).then((results) => {
      const detalle = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value)
        .sort((a, b) => {
          const fa = Date.parse(a?.fecha || 0) || 0;
          const fb = Date.parse(b?.fecha || 0) || 0;
          if (fa !== fb) return fa - fb;
          return toNumber(a?.id) - toNumber(b?.id);
        });
      setAbonoGeneralVentasDetalle(detalle);
      setAbonoGeneralAccordionOpen(detalle.length > 0 ? [detalle[0].id] : []);
    }).catch(() => {
      setAbonoGeneralVentasDetalle([]);
      setAbonoGeneralAccordionOpen([]);
    });
  }, [showMessage, obtenerTasaActual, cargarHistorialAbonos]);

  const handleVerDetalle = useCallback(async (ventaBase) => {
    if (!ventaBase?.id) return;
    setDetalleLoading(true);
    try {
      const res = await fetch(`${API_URL}/ventas/${ventaBase.id}`);
      const data = await parseResponseBody(res);
      if (!res.ok) throw new Error(getApiErrorMessage(res, data, `No se pudo cargar detalle de venta #${ventaBase.id}`));
      const pagosOrdenados = Array.isArray(data?.pagos)
        ? [...data.pagos].sort((a, b) => {
          const fa = Date.parse(a?.fecha || 0) || 0;
          const fb = Date.parse(b?.fecha || 0) || 0;
          return fa - fb;
        })
        : [];
      setUi(prev => ({ ...prev, modalDetalle: { ...ventaBase, ...data, pagos: pagosOrdenados } }));
    } catch (error) {
      showMessage(error.message || 'No se pudo cargar el detalle completo', 'error');
      setUi(prev => ({ ...prev, modalDetalle: ventaBase }));
    } finally {
      setDetalleLoading(false);
    }
  }, [showMessage]);

  const handleVerDetalleDesdeAbono = useCallback(() => {
    const ventasBase = Array.isArray(ui.modalAbono?._ventasPendientes) && ui.modalAbono._ventasPendientes.length > 0
      ? ventasOrdenadasMasAntiguaPrimero(ui.modalAbono._ventasPendientes)
      : (ui.modalAbono?.id ? [ui.modalAbono] : []);
    const ventaObjetivo = ventasBase[0];
    if (!ventaObjetivo?.id || String(ventaObjetivo.id).startsWith('cliente-')) {
      showMessage('No se encontró una venta válida para mostrar el detalle.', 'error');
      return;
    }
    if (ventasBase.length > 1) {
      showMessage(`Mostrando detalle de la venta #${ventaObjetivo.id} (la más antigua con saldo).`, 'info');
    }
    handleVerDetalle(ventaObjetivo);
  }, [ui.modalAbono, showMessage, handleVerDetalle]);

  const handleCompartirDetalle = useCallback(async () => {
    if (!ui.modalDetalle?.id || !notaDetalleRef.current) return;
    setIsSharingDetalle(true);
    try {
      const canvas = await html2canvas(notaDetalleRef.current, {
        backgroundColor: '#ffffff',
        scale: Math.min(2, window.devicePixelRatio || 1.5),
        useCORS: true,
        logging: false
      });
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('No se pudo generar la imagen de la nota');

      const clienteSafe = String(ui.modalDetalle?.cliente_nombre || 'cliente-general')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase() || 'cliente-general';
      const fechaVenta = new Date(ui.modalDetalle?.fecha || Date.now());
      const fechaSafe = Number.isNaN(fechaVenta.getTime())
        ? 'sin-fecha'
        : `${fechaVenta.getFullYear()}-${String(fechaVenta.getMonth() + 1).padStart(2, '0')}-${String(fechaVenta.getDate()).padStart(2, '0')}`;
      const fileName = `nota-${clienteSafe}-${fechaSafe}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });
      const texto = `NOTA #${ui.modalDetalle.id} - ${ui.modalDetalle?.cliente_nombre || 'Cliente general'}`;

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `NOTA #${ui.modalDetalle.id}`,
          text: texto,
          files: [file]
        });
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showMessage('Imagen descargada. Puedes adjuntarla en WhatsApp, Telegram o correo.', 'info');
    } catch (error) {
      if (error?.name !== 'AbortError') {
        showMessage(error.message || 'No se pudo compartir la nota', 'error');
      }
    } finally {
      setIsSharingDetalle(false);
    }
  }, [ui.modalDetalle, showMessage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Cargando ventas...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-600 mb-4">Error al cargar las ventas</div>
          <div className="text-gray-600 text-sm">{error}</div>
          <Button onClick={refresh} className="mt-4">
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  const monedaModalAbono = String(ui.modalAbono?.moneda_original || 'USD').toUpperCase();
  const montoVentaTop = toNumber(ui.modalAbono?.total) > 0
    ? toNumber(ui.modalAbono?.total)
    : toNumber(ui.modalAbono?.saldo_pendiente);
  const montoVentaTopUsd = monedaModalAbono === 'VES'
    ? (montoVentaTop / Math.max(toNumber(tasaActual), 1))
    : montoVentaTop;
  const saldoPendienteTopUsd = monedaModalAbono === 'VES'
    ? (toNumber(ui.modalAbono?.saldo_pendiente) / Math.max(toNumber(tasaActual), 1))
    : toNumber(ui.modalAbono?.saldo_pendiente);
  const isTypingMonto = String(abonoDraft.monto || '').trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ventas</h1>
            <p className="text-gray-600 mt-1">Gestión de ventas y pagos</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => {
              setUi(prev => ({ ...prev, tipoEstadoCuenta: 'general', estadoCuentaDetalleTipo: 'ventas', modalEstadoCuenta: true }));
            }}>
              <FileText className="w-4 h-4 mr-2" />
              Estado de cuenta
            </Button>
            <Button onClick={() => handleModalToggle('venta')}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Venta
            </Button>
          </div>
        </div>
      </div>

      {/* Resumen General */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen General</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{totalGeneral.ventas}</div>
            <div className="text-sm text-blue-600">Total Ventas</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{formatearMonto(totalGeneral.monto_total)}</div>
            <div className="text-sm text-green-600">Monto Total</div>
          </div>
          <div className="text-center p-4 bg-emerald-50 rounded-lg">
            <div className="text-2xl font-bold text-emerald-600">{formatearMonto(totalGeneral.monto_pagado_usd, 'USD')}</div>
            <div className="text-sm text-emerald-600">Pagado</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{formatearMonto(totalGeneral.monto_pendiente)}</div>
            <div className="text-sm text-orange-600">Pendiente</div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-lg font-semibold text-gray-700">{totalGeneral.ventas_pagadas}</div>
            <div className="text-xs text-gray-600">Pagadas</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded">
            <div className="text-lg font-semibold text-red-600">{totalGeneral.ventas_pendientes}</div>
            <div className="text-xs text-red-600">Pendientes</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded">
            <div className="text-lg font-semibold text-yellow-600">{totalGeneral.ventas_parciales}</div>
            <div className="text-xs text-yellow-600">Parciales</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded">
            <div className="text-lg font-semibold text-red-600">{totalGeneral.ventas_anuladas}</div>
            <div className="text-xs text-red-600">Anuladas</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input
              type="date"
              value={filtros.fecha}
              onChange={(e) => handleFilterChange('fecha', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={filtros.tipo}
              onChange={(e) => handleFilterChange('tipo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              <option value="inmediato">Inmediato</option>
              <option value="credito">Crédito</option>
              <option value="contado">Contado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={filtros.estado}
              onChange={(e) => handleFilterChange('estado', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              {estadosVenta.map(estado => (
                <option key={estado.codigo} value={estado.codigo}>{estado.nombre}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Ventas */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Lista de Ventas ({ventasFiltradas.length})
          </h2>
          <div className="text-sm text-gray-500">
            Última actualización: {lastUpdated ? formatDate(lastUpdated) : 'N/A'}
          </div>
        </div>

        {/* Vista de listado */}
        <div className="block">
          <VistaCompacta 
            ventas={ventasFiltradas}
            onVerDetalle={handleVerDetalle}
            onAbonar={handleAbonar}
            onDevolverAPedidos={handleDevolverAPedidos}
            onReabrirPendiente={handleReabrirVentaPagada}
            submitting={isSubmitting}
            esAdmin={esAdmin}
          />
        </div>

        {ventasFiltradas.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">No se encontraron ventas</div>
          </div>
        )}
      </div>

      {/* Mensajes */}
      {ui.mensaje && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg ${
          ui.mensaje.tipo === 'success' ? 'bg-green-100 text-green-700 border border-green-200' :
          ui.mensaje.tipo === 'error' ? 'bg-red-100 text-red-700 border border-red-200' :
          'bg-blue-100 text-blue-700 border border-blue-200'
        }`}>
          {ui.mensaje.texto}
        </div>
      )}

      <SimpleModal
        open={ui.modalVenta}
        title="Nueva venta"
        onClose={() => handleModalToggle('venta', false)}
      >
        <p className="text-sm text-gray-700">
          El formulario completo de nueva venta está en proceso de integración en este módulo.
        </p>
      </SimpleModal>

      <SimpleModal
        open={Boolean(ui.modalDetalle)}
        title=""
        onClose={() => handleModalToggle('detalle', null)}
        zIndexClass="z-[90]"
        panelClass="max-w-4xl"
        bodyClass="p-3 sm:p-4"
      >
        <div className="space-y-4 text-base text-gray-700">
          <div ref={notaDetalleRef} className="relative space-y-4">
          {ES_VENTA_NO_CONTABILIZABLE(ui.modalDetalle?.estado_pago) && (
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
              <span className="text-red-600/20 font-black tracking-[0.25em] text-8xl rotate-[-24deg] select-none">
                ANULADO
              </span>
            </div>
          )}
          <div className="space-y-2 border-b border-gray-200 pb-3 -mt-2">
            <div className="flex items-start justify-between gap-3">
              <img
                src="/logo_agromae.png"
                alt="AgroMAE"
                className="h-20 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/agromae_transparent.png';
                }}
              />
              <div className="flex flex-col items-start gap-2">
                <div data-html2canvas-ignore="true">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCompartirDetalle}
                    loading={isSharingDetalle}
                    disabled={detalleLoading || isSharingDetalle}
                    className="w-auto"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Compartir nota
                  </Button>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-wide text-gray-500">Documento</p>
                  <p className="text-sm text-gray-500">
                    Nro: {formatNumeroNotaEntrega(
                      ui.modalDetalle?.fecha,
                      ui.modalDetalle?.cliente_id,
                      ui.modalDetalle?.id
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="border border-gray-200 rounded-lg p-3">
              <p className="text-sm text-gray-500">Cliente</p>
              <p className="font-semibold text-gray-900">{ui.modalDetalle?.cliente_nombre || 'Cliente general'}</p>
              <p className="text-sm text-gray-500 mt-2">Fecha</p>
              <p>{formatDate(ui.modalDetalle?.fecha)}</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-3">
              <p className="text-sm text-gray-500">Estado</p>
              <p className="font-semibold capitalize">{ui.modalDetalle?.estado_pago || 'N/A'}</p>
              <p className="text-sm text-gray-500 mt-2">Tipo de venta</p>
              <p className="capitalize">{ui.modalDetalle?.tipo_venta || 'N/A'}</p>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-3">
            <p className="font-semibold text-gray-900 mb-2">Desglose del pedido</p>
            {detalleLoading ? (
              <p className="text-gray-500">Cargando desglose...</p>
            ) : Array.isArray(ui.modalDetalle?.items) && ui.modalDetalle.items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-2 py-2">Producto</th>
                      <th className="text-right px-2 py-2">Cant.</th>
                      <th className="text-right px-2 py-2">P. Unit</th>
                      <th className="text-right px-2 py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ui.modalDetalle.items.map((it, idx) => (
                      <tr key={`${it.producto_id || idx}-${idx}`} className="border-t border-gray-100">
                        <td className="px-2 py-2">{it.producto_nombre || `Producto #${it.producto_id || idx}`}</td>
                        <td className="px-2 py-2 text-right">{toNumber(it.cantidad).toFixed(2)}</td>
                        <td className="px-2 py-2 text-right">{formatearMonto(it.precio_unitario, ui.modalDetalle?.moneda_original)}</td>
                        <td className="px-2 py-2 text-right">{formatearMonto(it.total_linea, ui.modalDetalle?.moneda_original)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">Sin items detallados para esta venta.</p>
            )}
            <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
              <div>
                <p className="text-sm text-gray-500">Total venta</p>
                <p className="font-semibold">{formatearMonto(ui.modalDetalle?.total, ui.modalDetalle?.moneda_original)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Saldo pendiente</p>
                <p className="font-semibold">{formatearMonto(ui.modalDetalle?.saldo_pendiente, ui.modalDetalle?.moneda_original)}</p>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-3">
            <p className="font-semibold text-gray-900 mb-2">Historial de abonos</p>
            {detalleLoading ? (
              <p className="text-gray-500">Cargando historial...</p>
            ) : Array.isArray(ui.modalDetalle?.pagos) && ui.modalDetalle.pagos.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-2 py-2">Fecha</th>
                      <th className="text-right px-2 py-2">$</th>
                      <th className="text-right px-2 py-2">Bs</th>
                      <th className="text-left px-2 py-2">Método</th>
                      <th className="text-left px-2 py-2">Ref</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ui.modalDetalle.pagos.map((p, idx) => {
                      const tasa = Math.max(toNumber(p?.tasa_cambio) || toNumber(tasaActual), 1);
                      const bs = toNumber(p?.monto_bs) > 0
                        ? toNumber(p?.monto_bs)
                        : (toNumber(p?.monto_ves) > 0 ? toNumber(p?.monto_ves) : (toNumber(p?.monto_usd || p?.monto_original || p?.monto) * tasa));
                      const usd = toNumber(p?.monto_usd) > 0
                        ? toNumber(p?.monto_usd)
                        : (bs / tasa);
                      return (
                        <tr key={`${p.id || idx}-${idx}`} className="border-t border-gray-100">
                          <td className="px-2 py-2">{formatDateTime(p?.fecha)}</td>
                          <td className="px-2 py-2 text-right">{formatearMonto(usd, 'USD')}</td>
                          <td className="px-2 py-2 text-right">{formatearMonto(bs, 'VES')}</td>
                          <td className="px-2 py-2 capitalize">{(p?.metodo_pago || 'N/A').replace('_', ' ')}</td>
                          <td className="px-2 py-2">{p?.referencia_pago || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No hay abonos registrados.</p>
            )}
          </div>
          </div>
        </div>
      </SimpleModal>

      <SimpleModal
        open={Boolean(ui.modalAbono)}
        title={Array.isArray(ui.modalAbono?._ventasPendientes) ? 'Registrar Abono General' : `Registrar Abono #${ui.modalAbono?.id || ''}`}
        onClose={cerrarModalAbono}
        zIndexClass="z-[70]"
      >
        <form onSubmit={handleAgregarAbonoLinea} className="space-y-3 text-sm text-gray-700">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
            <p className="text-sm text-gray-500 mb-1">Cliente: {ui.modalAbono?.cliente_nombre || 'Cliente general'}</p>
            <div className="grid grid-cols-2 gap-3 items-start">
              <div>
                <p className="text-sm text-blue-700 font-medium">Monto de la venta</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-800">
                  {formatearMonto(montoVentaTopUsd, 'USD')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-orange-700 font-medium">Saldo pendiente</p>
                <p className="text-lg sm:text-xl font-semibold text-orange-800">
                  {formatearMonto(saldoPendienteTopUsd, 'USD')}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-0.5">Tasa actual: {toNumber(tasaActual).toFixed(4)} Bs/USD</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Moneda del Abono</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAbonoDraft(prev => ({ ...prev, moneda: 'USD' }))}
                className={`rounded-lg border px-3 py-2 font-medium transition-colors ${
                  abonoDraft.moneda === 'USD' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                $ USD
              </button>
              <button
                type="button"
                onClick={() => setAbonoDraft(prev => ({ ...prev, moneda: 'VES' }))}
                className={`rounded-lg border px-3 py-2 font-medium transition-colors ${
                  abonoDraft.moneda === 'VES' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                Bs VES
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Monto</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder={abonoDraft.moneda === 'USD' ? '$ 0.00' : 'Bs 0.00'}
              value={abonoDraft.monto}
              onChange={(e) => setAbonoDraft(prev => ({ ...prev, monto: e.target.value }))}
              className="w-full px-3 py-3 border-2 border-orange-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <label className="block text-sm font-medium text-gray-700">Método de Pago</label>
              <p className="text-xs text-right">
                <span className="text-gray-500 mr-1">Equivalente:</span>
                <span className={isTypingMonto ? 'text-blue-700 font-semibold mr-1' : 'text-gray-500 mr-1'}>USD</span>
                <span className={isTypingMonto ? 'text-blue-700 font-semibold' : 'text-gray-600'}>
                  {formatearMonto(
                    abonoDraft.moneda === 'VES'
                      ? (toNumber(abonoDraft.monto) / Math.max(toNumber(tasaActual), 1))
                      : toNumber(abonoDraft.monto),
                    'USD'
                  )}
                </span>
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {METODOS_PAGO.map((m) => {
                const Icon = m.icon;
                const active = abonoDraft.metodoPago === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setAbonoDraft(prev => ({ ...prev, metodoPago: m.value }))}
                    className={`rounded-lg border p-2 text-center transition-colors ${
                      active ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 bg-white text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 mx-auto mb-1" />
                    <span className="text-xs">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {['transferencia', 'pago_movil'].includes(abonoDraft.metodoPago) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Referencia <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ingrese la referencia"
                value={abonoDraft.referenciaPago}
                onChange={(e) => setAbonoDraft(prev => ({ ...prev, referenciaPago: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={handleVerDetalleDesdeAbono}>
              <Eye className="w-4 h-4 mr-1" />
              Ver detalle
            </Button>
            <Button type="button" variant="outline" onClick={handlePagarTotal}>Pagar restante</Button>
            <Button type="submit" variant="success" loading={isSubmitting} disabled={isSubmitting}>Agregar abono</Button>
          </div>

          {Array.isArray(ui.modalAbono?._ventasPendientes) && (
            <div className="border border-gray-200 rounded-xl p-3 bg-white space-y-3">
              <p className="font-semibold text-gray-800">Ventas incluidas (productos)</p>
              <div className="max-h-[32vh] sm:max-h-[38vh] overflow-auto space-y-2 pr-1">
                {abonoGeneralVentasDetalle.map((v) => {
                  const isOpen = abonoGeneralAccordionOpen.includes(v.id);
                  return (
                    <div key={`general-venta-${v.id}`} className="border rounded-lg p-2 bg-gray-50">
                      <button
                        type="button"
                        onClick={() => toggleVentaAbonoGeneralAccordion(v.id)}
                        className="w-full flex items-center justify-between gap-2 text-left"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <p className="font-medium text-gray-800">Venta #{v.id}</p>
                            <p className="text-xs text-gray-500">{formatDate(v.fecha)}</p>
                            <p className="text-xs text-gray-600">
                              Saldo: {formatearMonto(v.saldo_pendiente, v.moneda_original)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-gray-600">{isOpen ? 'Ocultar' : 'Ver detalle'}</span>
                          {isOpen ? <ChevronUp className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
                        </div>
                      </button>

                      {isOpen && (
                        <>
                          <div className="mt-2">
                            {Array.isArray(v.items) && v.items.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="w-full min-w-[420px] text-xs">
                                  <thead>
                                    <tr className="text-gray-500">
                                      <th className="text-left py-1">Producto</th>
                                      <th className="text-right py-1">Cant.</th>
                                      <th className="text-right py-1">Total</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {v.items.map((it, idx) => (
                                      <tr key={`it-${v.id}-${idx}`} className="border-t border-gray-200">
                                        <td className="py-1">{it.producto_nombre || `Producto #${it.producto_id || idx}`}</td>
                                        <td className="py-1 text-right">{toNumber(it.cantidad).toFixed(2)}</td>
                                        <td className="py-1 text-right">{formatearMonto(it.total_linea, v.moneda_original)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500">Sin productos disponibles.</p>
                            )}
                          </div>

                        </>
                      )}
                    </div>
                  );
                })}
                {abonoGeneralVentasDetalle.length === 0 && (
                  <p className="text-xs text-gray-500">Cargando detalle de ventas...</p>
                )}
              </div>
            </div>
          )}

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={toggleHistorialAbonosAccordion}
              className="w-full flex items-center justify-between px-2 py-2 bg-gray-50 text-left"
            >
              <div>
                <p className="text-xs font-semibold text-gray-700">Historial de abonos</p>
                <p className="text-[11px] text-gray-500">{abonosMostrados.length} registro(s)</p>
              </div>
              {abonosHistorialAccordionOpen ? <ChevronUp className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
            </button>
            {abonosHistorialAccordionOpen && (
              <table className="w-full table-fixed text-[10px] leading-tight sm:text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-1.5 py-1 text-right">$</th>
                    <th className="px-1.5 py-1 text-right">Tasa</th>
                    <th className="px-1.5 py-1 text-left">Fecha</th>
                    <th className="px-1.5 py-1 text-left">Método</th>
                    <th className="px-1.5 py-1 text-left">Ref</th>
                    <th className="px-1.5 py-1 text-right">Bs</th>
                    <th className="px-1.5 py-1 text-right">-</th>
                  </tr>
                </thead>
                <tbody>
                  {abonosMostrados.map((a, idx) => (
                    <tr key={`${a.ventaId || 'local'}-${a.metodoPago}-${a.fechaAbono || idx}`} className="border-t border-gray-100">
                      <td className="px-1.5 py-1 text-right break-words">{formatearMonto(a.montoUsd, 'USD')}</td>
                      <td className="px-1.5 py-1 text-right">{toNumber(a.tasaDelDia).toFixed(2)}</td>
                      <td className="px-1.5 py-1 break-words">{formatDate(a.fechaAbono)}</td>
                      <td className="px-1.5 py-1 break-words">{a.metodoPago}</td>
                      <td className="px-1.5 py-1 break-words">{a.referenciaPago || '-'}</td>
                      <td className="px-1.5 py-1 text-right break-words">{formatearMonto(a.montoVes, 'VES')}</td>
                      <td className="px-1.5 py-1 text-right text-emerald-700">Guardado</td>
                    </tr>
                  ))}
                  {abonosMostrados.length === 0 && (
                    <tr>
                      <td className="px-2 py-2 text-center text-gray-500" colSpan={7}>Sin historial de abonos</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
            <div className="border rounded p-2">
              <p className="font-medium text-gray-700">Total abonos</p>
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-semibold">{formatearMonto(subtotalAbonosUsd, 'USD')}</p>
                <p className="text-gray-600">{formatearMonto(subtotalAbonosVes, 'VES')}</p>
              </div>
            </div>
            <div className="border rounded p-2">
              <p className="font-medium text-gray-700">Restante</p>
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-semibold">{formatearMonto(restanteUsd, 'USD')}</p>
                <p className="text-gray-600">{formatearMonto(restanteVes, 'VES')}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={cerrarModalAbono}>Cancelar</Button>
          </div>
        </form>
      </SimpleModal>

      <SimpleModal
        open={ui.modalEstadoCuenta}
        title={`Estado de cuenta (${ui.tipoEstadoCuenta})`}
        onClose={() => setUi(prev => ({ ...prev, modalEstadoCuenta: false, estadoCuentaDetalleTipo: 'ventas' }))}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 bg-gray-100 p-1 rounded-lg w-fit">
            <Button size="sm" variant={ui.tipoEstadoCuenta === 'general' ? 'primary' : 'secondary'} onClick={() => setUi(prev => ({ ...prev, tipoEstadoCuenta: 'general' }))}>
              General
            </Button>
            <Button size="sm" variant={ui.tipoEstadoCuenta === 'clientes' ? 'primary' : 'secondary'} onClick={() => setUi(prev => ({ ...prev, tipoEstadoCuenta: 'clientes' }))}>
              Por Clientes
            </Button>
          </div>
          <p className="text-xs text-gray-500">Tarjetas calculadas por mes actual.</p>

          {ui.tipoEstadoCuenta === 'general' ? (
            <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button type="button" onClick={() => setUi(prev => ({ ...prev, estadoCuentaDetalleTipo: 'ventas' }))} className={`border rounded-lg p-3 bg-blue-50 text-left ${ui.estadoCuentaDetalleTipo === 'ventas' ? 'ring-2 ring-blue-300' : ''}`}>
                <p className="text-xs text-blue-700">Total Ventas ($)</p>
                <p className="text-xl font-bold text-blue-900">
                  <span className="text-[11px] align-top mr-1">USD</span>
                  {formatearNumero(estadoCuentaStats.totalVentas)}
                </p>
              </button>
              <button type="button" onClick={() => setUi(prev => ({ ...prev, estadoCuentaDetalleTipo: 'pagado' }))} className={`border rounded-lg p-3 bg-green-50 text-left ${ui.estadoCuentaDetalleTipo === 'pagado' ? 'ring-2 ring-green-300' : ''}`}>
                <p className="text-xs text-green-700">Total Pagado ($)</p>
                <p className="text-xl font-bold text-green-900">
                  <span className="text-[11px] align-top mr-1">USD</span>
                  {formatearNumero(estadoCuentaStats.totalPagado)}
                </p>
              </button>
              <button type="button" onClick={() => setUi(prev => ({ ...prev, estadoCuentaDetalleTipo: 'pendiente' }))} className={`border rounded-lg p-3 bg-red-50 text-left ${ui.estadoCuentaDetalleTipo === 'pendiente' ? 'ring-2 ring-red-300' : ''}`}>
                <p className="text-xs text-red-700">Total Pendiente ($)</p>
                <p className="text-xl font-bold text-red-900">
                  <span className="text-[11px] align-top mr-1">USD</span>
                  {formatearNumero(estadoCuentaStats.totalPendiente)}
                </p>
              </button>
              <button type="button" onClick={() => setUi(prev => ({ ...prev, estadoCuentaDetalleTipo: 'porcentaje' }))} className={`border rounded-lg p-3 bg-purple-50 text-left ${ui.estadoCuentaDetalleTipo === 'porcentaje' ? 'ring-2 ring-purple-300' : ''}`}>
                <p className="text-xs text-purple-700">% Pagado</p>
                <p className="text-xl font-bold text-purple-900">{estadoCuentaStats.porcentajePagado.toFixed(1)}%</p>
              </button>
            </div>
            <div className="border rounded-lg p-3">
              <p className="font-semibold text-gray-800 mb-2">
                Historial: {
                  ui.estadoCuentaDetalleTipo === 'pagado' ? 'Pagado' :
                  ui.estadoCuentaDetalleTipo === 'pendiente' ? 'Pendiente' :
                  ui.estadoCuentaDetalleTipo === 'porcentaje' ? 'Mayor % pagado' :
                  'Ventas'
                } (mes actual)
              </p>
              <div className="max-h-[35vh] overflow-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-2 text-left">Venta</th>
                      <th className="px-2 py-2 text-left">Cliente</th>
                      <th className="px-2 py-2 text-left">Fecha</th>
                      <th className="px-2 py-2 text-right">Total $</th>
                      <th className="px-2 py-2 text-right">Pagado $</th>
                      <th className="px-2 py-2 text-right">Pendiente $</th>
                      <th className="px-2 py-2 text-right">% Pago</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(estadoCuentaHistorial[ui.estadoCuentaDetalleTipo] || []).map((r) => (
                      <tr key={`hist-${r.id}`} className="border-t border-gray-100">
                        <td className="px-2 py-2">#{r.id}</td>
                        <td className="px-2 py-2">{r.cliente}</td>
                        <td className="px-2 py-2">{formatDate(r.fecha)}</td>
                        <td className="px-2 py-2 text-right">{formatearMonto(r.totalUsd, 'USD')}</td>
                        <td className="px-2 py-2 text-right">{formatearMonto(r.pagadoUsd, 'USD')}</td>
                        <td className="px-2 py-2 text-right">{formatearMonto(r.pendienteUsd, 'USD')}</td>
                        <td className="px-2 py-2 text-right">{r.porcentajePagado.toFixed(1)}%</td>
                      </tr>
                    ))}
                    {(estadoCuentaHistorial[ui.estadoCuentaDetalleTipo] || []).length === 0 && (
                      <tr>
                        <td className="px-2 py-3 text-center text-gray-500" colSpan={7}>Sin datos para este periodo.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            </>
          ) : (
            <div className="max-h-[55vh] overflow-auto space-y-3 pr-1">
              {estadoCuentaClientes.map((c) => {
                const isOpen = (ui.expandedClients || new Set()).has(c.cliente);
                const pendientes = ventasOrdenadasMasAntiguaPrimero((c.ventasDetalle || []).filter(v => toNumber(v?.saldo_pendiente) > 0));
                const progreso = c.totalUsd > 0 ? Math.max(0, Math.min(100, (c.pagadoUsd / c.totalUsd) * 100)) : 0;
                return (
                  <div key={c.cliente} className="border rounded-xl overflow-hidden">
                    <button type="button" onClick={() => toggleClienteExpandido(c.cliente)} className="w-full text-left p-3 hover:bg-gray-50">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-gray-800">{c.cliente}</p>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div className="bg-gradient-to-r from-red-500 to-green-500 h-2 rounded-full" style={{ width: `${progreso}%` }} />
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatearMonto(c.totalUsd, 'USD')}</p>
                          <p className="text-red-600 text-sm">Debe: {formatearMonto(c.pendienteUsd, 'USD')}</p>
                        </div>
                      </div>
                    </button>
                    {isOpen && (
                      <div className="border-t bg-gray-50 p-3 space-y-2">
                        <p className="text-xs text-gray-500">El pago se aplica desde la venta más antigua</p>
                        {pendientes.map((v, idx) => (
                          <div key={v.id} className="bg-white border rounded-lg p-2 flex justify-between items-center">
                            <div>
                              <p className="font-medium">#{v.id} {idx === 0 ? <span className="text-xs bg-orange-100 text-orange-600 px-1 rounded">Más antigua</span> : null}</p>
                              <p className="text-xs text-gray-500">{formatDate(v.fecha)}</p>
                            </div>
                            <p className="font-semibold text-red-600">{formatearMonto(v.saldo_pendiente, v.moneda_original)}</p>
                          </div>
                        ))}
                        <Button className="w-full" onClick={() => handleAbonarCliente(c)}>
                          <DollarSign className="w-4 h-4 mr-2" /> Registrar Abono General
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SimpleModal>
    </div>
  );
}
