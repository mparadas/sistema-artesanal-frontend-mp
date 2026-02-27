import React, {
  useState, useEffect, useMemo, useCallback, useRef, memo, useReducer,
  createContext, useContext, useId
} from 'react';
import {
  ShoppingCart, Plus, Trash2, Search, User, Package, DollarSign,
  CheckCircle, X, Clock, Banknote, Smartphone, CreditCard,
  TrendingUp, FileText, AlertCircle, Filter, Calendar, ArrowRightLeft,
  RefreshCw, Printer
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import API_URL from '../config';

// ==========================================
// CONSTANTES Y CONFIGURACIÓN
// ==========================================
const CONFIG = {
  TASA_DEFAULT: 405.3518,
  DEBOUNCE_DELAY: 300,
  DATE_FORMAT: 'es-VE'
};

const PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo', icon: Banknote, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'transferencia', label: 'Transferencia', icon: CreditCard, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'pago_movil', label: 'Pago Móvil', icon: Smartphone, color: 'bg-purple-100 text-purple-700 border-purple-200' }
];

const STATUS_STYLES = {
  pagado: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  parcial: 'bg-amber-100 text-amber-700 border-amber-200',
  pendiente: 'bg-rose-100 text-rose-700 border-rose-200',
  liquidado: 'bg-teal-100 text-teal-700 border-teal-200',
  cancelado: 'bg-slate-100 text-slate-700 border-slate-200'
};

const STATUS_NAMES = {
  pagado: 'Pagado',
  parcial: 'Parcial',
  pendiente: 'Pendiente',
  liquidado: 'Liquidado',
  cancelado: 'Cancelado'
};

// ==========================================
// UTILIDADES
// ==========================================
const cn = (...inputs) => twMerge(clsx(inputs));

const safeNumber = (val) => {
  if (val == null) return 0;
  if (typeof val === 'number') return isFinite(val) ? val : 0;
  if (typeof val === 'string') {
    const num = parseFloat(val.replace(/,/g, '').trim());
    return isFinite(num) ? num : 0;
  }
  return 0;
};

const formatCurrency = (() => {
  const formatters = new Map();
  
  return (amount, currency = 'USD') => {
    const value = safeNumber(amount);
    const key = `${currency}-${CONFIG.DATE_FORMAT}`;
    
    if (!formatters.has(key)) {
      formatters.set(key, new Intl.NumberFormat(
        currency === 'USD' ? 'en-US' : 'es-VE',
        { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }
      ));
    }
    
    try {
      return formatters.get(key).format(value);
    } catch {
      return currency === 'VES' ? `Bs. ${value.toFixed(2)}` : `$${value.toFixed(2)}`;
    }
  };
})();

const formatDate = (() => {
  const formatter = new Intl.DateTimeFormat(CONFIG.DATE_FORMAT, {
    day: '2-digit', month: 'short', year: 'numeric'
  });
  
  return (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return isNaN(d.getTime()) ? 'N/A' : formatter.format(d);
  };
})();

const getStatusStyles = (status) => STATUS_STYLES[status] || 'bg-gray-100 text-gray-700 border-gray-200';
const getStatusName = (status) => STATUS_NAMES[status] || 'Desconocido';

// ==========================================
// CONTEXTO
// ==========================================
const SalesContext = createContext(null);

const useSalesContext = () => {
  const context = useContext(SalesContext);
  if (!context) throw new Error('useSalesContext debe usarse dentro de SalesProvider');
  return context;
};

// ==========================================
// HOOKS PERSONALIZADOS
// ==========================================
const useDebounce = (value, delay = CONFIG.DEBOUNCE_DELAY) => {
  const [debounced, setDebounced] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return debounced;
};

const salesReducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS': {
      const { sales = [], products = [], clients = [], exchangeRate } = action.payload;
      return {
        ...state,
        sales,
        products,
        clients,
        exchangeRate: exchangeRate || state.exchangeRate,
        loading: false,
        lastUpdated: Date.now(),
        error: null
      };
    }
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

const useSalesData = () => {
  const [state, dispatch] = useReducer(salesReducer, {
    sales: [],
    products: [],
    clients: [],
    exchangeRate: CONFIG.TASA_DEFAULT,
    loading: true,
    error: null,
    lastUpdated: null
  });

  const abortRef = useRef(null);

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) dispatch({ type: 'FETCH_START' });
    
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;

    const endpoints = [
      { key: 'sales', url: `${API_URL}/ventas`, required: true },
      { key: 'products', url: `${API_URL}/productos`, required: true },
      { key: 'clients', url: `${API_URL}/clientes`, required: true },
      { key: 'exchangeRate', url: `${API_URL}/tasas-cambio/actual`, required: false }
    ];

    try {
      const results = await Promise.allSettled(
        endpoints.map(async ({ key, url, required }) => {
          try {
            const res = await fetch(url, { signal });
            if (!res.ok && required) throw new Error(`Error cargando ${key}`);
            const data = res.ok ? await res.json() : null;
            return { key, data: data?.data ?? data };
          } catch (err) {
            if (err.name === 'AbortError') return { key, data: null };
            if (required) throw err;
            return { key, data: null };
          }
        })
      );

      const payload = {};
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.data) {
          payload[result.value.key] = result.value.data;
        }
      });

      dispatch({ type: 'FETCH_SUCCESS', payload });
    } catch (err) {
      dispatch({ type: 'FETCH_ERROR', payload: err.message });
    }
  }, []);

  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort();
  }, [fetchData]);

  return useMemo(() => ({ 
    ...state, 
    refresh: () => fetchData(true) 
  }), [state, fetchData]);
};

