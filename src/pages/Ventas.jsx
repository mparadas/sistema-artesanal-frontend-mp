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

const estaPagada = (venta) => ['pagado', 'liquidado', 'cancelado', 'anulado'].includes(venta?.estado_pago);

const puedeAnularVenta = (venta) => {
  const esPagada = ['pagado', 'parcial'].includes(venta?.estado_pago);
  const noEstaAnulada = venta?.estado_pago !== 'anulado';
  return esPagada && noEstaAnulada;
};

const puedeDevolverAPedidos = (venta) => {
  const esPendiente = venta?.estado_pago === 'pendiente';
  const noEstaDevuelta = venta?.estado_pago !== 'devuelta_a_pedidos';
  return esPendiente && noEstaDevuelta;
};

const puedeModificarVenta = (venta) => {
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

const getOrigenVenta = (venta) => {
  const origen = String(venta?.origen_venta || '').toLowerCase();
  if (origen === 'catalogo' || origen === 'pedido' || origen === 'directa') return origen;
  return 'directa';
};

const getOrigenConfig = (venta) => {
  const origen = getOrigenVenta(venta);
  if (origen === 'catalogo') {
    return { label: 'Catalogo', className: 'bg-amber-100 text-amber-700 border-amber-200' };
  }
  if (origen === 'pedido') {
    return { label: 'Pedido', className: 'bg-blue-100 text-blue-700 border-blue-200' };
  }
  return { label: 'Directa', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
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

// ==========================================
// HOOKS
// ==========================================
const useDebounce = (value, delay = CONFIG.DEBOUNCE_DELAY) => {
  const [debounced, setDebounced] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return debounced;
};

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
            const res = await fetch(url, { signal: abortControllerRef.current.signal });
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

  useEffect(() => () => abortControllerRef.current?.abort(), []);

  const { ventas, productos, clientes, estadosVenta, loading, error, lastUpdated } = state;

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
  const [submitting, setSubmitting] = useState(false);

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
      showMessage('Error: Esta venta no puede ser anulada.', 'error');
      return;
    }

    // Crear diálogo personalizado con botones claros
    const userChoice = window.prompt(
      `¿Qué desea hacer con la venta #${venta.id}?\n\n` +
      `Cliente: ${venta.cliente_nombre || 'Cliente general'}\n` +
      `Monto: ${formatearMonto(venta.total, venta.moneda_original)}\n\n` +
      `Escriba una opción:\n` +
      `• "ANULAR" para anular la venta (montos en cero)\n` +
      `• "CANCEL" para mantener como pendiente\n` +
      `• CANCEL o ESC para abortar`,
      'CANCEL'
    );

    if (!userChoice || userChoice.toUpperCase() === 'CANCEL') {
      return;
    }

    const action = userChoice.toUpperCase();
    
    if (action === 'ANULAR') {
      // Proceder con anulación
      setSubmitting(true);
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
          throw new Error(getApiErrorMessage(res, data, 'Error al anular venta'));
        }

        showMessage(`Venta #${venta.id} anulada correctamente - No afectará estadísticas`);
        console.log('🔄 Refrescando datos después de anular venta...');
        await refresh(); // Forzar refresh asíncrono
        console.log('✅ Datos refrescados');
        
        // Forzar actualización adicional si es necesario
        setTimeout(() => {
          console.log('🔄 Forzando segundo refresh...');
          refresh();
        }, 1000);
      } catch (error) {
        showMessage(error.message || 'Error al anular venta', 'error');
      } finally {
        setSubmitting(false);
      }
    } else if (action === 'CANCEL' || action === 'PENDIENTE') {
      showMessage('Venta mantenida como pendiente');
      return;
    } else {
      showMessage('Opción no válida. Operación cancelada.', 'error');
      return;
    }
  }, [showMessage, refresh]);

  const handleModificarVenta = useCallback(async (venta) => {
    if (!venta || !venta.id) {
      showMessage('Error: Venta no válida', 'error');
      return;
    }

    if (!puedeModificarVenta(venta)) {
      showMessage('Error: Esta venta no puede ser modificada.', 'error');
      return;
    }

    showMessage('Función de modificar en desarrollo');
  }, [showMessage]);

  const handleAbonar = useCallback(async (venta) => {
    if (!venta || !venta.id) {
      showMessage('Error: Venta no válida', 'error');
      return;
    }

    handleModalToggle('abono', venta);
  }, [handleModalToggle, showMessage]);

  const totalGeneral = useMemo(() => ({
    ventas: ventasFiltradas.length,
    monto_total: ventasFiltradas.reduce((sum, v) => sum + toNumber(v.total), 0),
    monto_pagado: ventasFiltradas.reduce((sum, v) => sum + toNumber(v.monto_pagado), 0),
    monto_pendiente: ventasFiltradas.reduce((sum, v) => sum + toNumber(v.saldo_pendiente), 0),
    ventas_pagadas: ventasFiltradas.filter(v => v.estado_pago === 'pagado').length,
    ventas_pendientes: ventasFiltradas.filter(v => v.estado_pago === 'pendiente').length,
    ventas_parciales: ventasFiltradas.filter(v => v.estado_pago === 'parcial').length,
    ventas_anuladas: ventasFiltradas.filter(v => v.estado_pago === 'anulado').length
  }), [ventasFiltradas]);

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

  const VistaCompacta = memo(({ ventas, onVerDetalle, onAbonar, onDevolverAPedidos }) => (
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
              <button 
                onClick={() => onDevolverAPedidos(venta)}
                className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors font-medium"
                title="Anular venta (montos en cero)"
              >
                <Ban className="w-3 h-3 inline mr-1" />
                Anular
              </button>
            )}
            
            {/* Debug: Mostrar siempre para testing */}
            {process.env.NODE_ENV === 'development' && (
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

        {/* Vista Mobile */}
        <div className="lg:hidden">
          <VistaCompacta 
            ventas={ventasFiltradas}
            onVerDetalle={handleModalToggle}
            onAbonar={handleAbonar}
            onDevolverAPedidos={handleDevolverAPedidos}
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
    </div>
  );
}
