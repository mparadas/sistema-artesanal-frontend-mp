import React, { 
  useState, useEffect, useMemo, useCallback, useRef, memo, useReducer 
} from 'react';
import { 
  ShoppingCart, Plus, Trash2, Search, User, Package, DollarSign, 
  CheckCircle, X, Clock, Receipt, Banknote, 
  Smartphone, CreditCard, TrendingUp, FileText, AlertCircle,
  ChevronDown, ChevronUp, RefreshCw, ArrowRightLeft, Filter, Ban, Edit, ArrowLeft, Eye, Bug
} from 'lucide-react';
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

const _estaPagada = (venta) => ['pagado', 'liquidado', 'cancelado', 'anulado'].includes(venta?.estado_pago);

const puedeDevolverAPedidos = (venta) => {
  // Permitir anular ventas pendientes, pagadas o parciales
  const puedeAnular = ['pendiente', 'pagado', 'parcial'].includes(venta?.estado_pago);
  const noEstaAnulada = !['anulada', 'devuelta_a_pedidos'].includes(venta?.estado_pago);
  return puedeAnular && noEstaAnulada;
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

// ==========================================
// HOOKS
// ==========================================
// Forzar actualización en móvil (temporal)
if ('serviceWorker' in navigator && window.location.hostname === 'sistema-artesanal-frontend-mp.vercel.app') {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    registrations.forEach(function(registration) {
      registration.unregister();
      console.log('🔄 Service Worker desregistrado para forzar actualización');
    });
  });
}

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
    expandedClients: new Set()
  });

  const [filtros, setFiltros] = useState({ fecha: '', tipo: '', estado: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tasaActual, setTasaActual] = useState(CONFIG.TASA_DEFAULT);
  const [abonoDraft, setAbonoDraft] = useState({
    monto: '',
    moneda: 'USD',
    metodoPago: 'efectivo',
    referenciaPago: ''
  });
  const [abonosPendientes, setAbonosPendientes] = useState([]);

  const showMessage = useCallback((msg, tipo = 'success') => {
    setUi(prev => ({ ...prev, mensaje: { texto: msg, tipo } }));
    setTimeout(() => setUi(prev => ({ ...prev, mensaje: null })), CONFIG.MESSAGE_DURATION);
  }, []);

  const handleModalToggle = useCallback((key, value = null) => {
    setUi(prev => ({ ...prev, [`modal${key.charAt(0).toUpperCase() + key.slice(1)}`]: value }));
  }, []);

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
  }, [showMessage, refresh]);

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
    setAbonosPendientes([]);
    setTasaActual(tasa);
    handleModalToggle('abono', venta);
  }, [handleModalToggle, showMessage, obtenerTasaActual]);

  const saldoVentaActualVes = useMemo(() => {
    const venta = ui.modalAbono;
    if (!venta) return 0;
    const saldo = toNumber(venta.saldo_pendiente);
    const moneda = String(venta.moneda_original || 'USD').toUpperCase();
    return moneda === 'USD' ? saldo * toNumber(tasaActual) : saldo;
  }, [ui.modalAbono, tasaActual]);

  const subtotalAbonosVes = useMemo(
    () => abonosPendientes.reduce((sum, a) => sum + toNumber(a.montoVes), 0),
    [abonosPendientes]
  );
  const restanteVes = useMemo(
    () => Math.max(0, saldoVentaActualVes - subtotalAbonosVes),
    [saldoVentaActualVes, subtotalAbonosVes]
  );

  const handleAgregarAbonoLinea = useCallback((e) => {
    e.preventDefault();
    const monto = toNumber(abonoDraft.monto);
    if (monto <= 0) return showMessage('Ingresa un monto válido', 'error');
    if (['transferencia', 'pago_movil'].includes(abonoDraft.metodoPago) && !String(abonoDraft.referenciaPago || '').trim()) {
      return showMessage('La referencia es obligatoria para transferencia y pago móvil', 'error');
    }

    const montoVes = abonoDraft.moneda === 'VES' ? monto : monto * toNumber(tasaActual);
    if ((subtotalAbonosVes + montoVes) > (saldoVentaActualVes + 0.01)) {
      return showMessage('Los abonos no pueden superar el saldo total', 'error');
    }

    setAbonosPendientes(prev => [
      ...prev,
      {
        monto,
        moneda: abonoDraft.moneda,
        metodoPago: abonoDraft.metodoPago,
        referenciaPago: String(abonoDraft.referenciaPago || '').trim(),
        montoVes
      }
    ]);
    setAbonoDraft(prev => ({ ...prev, monto: '', referenciaPago: '' }));
  }, [abonoDraft, showMessage, tasaActual, saldoVentaActualVes, subtotalAbonosVes]);

  const handlePagarTotal = useCallback(() => {
    if (restanteVes <= 0) return;
    const moneda = abonoDraft.moneda;
    const monto = moneda === 'VES' ? restanteVes : (restanteVes / toNumber(tasaActual));
    setAbonoDraft(prev => ({ ...prev, monto: Number(monto.toFixed(2)).toString() }));
  }, [restanteVes, abonoDraft.moneda, tasaActual]);

  const handleConfirmarAbonos = useCallback(async () => {
    const venta = ui.modalAbono;
    if (!venta?.id) return;
    if (abonosPendientes.length === 0) return showMessage('Agrega al menos un abono', 'error');

    setIsSubmitting(true);
    try {
      const tasa = await obtenerTasaActual();
      let ultimaRespuesta = null;
      for (const abono of abonosPendientes) {
        const res = await fetch(`${API_URL}/ventas/${venta.id}/pagos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            monto_ves: Number(toNumber(abono.montoVes).toFixed(2)),
            metodo_pago: abono.metodoPago,
            referencia_pago: ['transferencia', 'pago_movil'].includes(abono.metodoPago) ? (abono.referenciaPago || null) : null,
            tasa_cambio: tasa,
            moneda_original: abono.moneda,
            monto_original: abono.monto
          })
        });
        const data = await parseResponseBody(res);
        if (!res.ok) throw new Error(getApiErrorMessage(res, data, 'No se pudo registrar un abono'));
        ultimaRespuesta = data;
      }

      dispatch({
        type: 'UPDATE_VENTA',
        payload: {
          id: venta.id,
          changes: {
            saldo_pendiente: toNumber(ultimaRespuesta?.saldo_pendiente),
            estado_pago: ultimaRespuesta?.estado_pago || venta.estado_pago
          }
        }
      });

      showMessage('Abonos registrados correctamente');
      setUi(prev => ({ ...prev, modalAbono: null }));
      setAbonosPendientes([]);
      setAbonoDraft({ monto: '', moneda: 'USD', metodoPago: 'efectivo', referenciaPago: '' });
      setTimeout(() => { refresh(); }, 250);
    } catch (error) {
      showMessage(error.message || 'Error al registrar abonos', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [ui.modalAbono, abonosPendientes, showMessage, obtenerTasaActual, refresh]);

  const totalGeneral = useMemo(() => ({
    ventas: ventasFiltradas.filter(v => !ES_VENTA_NO_CONTABILIZABLE(v?.estado_pago)).length,
    monto_total: ventasFiltradas
      .filter(v => !ES_VENTA_NO_CONTABILIZABLE(v?.estado_pago))
      .reduce((sum, v) => sum + toNumber(v.total), 0),
    monto_pagado: ventasFiltradas.reduce((sum, v) => sum + toNumber(v.monto_pagado), 0),
    monto_pendiente: ventasFiltradas.reduce((sum, v) => sum + toNumber(v.saldo_pendiente), 0),
    ventas_pagadas: ventasFiltradas.filter(v => v.estado_pago === 'pagado').length,
    ventas_pendientes: ventasFiltradas.filter(v => v.estado_pago === 'pendiente').length,
    ventas_parciales: ventasFiltradas.filter(v => v.estado_pago === 'parcial').length,
    ventas_anuladas: ventasFiltradas.filter(v => ES_VENTA_NO_CONTABILIZABLE(v?.estado_pago)).length
  }), [ventasFiltradas]);

  const estadoCuentaClientes = useMemo(() => {
    const map = new Map();
    for (const v of ventasFiltradas) {
      if (ES_VENTA_NO_CONTABILIZABLE(v?.estado_pago)) continue;
      const key = String(v?.cliente_nombre || 'Cliente general');
      const acc = map.get(key) || { cliente: key, totalVes: 0, pagadoVes: 0, pendienteVes: 0, ventas: 0 };
      const factor = String(v?.moneda_original || 'USD').toUpperCase() === 'USD' ? toNumber(tasaActual) : 1;
      acc.totalVes += toNumber(v?.total) * factor;
      acc.pagadoVes += toNumber(v?.monto_pagado) * factor;
      acc.pendienteVes += toNumber(v?.saldo_pendiente) * factor;
      acc.ventas += 1;
      map.set(key, acc);
    }
    return Array.from(map.values()).sort((a, b) => b.pendienteVes - a.pendienteVes);
  }, [ventasFiltradas, tasaActual]);

  // Componentes UI simplificados
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

  const SimpleModal = memo(({ open, title, onClose, children }) => {
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-xl rounded-lg bg-white shadow-xl border border-gray-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button onClick={onClose} className="p-1 rounded hover:bg-gray-100" type="button">
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <div className="p-4">{children}</div>
        </div>
      </div>
    );
  });

  const VistaCompacta = memo(({ ventas, onVerDetalle, onAbonar, onDevolverAPedidos, submitting }) => (
    <div className="space-y-3">
      {ventas.map((venta) => (
        <div key={venta.id} className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow">
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
              <span className="hidden sm:inline">Ver</span>
            </Button>
            {venta.tipo_venta === 'credito' || venta.estado_pago === 'pendiente' ? (
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
            
            {/* Debug: Mostrar siempre para testing */}
            {import.meta.env.DEV && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => console.log('🔍 Debug venta mobile:', venta)}
                className="flex items-center gap-1"
              >
                <Bug className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Debug</span>
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  ));

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
              setUi(prev => ({ ...prev, tipoEstadoCuenta: 'general', modalEstadoCuenta: true }));
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
            <div className="text-2xl font-bold text-emerald-600">{formatearMonto(totalGeneral.monto_pagado)}</div>
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
            onVerDetalle={(venta) => handleModalToggle('detalle', venta)}
            onAbonar={handleAbonar}
            onDevolverAPedidos={handleDevolverAPedidos}
            submitting={isSubmitting}
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
        title={`Detalle de venta #${ui.modalDetalle?.id || ''}`}
        onClose={() => handleModalToggle('detalle', null)}
      >
        <div className="space-y-2 text-sm text-gray-700">
          <p><strong>Cliente:</strong> {ui.modalDetalle?.cliente_nombre || 'Cliente general'}</p>
          <p><strong>Fecha:</strong> {formatDate(ui.modalDetalle?.fecha)}</p>
          <p><strong>Total:</strong> {formatearMonto(ui.modalDetalle?.total, ui.modalDetalle?.moneda_original)}</p>
          <p><strong>Estado:</strong> {ui.modalDetalle?.estado_pago || 'N/A'}</p>
          <p><strong>Tipo:</strong> {ui.modalDetalle?.tipo_venta || 'N/A'}</p>
        </div>
      </SimpleModal>

      <SimpleModal
        open={Boolean(ui.modalAbono)}
        title={`Abonar venta #${ui.modalAbono?.id || ''}`}
        onClose={() => handleModalToggle('abono', null)}
      >
        <form onSubmit={handleAgregarAbonoLinea} className="space-y-3 text-sm text-gray-700">
          <p>
            <strong>Saldo pendiente:</strong>{' '}
            {formatearMonto(ui.modalAbono?.saldo_pendiente, ui.modalAbono?.moneda_original)}
          </p>
          <p>
            <strong>Tasa actual:</strong> {toNumber(tasaActual).toFixed(4)} Bs/USD
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Monto"
              value={abonoDraft.monto}
              onChange={(e) => setAbonoDraft(prev => ({ ...prev, monto: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
            <select
              value={abonoDraft.moneda}
              onChange={(e) => setAbonoDraft(prev => ({ ...prev, moneda: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="USD">$ USD</option>
              <option value="VES">Bs VES</option>
            </select>
            <select
              value={abonoDraft.metodoPago}
              onChange={(e) => setAbonoDraft(prev => ({ ...prev, metodoPago: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {METODOS_PAGO.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <input
              type="text"
              placeholder="Referencia"
              value={abonoDraft.referenciaPago}
              onChange={(e) => setAbonoDraft(prev => ({ ...prev, referenciaPago: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={!['transferencia', 'pago_movil'].includes(abonoDraft.metodoPago)}
              required={['transferencia', 'pago_movil'].includes(abonoDraft.metodoPago)}
            />
          </div>
          <div className="text-xs text-gray-500">
            Equivalente en Bs: {formatearMonto(abonoDraft.moneda === 'VES' ? toNumber(abonoDraft.monto) : toNumber(abonoDraft.monto) * toNumber(tasaActual), 'VES')}
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handlePagarTotal}>
              Pagar restante
            </Button>
            <Button type="submit" variant="success">
              Agregar abono
            </Button>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left">Monto</th>
                  <th className="px-2 py-2 text-left">Método</th>
                  <th className="px-2 py-2 text-left">Ref</th>
                  <th className="px-2 py-2 text-right">Bs</th>
                  <th className="px-2 py-2 text-right">-</th>
                </tr>
              </thead>
              <tbody>
                {abonosPendientes.map((a, idx) => (
                  <tr key={`${a.metodoPago}-${idx}`} className="border-t border-gray-100">
                    <td className="px-2 py-2">{formatearMonto(a.monto, a.moneda)}</td>
                    <td className="px-2 py-2">{a.metodoPago}</td>
                    <td className="px-2 py-2">{a.referenciaPago || '-'}</td>
                    <td className="px-2 py-2 text-right">{formatearMonto(a.montoVes, 'VES')}</td>
                    <td className="px-2 py-2 text-right">
                      <button
                        type="button"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => setAbonosPendientes(prev => prev.filter((_, i) => i !== idx))}
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))}
                {abonosPendientes.length === 0 && (
                  <tr>
                    <td className="px-2 py-3 text-center text-gray-500" colSpan={5}>Sin abonos agregados</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs sm:text-sm">
            <div className="border rounded p-2">Subtotal Bs: <strong>{formatearMonto(subtotalAbonosVes, 'VES')}</strong></div>
            <div className="border rounded p-2">Total deuda Bs: <strong>{formatearMonto(saldoVentaActualVes, 'VES')}</strong></div>
            <div className="border rounded p-2">Restante Bs: <strong>{formatearMonto(restanteVes, 'VES')}</strong></div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => handleModalToggle('abono', null)}>
              Cancelar
            </Button>
            <Button type="button" loading={isSubmitting} disabled={isSubmitting || abonosPendientes.length === 0} onClick={handleConfirmarAbonos}>
              Confirmar abonos
            </Button>
          </div>
        </form>
      </SimpleModal>

      <SimpleModal
        open={ui.modalEstadoCuenta}
        title={`Estado de cuenta (${ui.tipoEstadoCuenta})`}
        onClose={() => setUi(prev => ({ ...prev, modalEstadoCuenta: false }))}
      >
        <div className="space-y-2">
          <div className="max-h-[55vh] overflow-auto border border-gray-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2">Cliente</th>
                  <th className="text-right px-3 py-2">Ventas</th>
                  <th className="text-right px-3 py-2">Total</th>
                  <th className="text-right px-3 py-2">Pagado</th>
                  <th className="text-right px-3 py-2">Pendiente</th>
                </tr>
              </thead>
              <tbody>
                {estadoCuentaClientes.map((r) => (
                  <tr key={r.cliente} className="border-t border-gray-100">
                    <td className="px-3 py-2">{r.cliente}</td>
                    <td className="px-3 py-2 text-right">{r.ventas}</td>
                    <td className="px-3 py-2 text-right">{formatearMonto(r.totalVes, 'VES')}</td>
                    <td className="px-3 py-2 text-right">{formatearMonto(r.pagadoVes, 'VES')}</td>
                    <td className="px-3 py-2 text-right font-semibold">{formatearMonto(r.pendienteVes, 'VES')}</td>
                  </tr>
                ))}
                {estadoCuentaClientes.length === 0 && (
                  <tr>
                    <td className="px-3 py-4 text-center text-gray-500" colSpan={5}>
                      Sin datos para estado de cuenta.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </SimpleModal>
    </div>
  );
}