const useSaleForm = (initialRate) => {
  const initialState = useMemo(() => ({
    client: null,
    items: [],
    currency: 'USD',
    exchangeRate: initialRate,
    paymentMethod: 'efectivo',
    reference: '',
    saleType: 'inmediato',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    searchClient: '',
    searchProduct: ''
  }), [initialRate]);

  const [form, setForm] = useState(initialState);

  const total = useMemo(() => 
    form.items.reduce((sum, item) => sum + safeNumber(item.total), 0),
    [form.items]
  );

  const actions = useMemo(() => ({
    addItem: (product) => {
      if (!product?.id) return;
      
      const basePrice = safeNumber(product.price);
      const price = form.currency === 'USD' ? basePrice : basePrice * form.exchangeRate;
      
      setForm(prev => {
        const existingIndex = prev.items.findIndex(i => i.productId === product.id);
        
        if (existingIndex >= 0) {
          const items = [...prev.items];
          const item = items[existingIndex];
          const newQty = Math.min(item.quantity + 1, product.stock || Infinity);
          items[existingIndex] = {
            ...item,
            quantity: newQty,
            total: newQty * item.unitPrice
          };
          return { ...prev, items, searchProduct: '' };
        }

        return {
          ...prev,
          items: [...prev.items, {
            productId: product.id,
            name: product.name || 'Producto sin nombre',
            quantity: 1,
            unitPrice: price,
            total: price,
            stock: product.stock || 0
          }],
          searchProduct: ''
        };
      });
    },

    updateQuantity: (index, delta) => {
      setForm(prev => {
        const items = [...prev.items];
        const item = items[index];
        if (!item) return prev;
        
        const newQty = Math.max(1, Math.min(item.quantity + delta, item.stock || Infinity));
        items[index] = { ...item, quantity: newQty, total: newQty * item.unitPrice };
        return { ...prev, items };
      });
    },

    removeItem: (index) => {
      setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
    },

    toggleCurrency: () => {
      setForm(prev => {
        const newCurrency = prev.currency === 'USD' ? 'VES' : 'USD';
        const factor = newCurrency === 'USD' ? (1 / prev.exchangeRate) : prev.exchangeRate;
        
        return {
          ...prev,
          currency: newCurrency,
          items: prev.items.map(item => ({
            ...item,
            unitPrice: item.unitPrice * factor,
            total: item.total * factor
          }))
        };
      });
    },

    reset: () => {
      setForm(prev => ({ ...initialState, exchangeRate: prev.exchangeRate }));
    },

    setField: (field, value) => {
      setForm(prev => ({ ...prev, [field]: value }));
    }
  }), [form.currency, form.exchangeRate, initialState]);

  const isValid = useMemo(() => 
    form.items.length > 0 && 
    (form.saleType === 'credito' || form.paymentMethod === 'efectivo' || form.reference.trim() !== ''),
    [form.items.length, form.saleType, form.paymentMethod, form.reference]
  );

  return useMemo(() => ({
    form,
    total,
    isValid,
    ...actions
  }), [form, total, isValid, actions]);
};

// ==========================================
// COMPONENTES UI
// ==========================================
const Button = memo(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  className = '', 
  disabled,
  ...props 
}) => {
  const variants = {
    primary: 'bg-orange-600 hover:bg-orange-700 text-white shadow-sm active:bg-orange-800',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 active:bg-gray-300',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm active:bg-emerald-800',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white active:bg-rose-800',
    outline: 'border-2 border-gray-300 hover:border-gray-400 text-gray-700 bg-white hover:bg-gray-50',
    ghost: 'hover:bg-gray-100 text-gray-700'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-orange-500',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        'active:scale-95',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
});
Button.displayName = 'Button';

const Badge = memo(({ children, variant = 'default', className }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800 border-gray-200',
    success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    danger: 'bg-rose-100 text-rose-800 border-rose-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200'
  };

  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
});
Badge.displayName = 'Badge';

