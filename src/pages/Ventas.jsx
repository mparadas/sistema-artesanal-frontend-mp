import React, { 
  useState, useEffect, useMemo, useCallback, useRef, memo, useReducer 
} from 'react';
import { 
  ShoppingCart, Plus, Trash2, Search, User, Package, DollarSign, 
  CheckCircle, X, Clock, Receipt, Banknote, 
  Smartphone, CreditCard, TrendingUp, FileText, AlertCircle,
  ChevronDown, ChevronUp, RefreshCw, ArrowRightLeft, Filter
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
  { codigo: 'cancelado', nombre: 'Cancelado', color: 'gray' }
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

const estaPagada = (venta) => ['pagado', 'liquidado', 'cancelado'].includes(venta?.estado_pago);

const getEstadoColor = (estado) => {
  const map = {
    pagado: 'bg-green-100 text-green-700 border-green-200',
    parcial: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    pendiente: 'bg-red-100 text-red-700 border-red-200',
    liquidado: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    cancelado: 'bg-gray-100 text-gray-700 border-gray-200'
  };
  return map[estado] || 'bg-gray-100 text-gray-700 border-gray-200';
};

const esVentaCatalogo = (venta) => {
  const notas = String(venta?.pedido_origen_notas || '').toLowerCase();
  return (
    notas.includes('autoguardado por el mismo cliente desde catálogo público') ||
    notas.includes('autoguardado por el mismo cliente desde catalogo publico')
  );
};

const getOrigenVenta = (venta) => {
  const origen = String(venta?.origen_venta || '').toLowerCase();
  if (origen === 'catalogo' || origen === 'pedido' || origen === 'directa') return origen;
  if (venta?.pedido_origen_id) return esVentaCatalogo(venta) ? 'catalogo' : 'pedido';
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

const mapApiErrorMessage = (message) => {
  const raw = String(message || '').toLowerCase();
  if (!raw) return '';

  if (raw.includes('stock') && (raw.includes('insuficiente') || raw.includes('agotado'))) {
    return 'No hay stock suficiente para completar la operación.';
  }
  if (raw.includes('venta no encontrada')) {
    return 'La venta ya no existe o fue eliminada.';
  }
  if (raw.includes('id de venta inválido') || raw.includes('id invalido') || raw.includes('id inválido')) {
    return 'La venta seleccionada es inválida.';
  }
  if (raw.includes('tasa') && (raw.includes('inválida') || raw.includes('invalida'))) {
    return 'La tasa de cambio vigente es inválida. Verifica el módulo de tasa de cambio.';
  }
  if (raw.includes('monto invalido') || raw.includes('monto inválido')) {
    return 'El monto ingresado no es válido.';
  }
  if (raw.includes('timeout') || raw.includes('network') || raw.includes('failed to fetch')) {
    return 'No se pudo conectar con el servidor. Intenta nuevamente.';
  }

  return '';
};

const getApiErrorMessage = (res, body, fallback = 'Error de servidor') => {
  const base = body?.error || body?.detalle || body?.mensaje || `${fallback} (HTTP ${res.status})`;
  return mapApiErrorMessage(base) || base;
};

const requestJson = async (url, options = {}, fallbackError = 'Error de servidor') => {
  const res = await fetch(url, options);
  const data = await parseResponseBody(res);
  if (!res.ok) {
    throw new Error(getApiErrorMessage(res, data, fallbackError));
  }
  return data;
};

/** Ordena ventas por fecha ascendente (más antigua primero) y luego por id. Devuelve copia, no muta. */
const ventasOrdenadasMasAntiguaPrimero = (lista) => {
  if (!Array.isArray(lista) || lista.length === 0) return [];
  const idNum = (item) => parseInt(String(item?.id), 10) || 0;
  const fechaTs = (item) => {
    const ts = Date.parse(item?.fecha);
    return Number.isFinite(ts) ? ts : 0;
  };
  return [...lista].sort((a, b) => {
    const f = fechaTs(a) - fechaTs(b);
    if (f !== 0) return f;
    return idNum(a) - idNum(b);
  });
};

// ==========================================
// HOOKS OPTIMIZADOS
// ==========================================

const useDebounce = (value, delay = CONFIG.DEBOUNCE_DELAY) => {
  const [debounced, setDebounced] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return debounced;
};

const useVentasData = () => {
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

  return { ...state, refresh };
};

const useFormVenta = (tasaInicial = CONFIG.TASA_DEFAULT) => {
  const initialState = useMemo(() => ({
    cliente: null,
    busquedaCliente: '',
    mostrarDropdown: false,
    items: [],
    moneda: 'USD',
    tasaCambio: tasaInicial,
    tasaSistema: tasaInicial,
    metodoPago: 'efectivo',
    referenciaPago: '',
    tipoVenta: 'inmediato',
    fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    busquedaProducto: '',
    mostrarProductos: false
  }), [tasaInicial]);

  const [form, setForm] = useState(initialState);

  const calcularTotal = useMemo(() => 
    form.items.reduce((sum, item) => sum + toNumber(item.total_linea), 0)
  , [form.items]);

  const agregarItem = useCallback((producto) => {
    if (!producto?.id) return;
    
    const precioBase = toNumber(producto?.precio);
    const precio = form.moneda === 'USD' ? precioBase : precioBase * form.tasaCambio;
    
    setForm(prev => {
      const idx = prev.items.findIndex(i => i.producto_id === producto.id);
      if (idx >= 0) {
        const items = [...prev.items];
        const newQty = Math.min(items[idx].cantidad + 0.500, items[idx].stock_original || Infinity);
        items[idx] = { 
          ...items[idx], 
          cantidad: newQty, 
          total_linea: newQty * items[idx].precio_unitario 
        };
        return { ...prev, items, busquedaProducto: '' };
      }
      return {
        ...prev,
        items: [...prev.items, {
          producto_id: producto.id,
          nombre: producto.nombre || 'Producto sin nombre',
          cantidad: 0.500,
          precio_unitario: precio,
          total_linea: precio * 0.500,
          stock_original: toNumber(producto.stock)
        }],
        busquedaProducto: ''
      };
    });
  }, [form.moneda, form.tasaCambio]);

  const actualizarCantidad = useCallback((index, cantidad) => {
    const cant = Math.max(0.001, parseFloat(cantidad) || 0.001);
    setForm(prev => {
      const items = [...prev.items];
      if (!items[index]) return prev;
      
      const item = items[index];
      const newQty = Math.min(cant, item.stock_original || Infinity);
      
      items[index] = { 
        ...item, 
        cantidad: newQty, 
        total_linea: newQty * item.precio_unitario 
      };
      return { ...prev, items };
    });
  }, []);

  const eliminarItem = useCallback((index) => {
    setForm(prev => ({ 
      ...prev, 
      items: prev.items.filter((_, i) => i !== index) 
    }));
  }, []);

  const cambiarMoneda = useCallback((nuevaMoneda) => {
    if (nuevaMoneda === form.moneda) return;
    const factor = nuevaMoneda === 'USD' ? (1 / form.tasaCambio) : form.tasaCambio;
    setForm(prev => ({
      ...prev,
      moneda: nuevaMoneda,
      items: prev.items.map(i => ({
        ...i,
        precio_unitario: i.precio_unitario * factor,
        total_linea: i.total_linea * factor
      }))
    }));
  }, [form.moneda, form.tasaCambio]);

  const resetForm = useCallback(() => {
    setForm(prev => ({ ...initialState, tasaSistema: prev.tasaSistema }));
  }, [initialState]);

  const setCliente = useCallback((cliente) => {
    setForm(prev => ({ 
      ...prev, 
      cliente, 
      busquedaCliente: '', 
      mostrarDropdown: false 
    }));
  }, []);

  const setField = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  return { 
    form, 
    setField, 
    agregarItem, 
    actualizarCantidad, 
    eliminarItem, 
    cambiarMoneda, 
    calcularTotal, 
    resetForm, 
    setCliente 
  };
};

// ==========================================
// COMPONENTES UI ATÓMICOS
// ==========================================

const Button = memo(({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  disabled = false, 
  className = '', 
  type = 'button',
  title,
  ...props 
}) => {
  const variants = {
    primary: 'bg-orange-600 hover:bg-orange-700 text-white shadow-sm',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    success: 'bg-green-600 hover:bg-green-700 text-white shadow-sm',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    purple: 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm',
    blue: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
    outline: 'border-2 border-gray-300 hover:border-gray-400 text-gray-700 bg-white'
  };
  const sizes = {
    sm: 'px-3 py-2 text-sm min-h-10',
    md: 'px-4 py-2.5 text-sm sm:text-base min-h-11',
    lg: 'px-6 py-3 text-lg min-h-12'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      className={`${variants[variant]} ${sizes[size]} rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95 ${className}`}
      {...props}
    >
      {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
});

const Badge = memo(({ children, variant = 'default' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700 border-gray-200',
    success: 'bg-green-100 text-green-700 border-green-200',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    danger: 'bg-red-100 text-red-700 border-red-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200'
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${variants[variant]}`}>
      {children}
    </span>
  );
});

const Alert = memo(({ type = 'info', message, onClose }) => {
  if (!message) return null;
  
  const styles = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200'
  };
  
  const icons = {
    success: '✅',
    error: '⚠️',
    info: 'ℹ️'
  };

  return (
    <div className={`p-4 rounded-lg border flex justify-between items-center shadow-sm ${styles[type]}`}>
      <div className="flex items-center gap-2">
        <span className="text-lg">{icons[type]}</span>
        <span className="font-medium">{message}</span>
      </div>
      {onClose && (
        <button 
          onClick={onClose} 
          className="p-1 hover:bg-black/5 rounded-full transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
});

const MonedaSelector = memo(({ moneda, onChange }) => (
  <div className="grid grid-cols-2 gap-2">
    {['USD', 'VES'].map((m) => (
      <button
        key={m}
        type="button"
        onClick={() => onChange(m)}
        className={`py-2 px-4 rounded-lg border-2 font-medium transition-all duration-200 ${
          moneda === m 
            ? m === 'USD' 
              ? 'bg-green-600 text-white border-green-600 shadow-md' 
              : 'bg-blue-600 text-white border-blue-600 shadow-md'
            : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
        }`}
      >
        {m === 'USD' ? '$ USD' : 'Bs VES'}
      </button>
    ))}
  </div>
));

const MetodoPagoSelector = memo(({ metodo, onChange }) => (
  <div className="grid grid-cols-3 gap-2">
    {METODOS_PAGO.map(({ value, label, icon: Icon, color }) => (
      <button
        key={value}
        type="button"
        onClick={() => onChange(value)}
        className={`py-3 px-2 rounded-lg border-2 flex flex-col items-center gap-1 transition-all duration-200 ${
          metodo === value 
            ? `${color} ring-2 ring-offset-1 border-transparent shadow-md scale-105` 
            : 'bg-white border-gray-200 hover:border-gray-300 text-gray-600'
        }`}
      >
        <Icon className="w-5 h-5" />
        <span className="text-xs font-medium">{label}</span>
      </button>
    ))}
  </div>
));

// ==========================================
// COMPONENTES ESPECÍFICOS
// ==========================================

const VentaCard = memo(({ venta, onVerDetalle, onAbonar, getEstadoTexto }) => {
  if (!venta) return null;
  const origenCfg = getOrigenConfig(venta);
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      {/* Header con información principal */}
      <div className="flex justify-between items-start mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-lg text-gray-900">#{venta.id || 'N/A'}</span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {formatDate(venta.fecha)}
            </span>
          </div>
          <p className="text-sm text-gray-700 font-medium truncate">
            {venta.cliente_nombre || 'Cliente general'}
          </p>
        </div>
        <div className="text-right ml-3">
          <p className="font-bold text-xl text-gray-900">
            {formatearMonto(venta.total, venta.moneda_original)}
          </p>
          <span className={`text-xs px-2 py-1 rounded-full font-medium border ${getEstadoColor(venta.estado_pago)}`}>
            {getEstadoTexto(venta)}
          </span>
        </div>
      </div>
      
      {/* Badges de tipo y origen */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Badge variant={venta.tipo_venta === 'credito' ? 'warning' : 'success'}>
          {venta.tipo_venta === 'credito' ? 'Crédito' : 'Inmediato'}
        </Badge>
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${origenCfg.className}`}>
          {origenCfg.label}
        </span>
        {venta.tipo_venta === 'credito' && toNumber(venta.saldo_pendiente) > 0 && (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
            Debe: {formatearMonto(venta.saldo_pendiente, venta.moneda_original)}
          </span>
        )}
      </div>

      {/* Botones de acción optimizados para móvil */}
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onVerDetalle(venta)} 
          className="flex-1 min-h-10 text-sm font-medium"
        >
          <FileText className="w-4 h-4 mr-2 flex-shrink-0" /> 
          <span className="truncate">Ver Detalle</span>
        </Button>
        {!estaPagada(venta) && (
          <Button 
            variant={venta.tipo_venta === 'credito' ? 'primary' : 'success'} 
            size="sm" 
            onClick={() => onAbonar(venta)} 
            className="flex-1 min-h-10 text-sm font-medium"
          >
            <DollarSign className="w-4 h-4 mr-2 flex-shrink-0" /> 
            <span className="truncate">{venta.tipo_venta === 'credito' ? 'Abonar' : 'Pagar'}</span>
          </Button>
        )}
      </div>
    </div>
  );
});

const ModalContent = memo(({ title, description, children, footer, onClose }) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 gap-3">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800">{title}</h3>
            {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </div>
        
        {footer && (
          <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
});

const Modal = memo(({ isOpen, onClose, title, children, size = 'md', footer = null, description = null }) => {
  const sizes = { 
    sm: 'max-w-md', 
    md: 'max-w-3xl', 
    lg: 'max-w-4xl', 
    full: 'max-w-full mx-4' 
  };
  
  if (!isOpen) return null;

  return (
    <ModalContent 
      title={title} 
      description={description} 
      footer={footer} 
      onClose={onClose}
    >
      <div className={sizes[size]}>
        {children}
      </div>
    </ModalContent>
  );
});

const VentasTable = memo(({ ventas, onVerDetalle, onAbonar, getEstadoTexto }) => {
  if (!Array.isArray(ventas) || ventas.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay ventas para mostrar
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-semibold">
          <tr>
            <th className="px-4 py-3">#ID</th>
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">Fecha</th>
            <th className="px-4 py-3 text-center">Origen</th>
            <th className="px-4 py-3 text-center">Tipo</th>
            <th className="px-4 py-3 text-right">Total</th>
            <th className="px-4 py-3 text-right">Saldo</th>
            <th className="px-4 py-3 text-center">Estado</th>
            <th className="px-4 py-3 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {ventas.map((v) => (
            <tr key={v?.id || Math.random()} className="hover:bg-orange-50/30 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-900">#{v?.id || 'N/A'}</td>
              <td className="px-4 py-3 text-gray-700">
                {v?.cliente_nombre_completo || v?.cliente_nombre || 'Cliente general'}
              </td>
              <td className="px-4 py-3 text-gray-500">{formatDate(v?.fecha)}</td>
              <td className="px-4 py-3 text-center">
                {(() => {
                  const origenCfg = getOrigenConfig(v);
                  return (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${origenCfg.className}`}>
                      {origenCfg.label}
                    </span>
                  );
                })()}
              </td>
              <td className="px-4 py-3 text-center">
                <Badge variant={v?.tipo_venta === 'credito' ? 'warning' : 'success'}>
                  {v?.tipo_venta === 'credito' ? 'Crédito' : 'Inmediato'}
                </Badge>
              </td>
              <td className="px-4 py-3 text-right font-medium text-gray-900">
                {formatearMonto(v?.total, v?.moneda_original)}
              </td>
              <td className="px-4 py-3 text-right">
                {v?.tipo_venta === 'credito' && toNumber(v?.saldo_pendiente) > 0 ? (
                  <span className="text-red-600 font-semibold">
                    {formatearMonto(v.saldo_pendiente, v.moneda_original)}
                  </span>
                ) : (
                  <span className="text-green-600 font-medium">$0.00</span>
                )}
              </td>
              <td className="px-4 py-3 text-center">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getEstadoColor(v?.estado_pago)}`}>
                  {getEstadoTexto(v)}
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                <div className="flex justify-center gap-1">
                  <button 
                    onClick={() => v && onVerDetalle(v)} 
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Ver detalle"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  {v && !estaPagada(v) && (
                    <button 
                      onClick={() => onAbonar(v)} 
                      className={`p-1.5 rounded-lg transition-colors ${
                        v.tipo_venta === 'credito' ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'
                      }`}
                      title={v.tipo_venta === 'credito' ? 'Abonar' : 'Pagar'}
                    >
                      <DollarSign className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

const ModalNuevaVenta = memo(({ visible, onClose, form, setField, data, onSubmit, loading, agregarItem, actualizarCantidad, eliminarItem, cambiarMoneda, calcularTotal, setCliente }) => {
  const debouncedCliente = useDebounce(form.busquedaCliente);
  const debouncedProducto = useDebounce(form.busquedaProducto);

  const clientesFiltrados = useMemo(() => {
    if (!debouncedCliente || !Array.isArray(data?.clientes)) return [];
    return data.clientes.filter(c => 
      c?.nombre?.toLowerCase().includes(debouncedCliente.toLowerCase())
    ).slice(0, 10);
  }, [data?.clientes, debouncedCliente]);

  const productosFiltrados = useMemo(() => {
    if (!form.mostrarProductos || !Array.isArray(data?.productos)) return [];
    return data.productos.filter(p => 
      !debouncedProducto || p?.nombre?.toLowerCase().includes(debouncedProducto.toLowerCase())
    );
  }, [data?.productos, debouncedProducto, form.mostrarProductos]);

  const isValid = useMemo(() => {
    if (!form.items?.length) return false;
    if (form.tipoVenta === 'inmediato' && ['transferencia', 'pago_movil'].includes(form.metodoPago) && !form.referenciaPago?.trim()) return false;
    if (form.tipoVenta === 'credito' && !form.fechaVencimiento) return false;
    return true;
  }, [form]);

  const footer = (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 w-full">
      {form.items?.length > 0 && (
        <div className="text-center sm:text-left">
          <p className="text-sm text-gray-500">Total a pagar</p>
          <p className="text-3xl font-bold text-gray-900">{formatearMonto(calcularTotal, form.moneda)}</p>
        </div>
      )}
      <div className="flex gap-3 w-full sm:w-auto">
        <Button variant="secondary" onClick={onClose} className="flex-1 sm:flex-none">
          Cancelar
        </Button>
        <Button 
          variant="success" 
          onClick={onSubmit} 
          loading={loading} 
          disabled={!isValid}
          className="flex-1 sm:flex-none"
        >
          Finalizar Venta
        </Button>
      </div>
    </div>
  );

  return (
    <Modal 
      isOpen={visible} 
      onClose={onClose} 
      title="Nueva Venta" 
      description="Complete los datos para registrar una nueva venta"
      size="md" 
      footer={footer}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Cliente <span className="text-red-500">*</span>
            </label>
            {!form.cliente ? (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={form.busquedaCliente}
                  onChange={(e) => setField('busquedaCliente', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  autoComplete="off"
                />
                {debouncedCliente && clientesFiltrados.length > 0 && (
                  <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-xl max-h-52 overflow-auto">
                    {clientesFiltrados.map(c => (
                      <button 
                        key={c?.id || Math.random()} 
                        type="button" 
                        onClick={() => c && setCliente(c)} 
                        className="w-full text-left px-4 py-3 hover:bg-orange-50 border-b last:border-0 transition-colors"
                      >
                        <p className="font-medium text-sm text-gray-900">{c?.nombre || 'Sin nombre'}</p>
                        {c?.telefono && <p className="text-xs text-gray-500">{c.telefono}</p>}
                      </button>
                    ))}
                  </div>
                )}
                {debouncedCliente && clientesFiltrados.length === 0 && (
                  <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg p-3 text-sm text-gray-500">
                    No se encontraron clientes
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between bg-orange-50 border border-orange-200 p-3 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center mr-3">
                    <User className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{form.cliente.nombre}</p>
                    <p className="text-sm text-gray-500">{form.cliente.telefono || 'Sin teléfono'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setField('cliente', null)} 
                  className="p-1.5 hover:bg-orange-200 rounded-full transition-colors"
                  aria-label="Quitar cliente"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            )}
          </div>
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Moneda</label>
            <MonedaSelector moneda={form.moneda} onChange={cambiarMoneda} />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Productos</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar y agregar producto..."
              value={form.busquedaProducto}
              onChange={(e) => { 
                setField('busquedaProducto', e.target.value); 
                setField('mostrarProductos', true); 
              }}
              className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
            />
          </div>
          
          {form.mostrarProductos && productosFiltrados.length > 0 && (
            <div className="border border-gray-200 rounded-lg mt-2 max-h-48 overflow-auto bg-white shadow-lg">
              {productosFiltrados.map(p => {
                if (!p) return null;
                const stock = toNumber(p.stock) > 0;
                const precio = form.moneda === 'USD' ? toNumber(p.precio) : toNumber(p.precio) * form.tasaCambio;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => stock && agregarItem(p)}
                    disabled={!stock}
                    className={`w-full text-left px-4 py-3 border-b last:border-0 flex justify-between items-center transition-colors ${
                      stock ? 'hover:bg-orange-50' : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-sm text-gray-900">{p.nombre}</p>
                      <p className="text-xs text-gray-500">Stock: {toNumber(p.stock).toFixed(3)} kg</p>
                    </div>
                    <span className="text-orange-600 font-bold">{formatearMonto(precio, form.moneda)}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {form.items?.length > 0 && (
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Producto</th>
                  <th className="px-4 py-3 text-center w-28">Peso (kg)</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-center w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {form.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{item?.nombre || 'Producto'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => actualizarCantidad(idx, (item?.cantidad || 0.500) - 0.100)}
                          disabled={(item?.cantidad || 0.500) <= 0.100}
                          className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-50 text-gray-600"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0.001"
                          step="0.001"
                          max={item?.stock_original || 999}
                          value={item?.cantidad || 0.500}
                          onChange={(e) => actualizarCantidad(idx, e.target.value)}
                          className="w-20 border border-gray-300 rounded px-2 py-1 text-center focus:ring-2 focus:ring-orange-500 outline-none"
                          placeholder="0.000"
                        />
                        <button 
                          onClick={() => actualizarCantidad(idx, (item?.cantidad || 0.500) + 0.100)}
                          disabled={(item?.cantidad || 0.500) >= (item?.stock_original || 999)}
                          className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-50 text-gray-600"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatearMonto(item?.total_linea, form.moneda)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={() => eliminarItem(idx)}
                        className="p-1.5 hover:bg-red-50 rounded-full text-red-600 transition-colors"
                        aria-label="Eliminar item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-4">
          <label className="block text-sm font-medium text-gray-700">Tipo de Venta</label>
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant={form.tipoVenta === 'inmediato' ? 'success' : 'outline'}
              onClick={() => setField('tipoVenta', 'inmediato')}
              className="w-full py-3"
            >
              <CheckCircle className="w-5 h-5 mr-2" /> Inmediato
            </Button>
            <Button
              type="button"
              variant={form.tipoVenta === 'credito' ? 'primary' : 'outline'}
              onClick={() => setField('tipoVenta', 'credito')}
              className="w-full py-3"
            >
              <Clock className="w-5 h-5 mr-2" /> Crédito
            </Button>
          </div>

          {form.tipoVenta === 'inmediato' ? (
            <div className="space-y-3">
              <MetodoPagoSelector metodo={form.metodoPago} onChange={(m) => setField('metodoPago', m)} />
              {['transferencia', 'pago_movil'].includes(form.metodoPago) && (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Número de Referencia <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.referenciaPago}
                    onChange={(e) => setField('referenciaPago', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="Ingrese el número de referencia"
                    required
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Fecha de Vencimiento <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.fechaVencimiento}
                onChange={(e) => setField('fechaVencimiento', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
});

const StatCard = memo(({ label, value, color }) => {
  const colors = {
    blue: 'bg-blue-50 border-blue-100 text-blue-600 text-blue-800',
    green: 'bg-green-50 border-green-100 text-green-600 text-green-800',
    red: 'bg-red-50 border-red-100 text-red-600 text-red-800',
    purple: 'bg-purple-50 border-purple-100 text-purple-600 text-purple-800'
  };
  
  const [bg, border, textLabel, textValue] = colors[color]?.split(' ') || colors.blue.split(' ');
  
  return (
    <div className={`${bg} ${border} p-3 sm:p-5 rounded-xl border`}>
      <p className={`text-xs sm:text-sm ${textLabel} font-medium mb-1`}>{label}</p>
      <p className={`text-xl sm:text-2xl font-bold ${textValue}`}>{value}</p>
    </div>
  );
});

const ModalEstadoCuenta = memo(({ isOpen, onClose, stats, datosClientes, tipoEstadoCuenta, onChangeTipo, expandedClients, onToggleExpand, onAbonarCliente, onAbonarVenta, onEnviarEmailCliente }) => {
  const clientesSafe = Array.isArray(datosClientes) ? datosClientes : [];
  const expandedSafe = expandedClients instanceof Set ? expandedClients : new Set();
  const enviosActivos = false;
  const resumenGeneral = useMemo(() => {
    const topPendientes = clientesSafe
      .filter((c) => (c?.totalPendiente || 0) > 0)
      .sort((a, b) => (b?.totalPendiente || 0) - (a?.totalPendiente || 0))
      .slice(0, 10);
    const lineasTop = topPendientes.length > 0
      ? topPendientes.map((c, i) => `${i + 1}. ${c?.nombre || 'Sin nombre'}: ${formatearMonto(c?.totalPendiente)}`).join('\n')
      : 'Sin deudas pendientes';
    return [
      'Estado de Cuenta General',
      `Total Ventas: ${formatearMonto(stats?.totalVentas)}`,
      `Total Pagado: ${formatearMonto(stats?.totalPagado)}`,
      `Total Pendiente: ${formatearMonto(stats?.totalPendiente)}`,
      `% Pagado: ${(stats?.porcentajePagado || 0).toFixed(1)}%`,
      '',
      'Top deudores:',
      lineasTop
    ].join('\n');
  }, [clientesSafe, stats]);

  const enviarWhatsAppGeneral = useCallback(() => {
    const texto = encodeURIComponent(resumenGeneral);
    window.open(`https://wa.me/?text=${texto}`, '_blank', 'noopener,noreferrer');
  }, [resumenGeneral]);

  const enviarEmailGeneral = useCallback(() => {
    fetch(`${API_URL}/estado-cuenta/enviar-general-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
      .then(async (res) => {
        const data = await parseResponseBody(res);
        if (!res.ok) throw new Error(getApiErrorMessage(res, data, 'No se pudo enviar el correo general'));
        alert(data?.mensaje || 'Correos enviados correctamente');
      })
      .catch((err) => {
        alert(`Error enviando correo general: ${err.message}`);
      });
  }, []);
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Estado de Cuenta</h3>
            <p className="text-sm text-gray-500 mt-1">Resumen financiero y gestión de clientes</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-fit">
                <Button 
                  size="sm" 
                  variant={tipoEstadoCuenta === 'general' ? 'primary' : 'secondary'} 
                  onClick={() => onChangeTipo('general')}
                  className="px-4"
                >
                  General
                </Button>
                <Button 
                  size="sm" 
                  variant={tipoEstadoCuenta === 'clientes' ? 'primary' : 'secondary'} 
                  onClick={() => onChangeTipo('clientes')}
                  className="px-4"
                >
                  Por Clientes
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="success"
                  size="sm"
                  onClick={enviarWhatsAppGeneral}
                  disabled={!enviosActivos}
                  title={enviosActivos ? 'Enviar estado general por WhatsApp' : 'En configuración'}
                >
                  <Smartphone className="w-4 h-4 mr-1" />
                  Enviar General por WhatsApp
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={enviarEmailGeneral}
                  disabled={!enviosActivos}
                  title={enviosActivos ? 'Enviar estado general por correo' : 'En configuración'}
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Enviar General por Email
                </Button>
              </div>
            </div>

            {tipoEstadoCuenta === 'general' ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Total Ventas" value={formatearMonto(stats?.totalVentas)} color="blue" />
                  <StatCard label="Total Pagado" value={formatearMonto(stats?.totalPagado)} color="green" />
                  <StatCard label="Total Pendiente" value={formatearMonto(stats?.totalPendiente)} color="red" />
                  <StatCard label="% Pagado" value={`${(stats?.porcentajePagado || 0).toFixed(1)}%`} color="purple" />
                </div>

                <div className="border border-gray-200 rounded-xl p-3 sm:p-5">
                  <h4 className="font-bold text-red-700 flex items-center mb-3 sm:mb-4 text-base sm:text-lg">
                    <AlertCircle className="w-5 h-5 mr-2" />Top Deudores
                  </h4>
                  <div className="space-y-2">
                    {clientesSafe.filter(c => (c?.totalPendiente || 0) > 0).slice(0, 5).map((cliente, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 sm:p-4 bg-red-50 rounded-lg border border-red-100">
                        <div>
                          <span className="font-medium text-sm sm:text-base text-gray-800 block">{cliente?.nombre || 'Sin nombre'}</span>
                          <span className="text-xs text-gray-500">{(cliente?.ventas || []).length} ventas</span>
                        </div>
                        <span className="text-red-600 font-bold text-base sm:text-lg">
                          {formatearMonto(cliente?.totalPendiente)}
                        </span>
                      </div>
                    ))}
                    {clientesSafe.filter(c => (c?.totalPendiente || 0) > 0).length === 0 && (
                      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                        <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                        <p>No hay deudas pendientes 🎉</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {clientesSafe.map((cliente, idx) => {
                  if (!cliente) return null;
                  
                  const isExpanded = expandedSafe.has(idx);
                  const ventasCliente = Array.isArray(cliente.ventas) ? cliente.ventas : [];
                  const ventasPendientes = ventasOrdenadasMasAntiguaPrimero(
                    ventasCliente.filter((v) => toNumber(v?.saldo_pendiente) > 0)
                  );
                  const totalVentas = cliente.totalVentas || 0;
                  const totalPagado = cliente.totalPagado || 0;
                  const porcentajePagado = totalVentas > 0 ? (totalPagado / totalVentas) * 100 : 0;
                  
                  return (
                    <div key={`cliente-${idx}`} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                      <button 
                        onClick={() => onToggleExpand(idx)} 
                        className="w-full p-3 sm:p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                      >
                            {!cliente?.email && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                                Sin correo
                              </span>
                            )}
                        <div className="min-w-0 flex-1 w-full">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm sm:text-base text-gray-800 truncate">{cliente.nombre || 'Sin nombre'}</h4>
                            {cliente.totalPendiente > 0 && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                                {ventasPendientes.length} pendientes
                              </span>
                            )}
                          </div>
                          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-red-500 to-green-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${Math.max(0, Math.min(100, porcentajePagado))}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto sm:ml-4">
                          <div className="text-left sm:text-right">
                            <p className="font-bold text-sm sm:text-base text-gray-900">{formatearMonto(totalVentas)}</p>
                            {cliente.totalPendiente > 0 && (
                              <p className="text-xs sm:text-sm text-red-600 font-semibold">
                                Debe: {formatearMonto(cliente.totalPendiente)}
                              </p>
                            )}
                          </div>
                          {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                        </div>
                      </button>
                      
                      {isExpanded && (
                        <div className="border-t border-gray-100 p-3 sm:p-4 bg-gray-50/50">
                          {ventasPendientes.length > 0 ? (
                            <div className="space-y-2">
                              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                El pago se aplica desde la venta más antigua
                              </p>
                              {ventasPendientes.map((v, vIdx) => (
                                <div key={v?.id || `venta-${vIdx}`} className="bg-white p-3 rounded-lg border border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center shadow-sm gap-3">
                                  <div className="flex items-start sm:items-center gap-2 min-w-0 w-full">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                      vIdx === 0 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'
                                    }`}>
                                      {vIdx + 1}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                        <span className="font-medium text-gray-800">#{v?.id || 'N/A'}</span>
                                        <span className="text-xs text-gray-500">{formatDate(v?.fecha)}</span>
                                        {(() => {
                                          const origenCfg = getOrigenConfig(v);
                                          return (
                                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium border ${origenCfg.className}`}>
                                              {origenCfg.label}
                                            </span>
                                          );
                                        })()}
                                        {vIdx === 0 && (
                                          <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-medium">Más antigua</span>
                                        )}
                                      </div>
                                      <p className="text-xs text-gray-500 mt-0.5">
                                        Total: {formatearMonto(v?.total, v?.moneda_original)}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto flex-shrink-0">
                                    <div className="text-left sm:text-right">
                                      <p className="text-sm font-bold text-red-600">
                                        {formatearMonto(v?.saldo_pendiente, v?.moneda_original)}
                                      </p>
                                      <Badge variant={v?.estado_pago === 'parcial' ? 'warning' : 'danger'}>
                                        {v?.estado_pago === 'parcial' ? 'Parcial' : 'Pendiente'}
                                      </Badge>
                                    </div>
                                    <button
                                      onClick={() => typeof onAbonarVenta === 'function' && onAbonarVenta(v)}
                                      className="p-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 transition-colors"
                                      title="Registrar abono (se aplicará desde la venta más antigua)"
                                    >
                                      <DollarSign className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                  if (cliente && typeof onAbonarCliente === 'function') {
                                    onAbonarCliente(cliente);
                                  }
                                }}
                                className="w-full mt-3"
                              >
                                <DollarSign className="w-4 h-4 mr-2" /> Registrar Abono General
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  if (cliente?.cliente_id && typeof onEnviarEmailCliente === 'function') {
                                    onEnviarEmailCliente(cliente.cliente_id);
                                  }
                                }}
                                disabled={!enviosActivos || !cliente?.email}
                                title={
                                  !enviosActivos
                                    ? 'En configuración'
                                    : (cliente?.email ? `Enviar a ${cliente.email}` : 'Cliente sin correo registrado')
                                }
                                className="w-full"
                              >
                                <FileText className="w-4 h-4 mr-2" /> Enviar Estado por Email (Cliente)
                              </Button>
                            </div>
                          ) : (
                            <div className="text-center py-6 text-green-600 flex items-center justify-center gap-2 bg-green-50 rounded-lg">
                              <CheckCircle className="w-5 h-5" />
                              <span className="font-medium">Cliente al día</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

const ModalAbono = memo(({ isOpen, onClose, venta, tasaSistema, onConfirm, loading }) => {
  const [formAbono, setFormAbono] = useState({
    monto: '',
    metodoPago: 'efectivo',
    referenciaPago: '',
    moneda: 'USD'
  });

  useEffect(() => {
    if (isOpen && venta) {
      setFormAbono({
        monto: '',
        metodoPago: 'efectivo',
        referenciaPago: '',
        moneda: venta?.moneda_original || 'USD'
      });
    }
  }, [isOpen, venta]);

  const montoNum = toNumber(formAbono.monto);
  
  const montoConvertido = useMemo(() => {
    if (!montoNum || !tasaSistema || tasaSistema <= 0 || !venta) return montoNum;
    if (formAbono.moneda === 'VES' && venta.moneda_original === 'USD') {
      return montoNum / tasaSistema;
    } else if (formAbono.moneda === 'USD' && venta.moneda_original === 'VES') {
      return montoNum * tasaSistema;
    }
    return montoNum;
  }, [montoNum, formAbono.moneda, venta?.moneda_original, tasaSistema]);

  const esAbonoGeneral = useMemo(() => {
    return Array.isArray(venta?._ventasPendientes) && venta._ventasPendientes.length > 0;
  }, [venta?._ventasPendientes]);

  const isValid = useMemo(() => {
    if (montoNum <= 0) return false;
    if (formAbono.metodoPago !== 'efectivo' && !formAbono.referenciaPago?.trim()) return false;
    return true;
  }, [montoNum, formAbono.metodoPago, formAbono.referenciaPago]);

  const handleSubmit = useCallback(() => {
    if (!isValid || !venta) return;
    onConfirm({ 
      ...formAbono, 
      monto: montoNum,
      montoConvertido: montoConvertido || montoNum
    });
  }, [isValid, venta, formAbono, montoNum, montoConvertido, onConfirm]);

  if (!isOpen || !venta) return null;

  const saldoPendiente = toNumber(venta?.saldo_pendiente);
  const clienteNombre = venta?.cliente_nombre || 'Cliente';
  const monedaOriginal = venta?.moneda_original || 'USD';

  return (
    <Modal 
      isOpen={true}
      onClose={onClose} 
      title={esAbonoGeneral ? "Abono General" : "Registrar Abono"}
      description={`Cliente: ${clienteNombre}`}
      size="sm"
      footer={
        <div className="flex gap-3 w-full">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit} 
            loading={loading} 
            disabled={!isValid}
            className="flex-1"
          >
            Confirmar Abono
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
          <p className="text-sm text-orange-700 font-medium mb-1">
            {esAbonoGeneral ? 'Total pendiente del cliente' : 'Saldo pendiente'}
          </p>
          <p className="text-3xl font-bold text-orange-800">
            {formatearMonto(saldoPendiente, monedaOriginal)}
          </p>
          {esAbonoGeneral && (
            <div className="mt-2 space-y-1">
              <p className="text-xs text-orange-600 font-medium">
                Se aplicará en orden, desde la venta más antigua:
              </p>
              {venta._ventasPendientes.slice(0, 4).map((v, idx) => (
                <div key={v.id || idx} className="flex justify-between text-xs text-orange-700">
                  <span>#{v.id} · {formatDate(v.fecha)}</span>
                  <span className="font-semibold">{formatearMonto(v.saldo_pendiente, v.moneda_original || monedaOriginal)}</span>
                </div>
              ))}
              {venta._ventasPendientes.length > 4 && (
                <p className="text-xs text-orange-500">…y {venta._ventasPendientes.length - 4} más</p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Moneda del Abono</label>
          <MonedaSelector 
            moneda={formAbono.moneda} 
            onChange={(moneda) => setFormAbono(prev => ({ ...prev, moneda }))} 
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Monto</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
              {formAbono.moneda === 'USD' ? '$' : 'Bs'}
            </span>
            <input
              type="number"
              value={formAbono.monto}
              onChange={(e) => setFormAbono(prev => ({ ...prev, monto: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2.5 focus:ring-2 focus:ring-orange-500 outline-none font-medium text-lg"
              placeholder="0.00"
              min="0.01"
              step="0.01"
            />
          </div>
          
          {montoConvertido && montoConvertido !== montoNum && (
            <p className="text-sm text-gray-600 mt-1">
              Equivalente a: <span className="font-semibold text-gray-900">
                {formatearMonto(montoConvertido, monedaOriginal)}
              </span>
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Método de Pago</label>
          <MetodoPagoSelector 
            metodo={formAbono.metodoPago} 
            onChange={(metodo) => setFormAbono(prev => ({ ...prev, metodoPago: metodo }))} 
          />
        </div>

        {formAbono.metodoPago !== 'efectivo' && (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Número de Referencia <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formAbono.referenciaPago}
              onChange={(e) => setFormAbono(prev => ({ ...prev, referenciaPago: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
              placeholder="Ingrese la referencia"
            />
          </div>
        )}
      </div>
    </Modal>
  );
});

// ==========================================
// MODAL DETALLE VENTA
// ==========================================

const ModalDetalle = memo(({ venta, onClose, onAbonar }) => {
  if (!venta) return null;

  const items = Array.isArray(venta.items) ? venta.items : [];
  const pagos = Array.isArray(venta.pagos) ? venta.pagos : [];
  const moneda = venta.moneda_original || 'USD';
  const totalPagado = pagos.reduce((sum, p) => sum + toNumber(p.monto_original || p.monto), 0);
  const saldo = toNumber(venta.saldo_pendiente);
  const esPagada = estaPagada(venta);

  const diasDesdeCarga = venta.fecha
    ? Math.floor((Date.now() - new Date(venta.fecha).getTime()) / (1000 * 60 * 60 * 24))
    : 999;
  const puedeEditar = diasDesdeCarga <= 5;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-hidden flex flex-col">

        {/* Header optimizado para móvil */}
        <div className="p-3 sm:p-5 border-b border-gray-100 flex flex-col gap-2 sm:gap-3 bg-gray-50/50 relative">
          {/* Botón de cerrar en la esquina superior derecha */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 sm:p-2 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0 z-10"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
          </button>
          
          <div className="flex-1 min-w-0 pr-10 sm:pr-12">
            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
              <h3 className="text-sm sm:text-xl font-bold text-gray-800 truncate">
                Detalle de la Venta #{venta.id}
              </h3>
              <Badge variant={venta.tipo_venta === 'credito' ? 'warning' : 'success'} className="text-xs">
                {venta.tipo_venta === 'credito' ? 'Crédito' : 'Inmediato'}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
              <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium border ${getEstadoColor(venta.estado_pago)}`}>
                {esPagada
                  ? (venta.tipo_venta === 'credito' ? '✓ Liquidado' : '✓ Pagado')
                  : venta.estado_pago === 'parcial' ? '◑ Parcial' : '● Pendiente'}
              </span>
              {puedeEditar && (
                <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs bg-blue-100 text-blue-600 font-medium">
                  editable
                </span>
              )}
            </div>
            <p className="text-sm sm:text-lg font-bold text-gray-800 line-clamp-2">
              {venta.cliente_nombre_completo || venta.cliente_nombre || 'Cliente general'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">
              {formatDate(venta.fecha)}
            </p>
          </div>
        </div>

        {/* Contenido scrolleable optimizado */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 sm:space-y-5">

          {/* Resumen financiero - Grid responsivo */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
            <div className="bg-blue-50 border border-blue-100 rounded-lg sm:rounded-xl p-1.5 sm:p-4 text-center">
              <p className="text-xs text-blue-600 font-medium mb-0.5 sm:mb-1">Total</p>
              <p className="text-xs sm:text-xl font-bold text-blue-800">{formatearMonto(venta.total, moneda)}</p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-lg sm:rounded-xl p-1.5 sm:p-4 text-center">
              <p className="text-xs text-green-600 font-medium mb-0.5 sm:mb-1">Pagado</p>
              <p className="text-xs sm:text-xl font-bold text-green-800">{formatearMonto(totalPagado, moneda)}</p>
            </div>
            <div className={`border rounded-lg sm:rounded-xl p-1.5 sm:p-4 text-center ${saldo > 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
              <p className={`text-xs font-medium mb-0.5 sm:mb-1 ${saldo > 0 ? 'text-red-600' : 'text-gray-500'}`}>Saldo</p>
              <p className={`text-xs sm:text-xl font-bold ${saldo > 0 ? 'text-red-800' : 'text-gray-500'}`}>
                {saldo > 0 ? formatearMonto(saldo, moneda) : '$0.00'}
              </p>
            </div>
          </div>

          {/* Marcador de Abonos */}
          {pagos.length > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg sm:rounded-xl p-2 sm:p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs sm:text-sm font-bold">{pagos.length}</span>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-green-800">
                      {pagos.length === 1 ? '1 Abono' : `${pagos.length} Abonos`}
                    </p>
                    <p className="text-xs text-green-600">
                      Total abonado: {formatearMonto(totalPagado, moneda)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Último:</p>
                  <p className="text-xs font-medium text-gray-700">
                    {pagos.length > 0 ? formatDate(pagos[pagos.length - 1].fecha) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tabla de productos - Optimizada para móvil */}
          <div>
            <h4 className="text-xs sm:text-base font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
              <Package className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
              Productos ({items.length})
            </h4>
            {items.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-3 sm:py-4 bg-gray-50 rounded-lg">Sin productos registrados</p>
            ) : (
              <div className="space-y-1.5 sm:space-y-2">
                {/* Cards para móvil, tabla para desktop */}
                <div className="sm:hidden space-y-1.5">
                  {items.map((item, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                      <div className="flex justify-between items-start mb-1.5">
                        <p className="font-medium text-gray-900 text-xs flex-1 min-w-0">
                          {item.producto_nombre || `Producto #${item.producto_id}`}
                        </p>
                        <p className="font-bold text-gray-900 text-xs ml-2">
                          {formatearMonto(item.total_linea, moneda)}
                        </p>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>{toNumber(item.cantidad).toFixed(3)} kg</span>
                        <span>{formatearMonto(item.precio_unitario, moneda)} /kg</span>
                      </div>
                    </div>
                  ))}
                  <div className="bg-gray-100 rounded-lg p-2 border border-gray-300">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700 text-xs">Total:</span>
                      <span className="font-bold text-gray-900 text-xs">
                        {formatearMonto(venta.total, moneda)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tabla para desktop */}
                <div className="hidden sm:block overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-gray-600 font-medium">Producto</th>
                        <th className="px-4 py-2 text-center text-gray-600 font-medium">Peso (kg)</th>
                        <th className="px-4 py-2 text-right text-gray-600 font-medium">P. Unit.</th>
                        <th className="px-4 py-2 text-right text-gray-600 font-medium">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5 font-medium text-gray-900">
                            {item.producto_nombre || `Producto #${item.producto_id}`}
                          </td>
                          <td className="px-4 py-2.5 text-center text-gray-700">
                            {toNumber(item.cantidad).toFixed(3)} kg
                          </td>
                          <td className="px-4 py-2.5 text-right text-gray-700">
                            {formatearMonto(item.precio_unitario, moneda)}
                          </td>
                          <td className="px-4 py-2.5 text-right font-semibold text-gray-900">
                            {formatearMonto(item.total_linea, moneda)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                      <tr>
                        <td colSpan={3} className="px-4 py-2.5 text-right font-semibold text-gray-700">Total:</td>
                        <td className="px-4 py-2.5 text-right font-bold text-gray-900 text-base">
                          {formatearMonto(venta.total, moneda)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Tabla de pagos - Optimizada para móvil */}
          <div>
            <h4 className="text-xs sm:text-base font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
              <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
              Historial de Pagos ({pagos.length})
            </h4>
            {pagos.length === 0 ? (
              <div className="text-xs text-gray-400 text-center py-3 sm:py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                No hay pagos registrados
              </div>
            ) : (
              <div className="space-y-1.5 sm:space-y-2">
                {/* Cards para móvil */}
                <div className="sm:hidden space-y-1.5">
                  {pagos.map((pago, idx) => {
                    const metodoPagoLabel = {
                      efectivo: 'Efectivo',
                      transferencia: 'Transferencia',
                      pago_movil: 'Pago Móvil'
                    }[pago.metodo_pago] || pago.metodo_pago;

                    const montoMostrar = toNumber(pago.monto_original) > 0
                      ? pago.monto_original
                      : pago.monto_ves
                        ? toNumber(pago.monto_ves) / Math.max(toNumber(pago.tasa_cambio || 1), 1)
                        : pago.monto;
                    const monedaMostrar = pago.moneda_original || moneda;

                    return (
                      <div key={pago.id || idx} className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                        <div className="flex justify-between items-start mb-1.5">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 mb-1">
                              <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                pago.metodo_pago === 'efectivo' ? 'bg-green-100 text-green-700' :
                                pago.metodo_pago === 'transferencia' ? 'bg-blue-100 text-blue-700' :
                                'bg-purple-100 text-purple-700'
                              }`}>
                                {metodoPagoLabel}
                              </span>
                              <span className="text-xs text-gray-500">{formatDate(pago.fecha)}</span>
                            </div>
                            {pago.referencia_pago && (
                              <p className="text-xs text-gray-500 truncate">Ref: {pago.referencia_pago}</p>
                            )}
                          </div>
                          <p className="font-bold text-green-700 text-xs ml-2">
                            {formatearMonto(montoMostrar, monedaMostrar)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div className="space-y-1">
                    <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-green-700 text-xs">Total pagado:</span>
                        <span className="font-bold text-green-800 text-xs">
                          {formatearMonto(totalPagado, moneda)}
                        </span>
                      </div>
                    </div>
                    {saldo > 0 && (
                      <div className="bg-red-50 rounded-lg p-2 border border-red-200">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-red-600 text-xs">Saldo restante:</span>
                          <span className="font-bold text-red-700 text-xs">
                            {formatearMonto(saldo, moneda)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tabla para desktop */}
                <div className="hidden sm:block overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-gray-600 font-medium">Fecha</th>
                        <th className="px-4 py-2 text-left text-gray-600 font-medium">Método</th>
                        <th className="px-4 py-2 text-left text-gray-600 font-medium">Referencia</th>
                        <th className="px-4 py-2 text-right text-gray-600 font-medium">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {pagos.map((pago, idx) => {
                        const metodoPagoLabel = {
                          efectivo: 'Efectivo',
                          transferencia: 'Transferencia',
                          pago_movil: 'Pago Móvil'
                        }[pago.metodo_pago] || pago.metodo_pago;

                        const montoMostrar = toNumber(pago.monto_original) > 0
                          ? pago.monto_original
                          : pago.monto_ves
                            ? toNumber(pago.monto_ves) / Math.max(toNumber(pago.tasa_cambio || 1), 1)
                            : pago.monto;
                        const monedaMostrar = pago.moneda_original || moneda;

                        return (
                          <tr key={pago.id || idx} className="hover:bg-gray-50">
                            <td className="px-4 py-2.5 text-gray-700">{formatDate(pago.fecha)}</td>
                            <td className="px-4 py-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                pago.metodo_pago === 'efectivo' ? 'bg-green-100 text-green-700' :
                                pago.metodo_pago === 'transferencia' ? 'bg-blue-100 text-blue-700' :
                                'bg-purple-100 text-purple-700'
                              }`}>
                                {metodoPagoLabel}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-gray-500 text-xs">
                              {pago.referencia_pago || '—'}
                            </td>
                            <td className="px-4 py-2.5 text-right font-semibold text-green-700">
                              {formatearMonto(montoMostrar, monedaMostrar)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                      <tr>
                        <td colSpan={3} className="px-4 py-2.5 text-right font-semibold text-gray-700">Total pagado:</td>
                        <td className="px-4 py-2.5 text-right font-bold text-green-800">
                          {formatearMonto(totalPagado, moneda)}
                        </td>
                      </tr>
                      {saldo > 0 && (
                        <tr>
                          <td colSpan={3} className="px-4 py-2 text-right font-semibold text-red-600">Saldo restante:</td>
                          <td className="px-4 py-2 text-right font-bold text-red-700">
                            {formatearMonto(saldo, moneda)}
                          </td>
                        </tr>
                      )}
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer optimizado para móvil */}
        <div className="p-3 sm:p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex gap-2 sm:flex-row sm:justify-between sm:gap-3">
            <Button variant="secondary" onClick={onClose} className="flex-1 text-sm min-h-9">
              Cerrar
            </Button>
            {!esPagada && (
              <Button 
                variant="primary" 
                onClick={() => { onClose(); onAbonar(venta); }} 
                className="flex-1 text-sm min-h-9"
              >
                <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
                {venta.tipo_venta === 'credito' ? 'Registrar Abono' : 'Registrar Pago'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function Ventas() {
  const { ventas, productos, clientes, estadosVenta, loading, error, refresh, lastUpdated } = useVentasData();
  const { form, setField, agregarItem, actualizarCantidad, eliminarItem, cambiarMoneda, calcularTotal, resetForm, setCliente } = useFormVenta();

  const ventasRef = useRef(ventas);
  useEffect(() => { ventasRef.current = ventas; }, [ventas]);

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

  const obtenerTasaDesdeTabla = useCallback(async () => {
    const data = await requestJson(`${API_URL}/tasas-cambio/actual`, {}, 'No se pudo obtener la tasa vigente');
    if (!data?.desde_tabla) {
      throw new Error('No hay una tasa activa registrada en la tabla de tasa de cambio');
    }
    const valor = parseFloat(data?.tasa);
    if (!Number.isFinite(valor) || valor <= 0) throw new Error('La tasa vigente es inválida');
    setField('tasaCambio', valor);
    setField('tasaSistema', valor);
    return valor;
  }, [setField]);

  useEffect(() => {
    let isMounted = true;
    const cargarTasa = async () => {
      try {
        const valor = await obtenerTasaDesdeTabla();
        if (!isMounted || !Number.isFinite(valor)) return;
      } catch (e) {
        console.error('Error cargando tasa:', e);
      }
    };
    cargarTasa();
    refresh();
    return () => { isMounted = false; };
  }, [refresh, setField]);

  useEffect(() => {
    if (!ui.mensaje) return;
    const timer = setTimeout(() => setUi(prev => ({ ...prev, mensaje: null })), CONFIG.MESSAGE_DURATION);
    return () => clearTimeout(timer);
  }, [ui.mensaje]);

  const showMessage = useCallback((text, type = 'success') => {
    setUi(prev => ({ ...prev, mensaje: { text, type } }));
  }, []);

  const convertirPendientesACredito = useCallback(async () => {
    setSubmitting(true);
    try {
      const pendientes = ventas.filter(v => v?.estado_pago === 'pendiente' && v?.tipo_venta === 'inmediato');
      if (pendientes.length === 0) {
        showMessage('No hay ventas pendientes para convertir', 'error');
        return;
      }

      const batchSize = 5;
      let convertidas = 0;
      
      for (let i = 0; i < pendientes.length; i += batchSize) {
        const batch = pendientes.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map(venta => 
            fetch(`${API_URL}/ventas/${venta.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                tipo_venta: 'credito',
                fecha_vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
              })
            })
          )
        );
        convertidas += results.filter(r => r.status === 'fulfilled' && r.value.ok).length;
      }

      showMessage(`${convertidas} de ${pendientes.length} ventas convertidas a crédito`, convertidas > 0 ? 'success' : 'error');
      refresh();
    } catch (error) {
      showMessage(error?.message || 'Error desconocido', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [ventas, refresh, showMessage]);

  const handleGuardarVenta = useCallback(async () => {
    if (!form.items?.length) return showMessage('Agrega productos a la venta', 'error');
    if (form.tipoVenta === 'inmediato' && ['transferencia', 'pago_movil'].includes(form.metodoPago) && !form.referenciaPago?.trim()) {
      return showMessage('Ingresa el número de referencia', 'error');
    }
    if (form.tipoVenta === 'credito' && !form.fechaVencimiento) {
      return showMessage('Fecha de vencimiento obligatoria', 'error');
    }

    setSubmitting(true);
    try {
      const payload = {
        cliente_id: form.cliente?.id || null,
        cliente_nombre: form.cliente?.nombre || 'Cliente general',
        items: form.items.map(i => ({
          producto_id: i.producto_id,
          cantidad: i.cantidad,
          precio_unitario: i.precio_unitario
        })),
        moneda: form.moneda,
        tasa_cambio: form.tasaCambio,
        tipo_venta: form.tipoVenta,
        metodo_pago: form.tipoVenta === 'inmediato' ? form.metodoPago : null,
        referencia_pago: form.tipoVenta === 'inmediato' ? form.referenciaPago : null,
        fecha_vencimiento: form.tipoVenta === 'credito' ? form.fechaVencimiento : null
      };

      const res = await fetch(`${API_URL}/ventas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const data = await parseResponseBody(res);
        throw new Error(getApiErrorMessage(res, data, 'Error al guardar venta'));
      }

      showMessage('Venta registrada correctamente');
      setUi(prev => ({ ...prev, modalVenta: false }));
      resetForm();
      refresh();
    } catch (error) {
      showMessage(error?.message || 'Error al guardar', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [form, refresh, resetForm, showMessage]);

  const handleConfirmarAbono = useCallback(async (abonoData) => {
    if (!ui.modalAbono) {
      showMessage('Error: No hay venta seleccionada', 'error');
      return;
    }
    
    if (!abonoData?.monto || abonoData.monto <= 0) {
      showMessage('Error: El monto debe ser mayor a 0', 'error');
      return;
    }

    if (abonoData.metodoPago !== 'efectivo' && !abonoData.referenciaPago?.trim()) {
      showMessage('Error: Ingrese el número de referencia', 'error');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const venta = ui.modalAbono;
      const tasaVigente = await obtenerTasaDesdeTabla();
      
      if (Array.isArray(venta?._ventasPendientes) && venta._ventasPendientes.length > 0) {
        let montoRestanteInput = parseFloat(abonoData.monto);
        const resultados = [];
        const errores = [];
        
        const clienteIdGeneral = venta?.cliente_id;
        const fuentePendientes = clienteIdGeneral && Array.isArray(ventasRef.current)
          ? ventasRef.current.filter(
              (item) =>
                item &&
                Number(item.cliente_id) === Number(clienteIdGeneral) &&
                toNumber(item.saldo_pendiente) > 0
            )
          : (venta._ventasPendientes || []);
        const filtradas = fuentePendientes.filter(
          (item) => item && item.id != null && !isNaN(parseInt(String(item.id), 10))
        );
        if (filtradas.length === 0) {
          throw new Error('No hay ventas válidas para abonar');
        }
        const listaPorIdAsc = ventasOrdenadasMasAntiguaPrimero(filtradas);
        let errorBloqueante = null;
        
        for (const v of listaPorIdAsc) {
          if (montoRestanteInput <= 0.01) break;
          const ventaId = parseInt(String(v?.id), 10) || 0;
          if (!ventaId) continue;
          
          const saldoPendiente = toNumber(v.saldo_pendiente);
          const monedaVenta = v.moneda_original || 'USD';
          
          let montoDisponibleEnMonedaVenta;
          if (abonoData.moneda === monedaVenta) {
            montoDisponibleEnMonedaVenta = montoRestanteInput;
          } else if (abonoData.moneda === 'VES' && monedaVenta === 'USD') {
            montoDisponibleEnMonedaVenta = montoRestanteInput / tasaVigente;
          } else if (abonoData.moneda === 'USD' && monedaVenta === 'VES') {
            montoDisponibleEnMonedaVenta = montoRestanteInput * tasaVigente;
          } else {
            montoDisponibleEnMonedaVenta = montoRestanteInput;
          }
          
          const abonoEnMonedaVenta = Math.min(montoDisponibleEnMonedaVenta, saldoPendiente);
          if (abonoEnMonedaVenta <= 0) continue;
          
          const montoEnBolivares = abonoEnMonedaVenta * tasaVigente;
          const payload = {
            monto_ves: parseFloat(montoEnBolivares.toFixed(2)),
            metodo_pago: abonoData.metodoPago,
            referencia_pago: abonoData.referenciaPago?.trim() || null,
            tasa_cambio: parseFloat(tasaVigente) || CONFIG.TASA_DEFAULT,
            moneda_original: monedaVenta,
            monto_original: parseFloat(abonoEnMonedaVenta.toFixed(2))
          };
          
          try {
            const res = await fetch(`${API_URL}/ventas/${ventaId}/pagos`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            
            if (!res.ok) {
              const data = await parseResponseBody(res);
              errorBloqueante = `No se pudo aplicar abono a la venta #${ventaId}: ${getApiErrorMessage(res, data, 'Error de abono')}`;
              break;
            } else {
              const data = await parseResponseBody(res);
              resultados.push({ ventaId, abono: abonoEnMonedaVenta, data });
              let montoRestadoInput;
              if (abonoData.moneda === monedaVenta) {
                montoRestadoInput = abonoEnMonedaVenta;
              } else if (abonoData.moneda === 'VES' && monedaVenta === 'USD') {
                montoRestadoInput = abonoEnMonedaVenta * tasaVigente;
              } else if (abonoData.moneda === 'USD' && monedaVenta === 'VES') {
                montoRestadoInput = abonoEnMonedaVenta / tasaVigente;
              } else {
                montoRestadoInput = abonoEnMonedaVenta;
              }
              montoRestanteInput -= montoRestadoInput;
            }
          } catch (err) {
            errorBloqueante = `No se pudo aplicar abono a la venta #${ventaId}: ${err.message}`;
            break;
          }
        }
        if (errorBloqueante) throw new Error(errorBloqueante);
        
        if (errores.length > 0 && resultados.length === 0) {
          throw new Error(`No se pudo registrar ningún abono`);
        }
        showMessage(`Abono registrado en ${resultados.length} ventas correctamente`);
        
      } else {
        if (!venta.id || isNaN(parseInt(venta.id))) {
          throw new Error('ID de venta inválido');
        }
        
        const monedaVenta = venta.moneda_original || 'USD';
        let montoFinal;
        
        if (abonoData.moneda === monedaVenta) {
          montoFinal = abonoData.monto;
        } else if (abonoData.moneda === 'VES' && monedaVenta === 'USD') {
          montoFinal = abonoData.monto / tasaVigente;
        } else if (abonoData.moneda === 'USD' && monedaVenta === 'VES') {
          montoFinal = abonoData.monto * tasaVigente;
        } else {
          montoFinal = abonoData.monto;
        }
        
        const montoEnBolivares = montoFinal * tasaVigente;
        
        const payload = {
          monto_ves: parseFloat(montoEnBolivares.toFixed(2)),
          metodo_pago: abonoData.metodoPago,
          referencia_pago: abonoData.referenciaPago?.trim() || null,
          tasa_cambio: parseFloat(tasaVigente) || CONFIG.TASA_DEFAULT,
          moneda_original: monedaVenta,
          monto_original: parseFloat(montoFinal.toFixed(2))
        };
        
        const res = await fetch(`${API_URL}/ventas/${venta.id}/pagos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (!res.ok) {
          const data = await parseResponseBody(res);
          throw new Error(getApiErrorMessage(res, data, 'Error al registrar abono'));
        }
        
        showMessage('Abono registrado correctamente');
      }

      setUi(prev => ({ ...prev, modalAbono: null }));
      refresh();
    } catch (error) {
      showMessage(error.message || 'Error al registrar abono', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [ui.modalAbono, showMessage, refresh, obtenerTasaDesdeTabla]);

  const ventasFiltradas = useMemo(() => {
    if (!Array.isArray(ventas)) return [];
    return ventas.filter(v => {
      if (!v) return false;
      if (filtros.fecha) {
        try {
          const fechaVenta = new Date(v.fecha).toISOString().split('T')[0];
          if (fechaVenta !== filtros.fecha) return false;
        } catch {
          return false;
        }
      }
      if (filtros.tipo && v.tipo_venta !== filtros.tipo) return false;
      if (filtros.estado && v.estado_pago !== filtros.estado) return false;
      return true;
    });
  }, [ventas, filtros]);

  const stats = useMemo(() => {
    if (!Array.isArray(ventas)) {
      return {
        total: 0, totalVentas: 0, totalPagado: 0, totalPendiente: 0,
        porcentajePagado: 0, porTipo: {}, porEstado: {},
        pendientesInmediato: 0, montoPendientesInmediato: 0
      };
    }
    
    const totalVentas = ventas.reduce((sum, v) => sum + toNumber(v?.total), 0);
    const totalPagado = ventas.reduce((sum, v) => sum + (toNumber(v?.total) - toNumber(v?.saldo_pendiente)), 0);
    const pendientesInmediato = ventas.filter(v => v?.estado_pago === 'pendiente' && v?.tipo_venta === 'inmediato');
    
    return {
      total: ventas.length,
      totalVentas,
      totalPagado,
      totalPendiente: totalVentas - totalPagado,
      porcentajePagado: totalVentas > 0 ? (totalPagado / totalVentas) * 100 : 0,
      porTipo: {
        inmediato: ventas.filter(v => v?.tipo_venta === 'inmediato').length,
        credito: ventas.filter(v => v?.tipo_venta === 'credito').length
      },
      porEstado: {
        pagado: ventas.filter(v => v?.estado_pago === 'pagado').length,
        parcial: ventas.filter(v => v?.estado_pago === 'parcial').length,
        pendiente: ventas.filter(v => v?.estado_pago === 'pendiente').length
      },
      pendientesInmediato: pendientesInmediato.length,
      montoPendientesInmediato: pendientesInmediato.reduce((sum, v) => sum + toNumber(v?.total), 0)
    };
  }, [ventas]);

  const datosClientes = useMemo(() => {
    if (!Array.isArray(ventas)) return [];
    const map = new Map();
    
    ventas.forEach(v => {
      if (!v) return;
      const nombre = v.cliente_nombre_completo || v.cliente_nombre || 'Cliente general';
      if (!map.has(nombre)) {
        map.set(nombre, { 
          cliente_id: v.cliente_id || null,
          email: v.cliente_email || null,
          nombre, 
          ventas: [], 
          totalVentas: 0, 
          totalPagado: 0, 
          totalPendiente: 0 
        });
      }
      const c = map.get(nombre);
      c.ventas.push(v);
      c.totalVentas += toNumber(v.total);
      c.totalPagado += toNumber(v.total) - toNumber(v.saldo_pendiente);
      c.totalPendiente += toNumber(v.saldo_pendiente);
    });
    
    return Array.from(map.values()).sort((a, b) => (b?.totalPendiente || 0) - (a?.totalPendiente || 0));
  }, [ventas]);

  const getEstadoTexto = useCallback((venta) => {
    if (!venta) return '';
    const estado = estadosVenta.find(e => e?.codigo === venta.estado_pago);
    return estado?.nombre || (estaPagada(venta) ? 'Pagado' : 'Pendiente');
  }, [estadosVenta]);

  const toggleClientExpand = useCallback((index) => {
    setUi(prev => {
      const newSet = new Set(prev.expandedClients);
      if (newSet.has(index)) newSet.delete(index);
      else newSet.add(index);
      return { ...prev, expandedClients: newSet };
    });
  }, []);

  const abrirAbono = useCallback(async (ventaSeleccionada) => {
    if (!ventaSeleccionada) return;

    try {
      await obtenerTasaDesdeTabla();
    } catch (error) {
      showMessage(error?.message || 'No se pudo validar la tasa activa', 'error');
      return;
    }

    const todasVentas = ventasRef.current;
    const clienteId = ventaSeleccionada.cliente_id;

    const filtradas = Array.isArray(todasVentas)
      ? todasVentas.filter(
          (v) =>
            v &&
            toNumber(v.saldo_pendiente) > 0 &&
            (clienteId ? v.cliente_id === clienteId : v.id === ventaSeleccionada.id)
        )
      : toNumber(ventaSeleccionada.saldo_pendiente) > 0
        ? [ventaSeleccionada]
        : [];
    const pendientesCliente = ventasOrdenadasMasAntiguaPrimero(filtradas);

    if (pendientesCliente.length === 0) {
      return;
    }

    if (!clienteId || pendientesCliente.length === 1) {
      setUi(prev => ({ ...prev, modalAbono: pendientesCliente[0] }));
      return;
    }

    const primeraVenta = pendientesCliente[0];
    const totalPendiente = pendientesCliente.reduce((sum, v) => sum + toNumber(v.saldo_pendiente), 0);
    const clienteNombre = ventaSeleccionada.cliente_nombre_completo || ventaSeleccionada.cliente_nombre || 'Cliente';

    setUi(prev => ({
      ...prev,
      modalAbono: {
        id: `cliente_${clienteId}`,
        cliente_id: clienteId,
        cliente_nombre: clienteNombre,
        total: totalPendiente,
        saldo_pendiente: totalPendiente,
        moneda_original: primeraVenta.moneda_original || 'USD',
        estado_pago: 'pendiente',
        tipo_venta: 'credito',
        _ventasPendientes: [...pendientesCliente]
      }
    }));
  }, [obtenerTasaDesdeTabla, showMessage]);

  const abrirAbonoCliente = useCallback(async (cliente) => {
    if (!cliente || !Array.isArray(cliente.ventas)) {
      showMessage('Error: Datos de cliente inválidos', 'error');
      return;
    }
    try {
      await obtenerTasaDesdeTabla();
    } catch (error) {
      showMessage(error?.message || 'No se pudo validar la tasa activa', 'error');
      return;
    }

    const conSaldo = (cliente.ventas || []).filter((v) => toNumber(v?.saldo_pendiente) > 0);
    const ventasPendientes = ventasOrdenadasMasAntiguaPrimero(conSaldo);

    if (ventasPendientes.length === 0) {
      showMessage('Este cliente no tiene ventas pendientes', 'error');
      return;
    }

    const primeraVenta = ventasPendientes[0];
    const totalPendiente = ventasPendientes.reduce((sum, v) => sum + toNumber(v.saldo_pendiente), 0);

    setUi(prev => ({
      ...prev,
      modalAbono: {
        id: `cliente_${(cliente.nombre || 'unknown').replace(/\s+/g, '_')}`,
        cliente_id: primeraVenta?.cliente_id || null,
        cliente_nombre: cliente.nombre || 'Cliente',
        total: totalPendiente,
        saldo_pendiente: totalPendiente,
        moneda_original: primeraVenta.moneda_original || 'USD',
        estado_pago: 'pendiente',
        tipo_venta: 'credito',
        _ventasPendientes: [...ventasPendientes]
      }
    }));
  }, [showMessage, obtenerTasaDesdeTabla]);

  const abrirDetalle = useCallback(async (venta) => {
    if (!venta) return;
    setUi(prev => ({ ...prev, modalDetalle: { ...venta, _cargando: true } }));
    try {
      const data = await requestJson(`${API_URL}/ventas/${venta.id}`, {}, 'Error al cargar detalle');
      setUi(prev => ({ ...prev, modalDetalle: data }));
    } catch (error) {
      showMessage(error?.message || 'Error al cargar el detalle de la venta', 'error');
      setUi(prev => ({ ...prev, modalDetalle: null }));
    }
  }, [showMessage]);

  const enviarEmailCliente = useCallback(async (clienteId) => {
    if (!clienteId) return;
    try {
      const data = await requestJson(`${API_URL}/estado-cuenta/${clienteId}/enviar-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, 'No se pudo enviar el correo');
      showMessage(data?.mensaje || 'Correo enviado correctamente');
    } catch (error) {
      showMessage(error?.message || 'Error enviando correo al cliente', 'error');
    }
  }, [showMessage]);

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <p className="text-red-600 font-medium text-lg mb-4">{error}</p>
        <Button onClick={refresh} variant="primary" size="lg">Reintentar conexión</Button>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-xl">
              <ShoppingCart className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Gestión de Ventas</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                {stats.total} ventas • {stats.porEstado.pendiente} por cobrar
                {lastUpdated && (
                  <span className="ml-2 text-gray-400">
                    • Actualizado {new Date(lastUpdated).toLocaleTimeString()}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex gap-2 w-full lg:w-auto">
          {stats.pendientesInmediato > 0 && (
            <Button
              variant="purple"
              onClick={convertirPendientesACredito}
              loading={submitting}
              className="shadow-sm w-full lg:w-auto"
              title="Convertir ventas pendientes a crédito"
            >
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              Convertir ({stats.pendientesInmediato})
            </Button>
          )}
          <Button
            variant="blue"
            onClick={() => setUi(prev => ({ ...prev, modalEstadoCuenta: true }))}
            className="w-full lg:w-auto text-xs sm:text-sm"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Estado de Cuenta
          </Button>
          <Button
            variant="primary"
            onClick={() => setUi(prev => ({ ...prev, modalVenta: true }))}
            className="w-full lg:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Venta
          </Button>
        </div>
      </div>

      {ui.mensaje && (
        <Alert 
          type={ui.mensaje.type} 
          message={ui.mensaje.text}
          onClose={() => setUi(prev => ({ ...prev, mensaje: null }))}
        />
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-bold text-gray-800">Ventas Activas</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full sm:w-auto">
            <input
              type="date"
              value={filtros.fecha}
              onChange={(e) => setFiltros(prev => ({ ...prev, fecha: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-white"
            />
            <select
              value={filtros.tipo}
              onChange={(e) => setFiltros(prev => ({ ...prev, tipo: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-white"
            >
              <option value="">Todos los tipos</option>
              <option value="inmediato">Inmediato</option>
              <option value="credito">Crédito</option>
            </select>
            <select
              value={filtros.estado}
              onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-white"
            >
              <option value="">Todos los estados</option>
              <option value="pagado">Pagado</option>
              <option value="parcial">Parcial</option>
              <option value="pendiente">Pendiente</option>
            </select>
            {(filtros.fecha || filtros.tipo || filtros.estado) && (
              <button
                onClick={() => setFiltros({ fecha: '', tipo: '', estado: '' })}
                className="sm:col-span-3 text-sm text-orange-600 hover:text-orange-700 font-medium px-2 py-1 underline decoration-orange-600/30 hover:decoration-orange-600 text-left sm:text-center"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {loading && ventasFiltradas.length === 0 ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Cargando ventas...</p>
            </div>
          ) : ventasFiltradas.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-1">No hay ventas registradas</p>
              {filtros.fecha && <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>}
            </div>
          ) : (
            <>
              <div className="sm:hidden space-y-3">
                {ventasFiltradas.map(v => (
                  <VentaCard 
                    key={v?.id || Math.random()} 
                    venta={v} 
                    onVerDetalle={abrirDetalle}
                    onAbonar={abrirAbono}
                    getEstadoTexto={getEstadoTexto}
                  />
                ))}
              </div>
              <div className="hidden sm:block">
                <VentasTable 
                  ventas={ventasFiltradas} 
                  onVerDetalle={abrirDetalle}
                  onAbonar={abrirAbono}
                  getEstadoTexto={getEstadoTexto}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <ModalNuevaVenta
        visible={ui.modalVenta}
        onClose={() => setUi(prev => ({ ...prev, modalVenta: false }))}
        form={form}
        setField={setField}
        data={{ clientes, productos }}
        onSubmit={handleGuardarVenta}
        loading={submitting}
        agregarItem={agregarItem}
        actualizarCantidad={actualizarCantidad}
        eliminarItem={eliminarItem}
        cambiarMoneda={cambiarMoneda}
        calcularTotal={calcularTotal}
        setCliente={setCliente}
      />

      <ModalEstadoCuenta
        isOpen={ui.modalEstadoCuenta}
        onClose={() => setUi(prev => ({ ...prev, modalEstadoCuenta: false }))}
        stats={stats}
        datosClientes={datosClientes}
        tipoEstadoCuenta={ui.tipoEstadoCuenta}
        onChangeTipo={(tipo) => setUi(prev => ({ ...prev, tipoEstadoCuenta: tipo }))}
        expandedClients={ui.expandedClients}
        onToggleExpand={toggleClientExpand}
        onAbonarCliente={abrirAbonoCliente}
        onAbonarVenta={(venta) => {
          setUi(prev => ({ ...prev, modalEstadoCuenta: false }));
          abrirAbono(venta);
        }}
        onEnviarEmailCliente={enviarEmailCliente}
      />

      <ModalAbono
        isOpen={!!ui.modalAbono}
        onClose={() => setUi(prev => ({ ...prev, modalAbono: null }))}
        venta={ui.modalAbono}
        tasaSistema={form.tasaSistema}
        onConfirm={handleConfirmarAbono}
        loading={submitting}
      />

      {ui.modalDetalle && (
        <ModalDetalle
          venta={ui.modalDetalle}
          onClose={() => setUi(prev => ({ ...prev, modalDetalle: null }))}
          onAbonar={abrirAbono}
        />
      )}
    </div>
  );
}