const Input = memo(({ label, error, icon, className, id, ...props }) => {
  const inputId = id || useId();
  
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
          {props.required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            'w-full border rounded-lg transition-all duration-200',
            'focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none',
            'disabled:bg-gray-100 disabled:cursor-not-allowed',
            icon ? 'pl-10' : 'pl-3',
            'pr-3 py-2.5',
            error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500' : 'border-gray-300',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
});
Input.displayName = 'Input';

const CurrencyToggle = memo(({ value, onChange }) => (
  <div className="flex bg-gray-100 p-1 rounded-lg">
    {['USD', 'VES'].map((curr) => (
      <button
        key={curr}
        type="button"
        onClick={() => onChange(curr)}
        className={cn(
          'flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all duration-200',
          value === curr
            ? curr === 'USD'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        )}
      >
        {curr === 'USD' ? '$ USD' : 'Bs. VES'}
      </button>
    ))}
  </div>
));
CurrencyToggle.displayName = 'CurrencyToggle';

const PaymentMethodSelector = memo(({ value, onChange }) => (
  <div className="grid grid-cols-3 gap-3">
    {PAYMENT_METHODS.map(({ value: v, label, icon: Icon, color }) => (
      <button
        key={v}
        type="button"
        onClick={() => onChange(v)}
        className={cn(
          'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200',
          value === v
            ? `${color} border-transparent ring-2 ring-offset-1 ring-orange-500`
            : 'bg-white border-gray-200 hover:border-gray-300 text-gray-600'
        )}
      >
        <Icon className="w-6 h-6" />
        <span className="text-xs font-medium">{label}</span>
      </button>
    ))}
  </div>
));
PaymentMethodSelector.displayName = 'PaymentMethodSelector';

const SaleItemRow = memo(({ item, index, currency, onUpdateQty, onRemove }) => (
  <tr className="group hover:bg-gray-50 transition-colors">
    <td className="px-4 py-3 text-sm font-medium text-gray-900">
      {item.name}
      <span className="block text-xs text-gray-500">Stock: {item.stock}</span>
    </td>
    <td className="px-4 py-3">
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => onUpdateQty(index, -1)}
          disabled={item.quantity <= 1}
          className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 flex items-center justify-center text-gray-700 font-bold transition-colors"
        >
          −
        </button>
        <span className="w-8 text-center font-semibold text-gray-900">{item.quantity}</span>
        <button
          onClick={() => onUpdateQty(index, 1)}
          disabled={item.quantity >= item.stock}
          className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 flex items-center justify-center text-gray-700 font-bold transition-colors"
        >
          +
        </button>
      </div>
    </td>
    <td className="px-4 py-3 text-right font-semibold text-gray-900">
      {formatCurrency(item.total, currency)}
    </td>
    <td className="px-4 py-3 text-center">
      <button
        onClick={() => onRemove(index)}
        className="p-2 hover:bg-rose-100 rounded-lg text-rose-600 opacity-0 group-hover:opacity-100 transition-all"
        aria-label="Eliminar item"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </td>
  </tr>
));
SaleItemRow.displayName = 'SaleItemRow';

const Modal = memo(({ isOpen, onClose, title, description, children, footer, maxWidth = 'md' }) => {
  const overlayRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;
    
    const handleEsc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    
    const firstFocusable = overlayRef.current?.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full mx-4'
  };

  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className={cn(
        'relative bg-white rounded-2xl shadow-xl w-full flex flex-col max-h-[90vh]',
        'transform transition-all duration-200 ease-out',
        maxWidths[maxWidth]
      )}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h3 id={titleId} className="text-xl font-bold text-gray-900">{title}</h3>
            {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {footer && (
          <div className="p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
});
Modal.displayName = 'Modal';

// ==========================================
// LISTADOS
// ==========================================
const SaleCard = memo(({ sale, onView, onPay }) => {
  const paid = safeNumber(sale.saldo_pendiente) <= 0;
  const isCredit = sale.tipo_venta === 'credito';
  const hasDebt = safeNumber(sale.saldo_pendiente) > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 group">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-gray-900">#{sale.id}</span>
            <span className="text-xs text-gray-500">{formatDate(sale.fecha)}</span>
          </div>
          <p className="text-sm font-medium text-gray-700 truncate max-w-[150px]">
            {sale.cliente_nombre || 'N/A'}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg text-gray-900">
            {formatCurrency(sale.total, sale.moneda_original)}
          </p>
          <Badge variant={isCredit ? 'warning' : 'success'} className="text-xs">
            {isCredit ? 'Crédito' : 'Inmediato'}
          </Badge>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <span className={cn(
          'px-2 py-1 rounded-full text-xs font-medium border',
          getStatusStyles(sale.estado_pago)
        )}>
          {getStatusName(sale.estado_pago)}
        </span>
        {isCredit && hasDebt && (
          <span className="text-sm font-semibold text-rose-600">
            Debe: {formatCurrency(sale.saldo_pendiente, sale.moneda_original)}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onView(sale)} className="flex-1 text-xs">
          <FileText className="w-3 h-3 mr-1" /> 
          Ver
        </Button>
        {!paid && (
          <Button 
            variant={isCredit ? 'primary' : 'success'} 
            size="sm" 
            onClick={() => onPay(sale)}
            className="flex-1 text-xs"
          >
            <DollarSign className="w-3 h-3 mr-1" />
            {isCredit ? 'Abonar' : 'Pagar'}
          </Button>
        )}
      </div>
    </div>
  );
});
SaleCard.displayName = 'SaleCard';

const SalesTable = memo(({ sales, onView, onPay }) => {
  if (sales.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>No hay ventas para mostrar</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-bold">
            <tr>
              <th className="px-4 py-3">#ID</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3 text-center">Tipo</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Saldo</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {sales.map((sale) => (
              <tr key={sale.id} className="hover:bg-orange-50/30 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">#{sale.id}</td>
                <td className="px-4 py-3 text-gray-700">{sale.cliente_nombre || 'N/A'}</td>
                <td className="px-4 py-3 text-gray-500">{formatDate(sale.fecha)}</td>
                <td className="px-4 py-3 text-center">
                  <Badge variant={sale.tipo_venta === 'credito' ? 'warning' : 'success'}>
                    {sale.tipo_venta === 'credito' ? 'Crédito' : 'Inmediato'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {formatCurrency(sale.total, sale.moneda_original)}
                </td>
                <td className="px-4 py-3 text-right">
                  {safeNumber(sale.saldo_pendiente) > 0 ? (
                    <span className="text-rose-600 font-semibold">
                      {formatCurrency(sale.saldo_pendiente, sale.moneda_original)}
                    </span>
                  ) : (
                    <span className="text-emerald-600 font-medium">$0.00</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium border',
                    getStatusStyles(sale.estado_pago)
                  )}>
                    {getStatusName(sale.estado_pago)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center gap-1">
                    <button 
                      onClick={() => onView(sale)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Ver detalle"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    {safeNumber(sale.saldo_pendiente) > 0 && (
                      <button 
                        onClick={() => onPay(sale)}
                        className={cn(
                          'p-2 rounded-lg transition-colors',
                          sale.tipo_venta === 'credito' 
                            ? 'text-orange-600 hover:bg-orange-50' 
                            : 'text-emerald-600 hover:bg-emerald-50'
                        )}
                        title={sale.tipo_venta === 'credito' ? 'Abonar' : 'Pagar'}
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
    </div>
  );
});
SalesTable.displayName = 'SalesTable';

// ==========================================
// MODALES ESPECÍFICOS
// ==========================================
const NewSaleModal = memo(({ isOpen, onClose }) => {
  const { products, clients, refresh } = useSalesContext();
  const { form, setField, addItem, updateQuantity, removeItem, toggleCurrency, reset, total, isValid } = useSaleForm(CONFIG.TASA_DEFAULT);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const debouncedClient = useDebounce(form.searchClient);
  const debouncedProduct = useDebounce(form.searchProduct);

  const filteredClients = useMemo(() => {
    if (!debouncedClient || !clients) return [];
    const term = debouncedClient.toLowerCase();
    return clients
      .filter(c => c.name?.toLowerCase().includes(term))
      .slice(0, 8);
  }, [clients, debouncedClient]);

  const filteredProducts = useMemo(() => {
    if (!debouncedProduct || !products) return [];
    const term = debouncedProduct.toLowerCase();
    return products.filter(p => p.name?.toLowerCase().includes(term));
  }, [products, debouncedProduct]);

  const handleSubmit = useCallback(async () => {
    if (!isValid) return;
    
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        client_id: form.client?.id,
        client_name: form.client?.name || 'Cliente general',
        items: form.items.map(i => ({
          product_id: i.productId,
          quantity: i.quantity,
          unit_price: i.unitPrice
        })),
        currency: form.currency,
        exchange_rate: form.exchangeRate,
        sale_type: form.saleType,
        payment_method: form.saleType === 'inmediato' ? form.paymentMethod : null,
        reference: form.saleType === 'inmediato' ? form.reference : null,
        due_date: form.saleType === 'credito' ? form.dueDate : null
      };

      const res = await fetch(`${API_URL}/ventas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Error al guardar la venta');

      reset();
      onClose();
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }, [isValid, form, reset, onClose, refresh]);

  const handleClose = useCallback(() => {
    if (!submitting) {
      reset();
      onClose();
    }
  }, [submitting, reset, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Nueva Venta"
      description="Complete los datos para registrar una nueva venta"
      maxWidth="lg"
      footer={
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 w-full">
          <div className="text-center sm:text-left">
            <p className="text-sm text-gray-500">Total a pagar</p>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(total, form.currency)}</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button variant="secondary" onClick={handleClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button 
              variant="success" 
              onClick={handleSubmit}
              loading={submitting}
              disabled={!isValid}
            >
              Finalizar Venta
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Cliente *</label>
            {!form.client ? (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={form.searchClient}
                  onChange={(e) => setField('searchClient', e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                />
                {filteredClients.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {filteredClients.map(client => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => {
                          setField('client', client);
                          setField('searchClient', '');
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-orange-50 border-b last:border-0 transition-colors"
                      >
                        <p className="font-medium text-gray-900">{client.name}</p>
                        {client.phone && <p className="text-xs text-gray-500">{client.phone}</p>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between bg-orange-50 border border-orange-200 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center">
                    <User className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{form.client.name}</p>
                    <p className="text-sm text-gray-500">{form.client.phone || 'Sin teléfono'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setField('client', null)}
                  className="p-2 hover:bg-orange-200 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Moneda</label>
            <CurrencyToggle 
              value={form.currency} 
              onChange={(c) => c !== form.currency && toggleCurrency()} 
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Agregar Productos</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={form.searchProduct}
              onChange={(e) => setField('searchProduct', e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>
          
          {filteredProducts.length > 0 && (
            <div className="border border-gray-200 rounded-lg max-h-48 overflow-auto bg-white shadow-sm">
              {filteredProducts.map(product => {
                const hasStock = (product.stock || 0) > 0;
                const price = form.currency === 'USD' 
                  ? safeNumber(product.price) 
                  : safeNumber(product.price) * form.exchangeRate;
                
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => hasStock && addItem(product)}
                    disabled={!hasStock}
                    className={cn(
                      'w-full text-left px-4 py-3 border-b last:border-0 flex justify-between items-center',
                      hasStock ? 'hover:bg-orange-50' : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                    )}
                  >
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500">Stock: {product.stock || 0}</p>
                    </div>
                    <span className="font-bold text-orange-600">
                      {formatCurrency(price, form.currency)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {form.items.length > 0 && (
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Producto</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700 w-32">Cant.</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Total</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {form.items.map((item, idx) => (
                  <SaleItemRow
                    key={`${item.productId}-${idx}`}
                    item={item}
                    index={idx}
                    currency={form.currency}
                    onUpdateQty={updateQuantity}
                    onRemove={removeItem}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-4">
          <div className="flex gap-4">
            <Button
              type="button"
              variant={form.saleType === 'inmediato' ? 'success' : 'outline'}
              onClick={() => setField('saleType', 'inmediato')}
              className="flex-1 py-3"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Inmediato
            </Button>
            <Button
              type="button"
              variant={form.saleType === 'credito' ? 'primary' : 'outline'}
              onClick={() => setField('saleType', 'credito')}
              className="flex-1 py-3"
            >
              <Clock className="w-5 h-5 mr-2" />
              Crédito
            </Button>
          </div>

          {form.saleType === 'inmediato' ? (
            <div className="space-y-4">
              <PaymentMethodSelector 
                value={form.paymentMethod} 
                onChange={(m) => setField('paymentMethod', m)} 
              />
              {form.paymentMethod !== 'efectivo' && (
                <Input
                  label="Número de Referencia"
                  required
                  value={form.reference}
                  onChange={(e) => setField('reference', e.target.value)}
                  placeholder="Ingrese la referencia"
                />
              )}
            </div>
          ) : (
            <Input
              type="date"
              label="Fecha de Vencimiento"
              required
              value={form.dueDate}
              onChange={(e) => setField('dueDate', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          )}
        </div>
      </div>
    </Modal>
  );
});
NewSaleModal.displayName = 'NewSaleModal';

// Función helper para imprimir proforma
const generatePrintContent = (sale) => {
  const totalPagado = safeNumber(sale.total) - safeNumber(sale.saldo_pendiente);
  const porcentajePagado = safeNumber(sale.total) > 0 ? (totalPagado / safeNumber(sale.total)) * 100 : 0;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Proforma Venta #${sale.id || 'N/A'}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin-bottom: 20px; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
        .items-table, .pagos-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .items-table th, .items-table td, .pagos-table th, .pagos-table td { 
          border: 1px solid #ddd; padding: 8px; text-align: left; 
        }
        .items-table th, .pagos-table th { background-color: #f5f5f5; font-weight: bold; }
        .total-row { font-weight: bold; border-top: 2px solid #000; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>PROFORMA DE VENTA</h1>
        <h2>#${sale.id || 'N/A'}</h2>
        <p>Fecha: ${new Date(sale.fecha).toLocaleDateString('es-VE')} ${new Date(sale.fecha).toLocaleTimeString('es-VE')}</p>
      </div>
      
      <div class="section">
        <h3>Información del Cliente</h3>
        <div class="info-row"><span>Cliente:</span><span>${sale.cliente_nombre || 'N/A'}</span></div>
        <div class="info-row"><span>Tipo Venta:</span><span>${sale.tipo_venta === 'credito' ? 'Crédito' : 'Inmediato'}</span></div>
        <div class="info-row"><span>Estado:</span><span>${getStatusName(sale.estado_pago)}</span></div>
      </div>
      
      <div class="section">
        <h3>Detalles del Pedido</h3>
        <table class="items-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th class="text-center">Cantidad</th>
              <th class="text-right">Precio Unit.</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${sale.items ? sale.items.map(item => `
              <tr>
                <td>${item.producto_nombre || 'N/A'}</td>
                <td class="text-center">${item.cantidad}</td>
                <td class="text-right">${formatCurrency(item.precio_unitario, sale.moneda_original)}</td>
                <td class="text-right">${formatCurrency(item.total_linea, sale.moneda_original)}</td>
              </tr>
            `).join('') : ''}
            <tr class="total-row">
              <td colspan="3" class="text-right"><strong>Total:</strong></td>
              <td class="text-right"><strong>${formatCurrency(sale.total, sale.moneda_original)}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="section">
        <h3>Historial de Abonos</h3>
        <table class="pagos-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Monto</th>
              <th>Método</th>
              <th>Referencia</th>
            </tr>
          </thead>
          <tbody>
            ${sale.pagos ? sale.pagos.map(pago => `
              <tr>
                <td>${new Date(pago.fecha).toLocaleDateString('es-VE')} ${new Date(pago.fecha).toLocaleTimeString('es-VE')}</td>
                <td class="text-right">${formatCurrency(pago.monto, sale.moneda_original)}</td>
                <td>${pago.metodo_pago || 'N/A'}</td>
                <td>${pago.referencia_pago || 'N/A'}</td>
              </tr>
            `).join('') : '<tr><td colspan="4" class="text-center">No hay abonos registrados</td></tr>'}
          </tbody>
        </table>
      </div>
      
      <div class="section">
        <h3>Resumen de Pago</h3>
        <div class="info-row"><span>Total Venta:</span><span class="text-right">${formatCurrency(sale.total, sale.moneda_original)}</span></div>
        <div class="info-row"><span>Total Pagado:</span><span class="text-right">${formatCurrency(totalPagado, sale.moneda_original)}</span></div>
        <div class="info-row"><span>Saldo Pendiente:</span><span class="text-right">${formatCurrency(sale.saldo_pendiente, sale.moneda_original)}</span></div>
        <div class="info-row"><span>Porcentaje Pagado:</span><span class="text-right">${porcentajePagado.toFixed(1)}%</span></div>
      </div>
    </body>
    </html>
  `;
};

const ModalDetalle = memo(({ isOpen, onClose, sale, onAbonar }) => {
  if (!isOpen || !sale) return null;

  const totalPagado = safeNumber(sale.total) - safeNumber(sale.saldo_pendiente);
  const porcentajePagado = safeNumber(sale.total) > 0 ? (totalPagado / safeNumber(sale.total)) * 100 : 0;
  const paid = safeNumber(sale.saldo_pendiente) <= 0;

  const handlePrint = useCallback(() => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(generatePrintContent(sale));
    printWindow.document.close();
    printWindow.print();
  }, [sale]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detalle de Venta #${sale.id || 'N/A'}`}
      description="Información completa de la venta"
      maxWidth="lg"
      footer={
        <div className="flex justify-between items-center w-full">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir Proforma
          </Button>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
            {!paid && (
              <Button 
                variant={sale.tipo_venta === 'credito' ? 'primary' : 'success'} 
                onClick={() => {
                  onClose();
                  onAbonar(sale);
                }}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                {sale.tipo_venta === 'credito' ? 'Abonar' : 'Pagar'}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-800 text-sm">Información General</h4>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Cliente:</span> {sale.cliente_nombre || 'N/A'}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Fecha:</span> {formatDate(sale.fecha)}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Tipo:</span> 
                <Badge variant={sale.tipo_venta === 'credito' ? 'warning' : 'success'} className="ml-2">
                  {sale.tipo_venta === 'credito' ? 'Crédito' : 'Inmediato'}
                </Badge>
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Estado:</span> 
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium border ${getStatusStyles(sale.estado_pago)}`}>
                  {getStatusName(sale.estado_pago)}
                </span>
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-800 text-sm">Información de Pago</h4>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Total:</span> {formatCurrency(sale.total, sale.moneda_original)}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Pagado:</span> {formatCurrency(totalPagado, sale.moneda_original)}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Saldo:</span> 
                <span className={safeNumber(sale.saldo_pendiente) > 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-medium'}>
                  {formatCurrency(sale.saldo_pendiente, sale.moneda_original)}
                </span>
              </p>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      porcentajePagado === 100 ? 'bg-green-500' : 
                      porcentajePagado > 0 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(porcentajePagado, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{porcentajePagado.toFixed(1)}% pagado</p>
              </div>
            </div>
          </div>
        </div>

        {/* Items del Pedido */}
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-800 text-sm">Items del Pedido</h4>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Producto</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700 w-24">Cant.</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700 w-32">P. Unit.</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sale.items?.length > 0 ? (
                  sale.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900">{item.producto_nombre}</div>
                          <div className="text-xs text-gray-500">{item.producto_unidad}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">{item.cantidad}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.precio_unitario, sale.moneda_original)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.total_linea, sale.moneda_original)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                      No hay items registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Historial de Abonos */}
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-800 text-sm">Historial de Abonos</h4>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            {sale.pagos?.length > 0 ? (
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Fecha</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">Monto</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Método</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Referencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sale.pagos.map((pago, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3">
                          <div className="text-xs">
                            <div className="font-medium">{formatDate(pago.fecha)}</div>
                            <div className="text-gray-500">
                              {new Date(pago.fecha).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatCurrency(pago.monto, sale.moneda_original)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {pago.metodo_pago || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {pago.referencia_pago || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">
                No hay abonos registrados
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
});
ModalDetalle.displayName = 'ModalDetalle';

const ModalAbono = memo(({ isOpen, onClose, sale, onAbonoSuccess }) => {
  const { exchangeRate } = useSalesContext();
  
  const [formAbono, setFormAbono] = useState({
    monto: '',
    metodoPago: 'efectivo',
    referenciaPago: '',
    moneda: 'USD'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && sale) {
      setFormAbono({
        monto: '',
        metodoPago: 'efectivo',
        referenciaPago: '',
        moneda: sale.moneda_original || 'USD'
      });
    }
  }, [isOpen, sale]);

  const montoNum = safeNumber(formAbono.monto);
  const saldoPendiente = safeNumber(sale?.saldo_pendiente);
  const monedaOriginal = sale?.moneda_original || 'USD';
  
  // Calcular monto en moneda original para validación
  const montoEnMonedaOriginal = useMemo(() => {
    if (formAbono.moneda === monedaOriginal) return montoNum;
    if (formAbono.moneda === 'VES' && monedaOriginal === 'USD') {
      return montoNum / exchangeRate;
    }
    if (formAbono.moneda === 'USD' && monedaOriginal === 'VES') {
      return montoNum * exchangeRate;
    }
    return montoNum;
  }, [montoNum, formAbono.moneda, monedaOriginal, exchangeRate]);

  const isValid = montoNum > 0 && 
    montoEnMonedaOriginal <= saldoPendiente &&
    (formAbono.metodoPago === 'efectivo' || formAbono.referenciaPago?.trim() !== '');

  const handleSubmit = useCallback(async () => {
    if (!isValid || !sale || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${API_URL}/ventas/${sale.id}/pagos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monto: montoEnMonedaOriginal.toFixed(2),
          monto_ves: montoEnMonedaOriginal.toFixed(2),
          metodo_pago: formAbono.metodoPago,
          referencia: formAbono.referenciaPago || null
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al procesar el abono');
      }
      
      const result = await response.json();
      onAbonoSuccess?.(result);
      onClose();
    } catch (error) {
      console.error('Error al procesar abono:', error);
      alert(error.message || 'Error al procesar el abono. Por favor, intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  }, [isValid, sale, montoEnMonedaOriginal, formAbono, onClose, onAbonoSuccess, isSubmitting]);

  if (!isOpen || !sale) return null;

  const clienteNombre = sale.cliente_nombre || 'Cliente';

  return (
    <Modal 
      isOpen={isOpen}
      onClose={onClose} 
      title="Registrar Abono"
      description={`Cliente: ${clienteNombre}`}
      maxWidth="sm"
      footer={
        <div className="flex gap-3 w-full">
          <Button variant="secondary" onClick={onClose} className="flex-1" disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit} 
            disabled={!isValid || isSubmitting}
            loading={isSubmitting}
            className="flex-1"
          >
            Confirmar Abono
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
          <p className="text-sm text-orange-700 font-medium mb-1">Saldo pendiente</p>
          <p className="text-3xl font-bold text-orange-800">
            {formatCurrency(saldoPendiente, monedaOriginal)}
          </p>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Moneda del Abono</label>
          <CurrencyToggle 
            value={formAbono.moneda} 
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
              disabled={isSubmitting}
            />
          </div>
          {montoEnMonedaOriginal > saldoPendiente && (
            <p className="text-xs text-rose-600">
              {formAbono.moneda !== monedaOriginal 
                ? `El equivalente en ${monedaOriginal} excede el saldo` 
                : 'El monto excede el saldo pendiente'
              }
            </p>
          )}
          {formAbono.moneda === 'VES' && montoNum > 0 && exchangeRate > 0 && (
            <div className="text-xs text-blue-600 font-medium space-y-1">
              <p>Equivalente en USD: {formatCurrency(montoNum / exchangeRate, 'USD')}</p>
              <p className="text-blue-500">Tasa: 1 USD = {exchangeRate.toFixed(2)} Bs</p>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Método de Pago</label>
          <PaymentMethodSelector 
            value={formAbono.metodoPago} 
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
              disabled={isSubmitting}
            />
          </div>
        )}
      </div>
    </Modal>
  );
});
ModalAbono.displayName = 'ModalAbono';

// ==========================================
// STATS PANEL
// ==========================================
const StatsPanel = memo(({ stats }) => {
  if (!stats) return null;
  
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <p className="text-sm text-gray-500 mb-1">Total Ventas</p>
        <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
      </div>
      <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
        <p className="text-sm text-emerald-700 mb-1">Total Pagado</p>
        <p className="text-2xl font-bold text-emerald-800">{formatCurrency(stats.totalPaid)}</p>
      </div>
      <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
        <p className="text-sm text-rose-700 mb-1">Por Cobrar</p>
        <p className="text-2xl font-bold text-rose-800">{formatCurrency(stats.totalPending)}</p>
      </div>
      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
        <p className="text-sm text-blue-700 mb-1">% Recaudado</p>
        <p className="text-2xl font-bold text-blue-800">{stats.paidPercentage.toFixed(1)}%</p>
      </div>
    </div>
  );
});

StatsPanel.displayName = 'StatsPanel';

const ModalEstadoCuenta = memo(({ isOpen, onClose, sales }) => {
  if (!isOpen) return null;

  // Filtrar ventas con saldo pendiente
  const cuentasPorCobrar = useMemo(() => {
    if (!sales) return [];
    return sales.filter(sale => safeNumber(sale.saldo_pendiente) > 0);
  }, [sales]);

  // Calcular totales
  const totales = useMemo(() => {
    const totalVentas = cuentasPorCobrar.reduce((sum, s) => sum + safeNumber(s.total), 0);
    const totalPagado = cuentasPorCobrar.reduce((sum, s) => sum + (safeNumber(s.total) - safeNumber(s.saldo_pendiente)), 0);
    const totalPendiente = cuentasPorCobrar.reduce((sum, s) => sum + safeNumber(s.saldo_pendiente), 0);
  // ... resto del código ...
  const stats = useMemo(() => {
    const { sales } = salesData;
    if (!sales?.length) return null;
    
    const totalSales = sales.reduce((sum, s) => sum + safeNumber(s.total), 0);
    const totalPaid = sales.reduce((sum, s) => sum + (safeNumber(s.total) - safeNumber(s.saldo_pendiente)), 0);
    const pendingImmediate = sales.filter(s => s.estado_pago === 'pendiente' && s.tipo_venta === 'inmediato');
    
    return {
      total: sales.length,
      totalAmount: totalSales,
      totalPaid,
      totalPending: totalSales - totalPaid,
      paidPercentage: totalSales > 0 ? (totalPaid / totalSales) * 100 : 0,
      pendingImmediate: pendingImmediate.length,
      pendingImmediateAmount: pendingImmediate.reduce((sum, s) => sum + safeNumber(s.total), 0)
    };
  }, [salesData.sales]);

  const filteredSales = useMemo(() => {
    const { sales } = salesData;
    if (!filters.date && !filters.type && !filters.status) return sales;
    
    return sales.filter(sale => {
      if (filters.date) {
        const saleDate = new Date(sale.fecha).toISOString().split('T')[0];
        if (saleDate !== filters.date) return false;
      }
      if (filters.type && sale.tipo_venta !== filters.type) return false;
      if (filters.status && sale.estado_pago !== filters.status) return false;
      return true;
    });
  }, [salesData.sales, filters]);

  const handleViewSale = useCallback((sale) => {
    setSelectedSale(sale);
    setModalDetalleOpen(true);
  }, []);

  const handlePaySale = useCallback((sale) => {
    setSelectedSale(sale);
    setModalAbonoOpen(true);
  }, []);

  const handleAbonoSuccess = useCallback(() => {
    salesData.refresh();
  }, [salesData.refresh]);

  const clearFilters = useCallback(() => {
    setFilters({ date: '', type: '', status: '' });
  }, []);

  const hasActiveFilters = filters.date || filters.type || filters.status;

  if (salesData.error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
        <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
        <p className="text-rose-600 font-medium text-lg mb-4">{salesData.error}</p>
        <Button onClick={salesData.refresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <SalesContext.Provider value={contextValue}>
      <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-xl">
              <ShoppingCart className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Ventas</h1>
              <p className="text-sm text-gray-500">
                {stats?.total || 0} ventas • {stats?.pendingImmediate || 0} por cobrar
                {salesData.lastUpdated && (
                  <span className="ml-2 text-gray-400">
                    • Actualizado {new Date(salesData.lastUpdated).toLocaleTimeString('es-VE', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            {stats?.pendingImmediate > 0 && (
              <Button variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                Convertir ({stats.pendingImmediate})
              </Button>
            )}
            <Button variant="secondary" onClick={() => setModalEstadoCuentaOpen(true)}>
              <TrendingUp className="w-4 h-4 mr-2" />
              Estado de Cuenta
            </Button>
            <Button onClick={() => setIsNewSaleOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Venta
            </Button>
          </div>
        </div>

        {/* Stats */}
        <StatsPanel stats={stats} />

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-gray-700">
            <Filter className="w-5 h-5" />
            <h2 className="font-semibold">Filtros</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={filters.date}
                  onChange={(e) => setFilters(f => ({ ...f, date: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
            </div>
            <select
              value={filters.type}
              onChange={(e) => setFilters(f => ({ ...f, type: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-white"
            >
              <option value="">Todos los tipos</option>
              <option value="inmediato">Inmediato</option>
              <option value="credito">Crédito</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-white"
            >
              <option value="">Todos los estados</option>
              <option value="pagado">Pagado</option>
              <option value="parcial">Parcial</option>
              <option value="pendiente">Pendiente</option>
            </select>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium px-2"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Sales List */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {salesData.loading && !salesData.sales.length ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4" />
              <p className="text-gray-600 font-medium">Cargando ventas...</p>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <Package className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium">No hay ventas registradas</p>
              {hasActiveFilters && <p className="text-sm mt-1">Intenta ajustar los filtros</p>}
            </div>
          ) : (
            <>
              <div className="lg:hidden">
                <div className="divide-y divide-gray-100">
                  {filteredSales.map(sale => (
                    <div key={sale.id} className="p-4">
                      <SaleCard 
                        sale={sale} 
                        onView={handleViewSale} 
                        onPay={handlePaySale}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="hidden lg:block">
                <SalesTable 
                  sales={filteredSales} 
                  onView={handleViewSale} 
                  onPay={handlePaySale}
                />
              </div>
            </>
          )}
        </div>

        {/* Modals */}
        <NewSaleModal 
          isOpen={isNewSaleOpen} 
          onClose={() => setIsNewSaleOpen(false)} 
        />

        <ModalDetalle 
          isOpen={modalDetalleOpen}
          onClose={() => setModalDetalleOpen(false)}
          sale={selectedSale}
          onAbonar={handlePaySale}
        />

        <ModalAbono 
          isOpen={modalAbonoOpen}
          onClose={() => setModalAbonoOpen(false)}
          sale={selectedSale}
          onAbonoSuccess={handleAbonoSuccess}
        />

        <ModalEstadoCuenta 
          isOpen={modalEstadoCuentaOpen}
          onClose={() => setModalEstadoCuentaOpen(false)}
          sales={salesData.sales}
        />
      </div>
    </SalesContext.Provider>
  );
}