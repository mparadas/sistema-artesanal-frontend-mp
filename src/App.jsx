// Backup del archivo App.jsx
import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  Factory, LogOut, Menu, X, BarChart2, Shield, Eye, EyeOff, ClipboardList,
  TrendingUp, Database, BookOpen, KeyRound, Wallet, AlertCircle, ArrowRight
} from 'lucide-react'

// Páginas
import Dashboard from './pages/Dashboard'
import Productos from './pages/Productos'
import Ventas from './pages/Ventas'
import Clientes from './pages/Clientes'
import Produccion from './pages/Produccion'
import Ingredientes from './pages/Ingredientes'
import Estadisticas from './pages/Estadisticas'
import Usuarios from './pages/Usuarios'
import Pedidos from './pages/Pedidos'
import TasasCambio from './pages/TasasCambio'
import Auditoria from './pages/Auditoria'
import Catalogo from './pages/Catalogo'
import Financiero from './pages/Financiero'
import ProductosDisponibles from './pages/ProductosDisponibles'
import ListaPrecios from './pages/ListaPrecios'
import API_URL from './config'

// Permisos por rol
const PERMISOS = {
  admin:      ['/', '/ventas', '/clientes', '/productos', '/ingredientes', '/produccion', '/estadisticas', '/usuarios', '/pedidos', '/catalogo', '/tasas-cambio', '/auditoria', '/financiero', '/productos-disponibles', '/lista-precios'],
  vendedor:   ['/', '/ventas', '/clientes', '/estadisticas', '/pedidos', '/catalogo', '/tasas-cambio', '/productos-disponibles', '/lista-precios'],
  produccion: ['/', '/ingredientes', '/produccion', '/estadisticas', '/pedidos', '/catalogo', '/tasas-cambio', '/productos-disponibles', '/lista-precios'],
  viewer:     ['/', '/estadisticas', '/tasas-cambio', '/productos-disponibles', '/lista-precios'],
  mparadas:   ['/', '/auditoria'],
}

const tieneAcceso = (rol, path) => {
  const perms = PERMISOS[rol] || []
  return perms.includes(path)
}

// ============================================
// COMPONENTE LAYOUT
// ============================================
function Layout({ children, usuario, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const todosMenuItems = [
    { path: '/',             icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/ventas',       icon: ShoppingCart,    label: 'Ventas' },
    { path: '/clientes',     icon: Users,           label: 'Clientes' },
    { path: '/productos',    icon: Package,         label: 'Productos' },
    { path: '/ingredientes', icon: Package,         label: 'Ingredientes' },
    { path: '/produccion',   icon: Factory,         label: 'Producción' },
    { path: '/pedidos',      icon: ClipboardList,   label: 'Pedidos' },
    { path: '/catalogo',     icon: BookOpen,        label: 'Catálogo' },
    { path: '/estadisticas', icon: BarChart2,       label: 'Estadísticas' },
    { path: '/productos-disponibles', icon: Package, label: 'Disponibles' },
    { path: '/financiero',   icon: Wallet,          label: 'Financiero', soloAdmin: true },
    { path: '/tasas-cambio', icon: TrendingUp,      label: 'Tasa de Cambio', roles: ['admin', 'gerente'] },
    { path: '/auditoria',    icon: Database,         label: 'Auditoría', roles: ['admin', 'mparadas'] },
    { path: '/usuarios',     icon: Shield,          label: 'Usuarios', soloAdmin: true },
  ]

  const menuItems = todosMenuItems.filter(item =>
    tieneAcceso(usuario?.rol, item.path)
  )

  const handleLogout = () => {
    onLogout()
    navigate('/login')
  }

  const rolColors = {
    admin: 'bg-red-100 text-red-700',
    vendedor: 'bg-blue-100 text-blue-700',
    produccion: 'bg-green-100 text-green-700',
    viewer: 'bg-gray-100 text-gray-600',
    mparadas: 'bg-purple-100 text-purple-700',
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-full flex flex-col">
          <div className="p-4 border-b bg-transparent flex items-center justify-center">
            <img
              src="/agromae_transparent.png"
              alt="AgroMAE"
              className="h-14 w-auto object-contain bg-transparent"
              style={{ mixBlendMode: 'darken', backgroundColor: 'transparent' }}
            />
          </div>

          {/* Info usuario */}
          <div className="px-4 py-2 border-b bg-gray-50">
            <p className="text-sm font-medium text-gray-800 truncate">{usuario?.nombre}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rolColors[usuario?.rol] || 'bg-gray-100 text-gray-600'}`}>
              {usuario?.rol === 'admin' ? 'Administrador' :
               usuario?.rol === 'vendedor' ? 'Vendedor' :
               usuario?.rol === 'produccion' ? 'Producción' :
               usuario?.rol === 'mparadas' ? 'Auditoría' :
               'Solo lectura'}
            </span>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive ? 'bg-orange-50 text-orange-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white shadow-sm lg:hidden">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100">
                <Menu className="w-6 h-6" />
              </button>
              <img
                src="/agromae_transparent.png"
                alt="AgroMAE"
                className="ml-3 h-8 w-auto object-contain bg-transparent"
                style={{ mixBlendMode: 'darken', backgroundColor: 'transparent' }}
              />
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${rolColors[usuario?.rol] || ''}`}>
              {usuario?.nombre?.split(' ')[0]}
            </span>
          </div>
        </header>

        <main className="flex-1 p-2 sm:p-4 lg:p-6 overflow-auto pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          {children}
        </main>
      </div>
    </div>
  )
}

// ============================================
// COMPONENTE LOGIN REAL - DISEÑO MODERNO
// ============================================
function Login({ onLogin }) {
  const navigate = useNavigate()
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [verPass, setVerPass] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [mostrarLogin, setMostrarLogin] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!usuario || !password) { setError('Ingresa usuario y contraseña'); return }
    setCargando(true)
    setError('')
    try {
      const r = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: usuario.trim(), password })
      })
      const data = await r.json()
      if (!r.ok) { setError(data.error || 'Error al iniciar sesión'); return }
      localStorage.setItem('token', data.token)
      localStorage.setItem('usuario', JSON.stringify(data))
      onLogin(data)
      navigate('/')
    } catch {
      setError('No se pudo conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] relative overflow-hidden">
      {/* Modal de Login */}
      {mostrarLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMostrarLogin(false)} />
          <div className="relative bg-[#FAF8F5] rounded-2xl shadow-2xl w-full max-w-md p-8 sm:p-10 animate-[fadeInUp_0.3s_ease-out]">
            <button
              onClick={() => setMostrarLogin(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-200 transition-colors"
            >
              <X className="w-5 h-5 text-stone-500" />
            </button>

            <div className="text-center mb-8">
              <img
                src="/agromae_transparent.png"
                alt="AgroMAE"
                className="h-12 w-auto object-contain mx-auto mb-4"
                style={{ mixBlendMode: 'darken' }}
              />
              <h2 className="text-2xl font-bold text-stone-900 tracking-tight">Acceso al Sistema</h2>
              <p className="text-stone-500 text-sm mt-1">Ingresa tus credenciales para continuar</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">Usuario</label>
                <input
                  type="text"
                  value={usuario}
                  onChange={e => setUsuario(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:border-amber-600 transition-all"
                  placeholder="Ej: admin"
                  autoComplete="username"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">{'Contraseña'}</label>
                <div className="relative">
                  <input
                    type={verPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 pr-12 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:border-amber-600 transition-all"
                    placeholder={'••••••••'}
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setVerPass(!verPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors">
                    {verPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={cargando}
                className="w-full bg-stone-900 text-white py-3.5 rounded-xl hover:bg-stone-800 font-semibold disabled:opacity-50 transition-all text-sm tracking-wide"
              >
                {cargando ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Ingresando...
                  </span>
                ) : 'Iniciar Sesión'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className="relative z-10 px-6 sm:px-10 lg:px-16 py-5 flex items-center justify-between">
        <img
          src="/agromae_transparent.png"
          alt="AgroMAE"
          className="h-10 sm:h-12 w-auto object-contain"
          style={{ mixBlendMode: 'darken' }}
        />
        <div className="flex items-center gap-3">
          <Link
            to="/catalogo-publico"
            className="hidden sm:flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors px-4 py-2 rounded-lg hover:bg-stone-100"
          >
            <BookOpen className="w-4 h-4" />
            {'Catálogo'}
          </Link>
          <button
            onClick={() => setMostrarLogin(true)}
            className="flex items-center gap-2 bg-stone-900 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-stone-800 transition-all shadow-sm"
          >
            <KeyRound className="w-4 h-4" />
            Acceder
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 sm:px-10 lg:px-16 pt-8 sm:pt-16 pb-16 sm:pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200/60 text-amber-800 text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-amber-600 rounded-full" />
              Del campo a tu mesa
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-stone-900 leading-[1.05] tracking-tight text-balance">
              {'Sabor artesanal que conecta tradición y frescura'}
            </h1>
            <p className="text-stone-500 mt-6 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              {'AgroMAE integra producción, inventario, ventas y pedidos para impulsar el crecimiento de un negocio artesanal con procesos modernos.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
              <button
                onClick={() => setMostrarLogin(true)}
                className="flex items-center gap-2 bg-stone-900 text-white font-semibold px-8 py-3.5 rounded-full hover:bg-stone-800 transition-all shadow-lg shadow-stone-900/10 text-sm"
              >
                Acceder al Sistema
                <ArrowRight className="w-4 h-4" />
              </button>
              <Link
                to="/catalogo-publico"
                className="flex items-center gap-2 bg-white text-stone-700 font-semibold px-8 py-3.5 rounded-full hover:bg-stone-50 transition-all border border-stone-200 text-sm"
              >
                <ShoppingCart className="w-4 h-4" />
                Ver {'Catálogo'}
              </Link>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl shadow-stone-900/10 aspect-[16/7] max-w-5xl mx-auto">
            <img
              src="/hero-artesanal.jpg"
              alt="Embutidos artesanales AgroMAE"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900/40 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      {/* Misión y Visión */}
      <section className="px-6 sm:px-10 lg:px-16 pb-16 sm:pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700 mb-3">Nuestro compromiso</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight text-balance">{'Tradición con propósito'}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/60 hover:border-stone-300 transition-colors group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100">
                  <span className="text-2xl font-bold text-amber-700">1</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-stone-900">{'Misión'}</h3>
              </div>
              <p className="text-stone-500 leading-relaxed text-sm sm:text-base">
                {'En nuestra finca criamos con respeto y dedicación, convencidos de que la calidad comienza desde el origen. Elaboramos embutidos artesanales naturales cuidando cada detalle: la alimentación y bienestar de nuestros animales, la frescura de la carne, la selección de especias y condimentos naturales, y un proceso hecho con paciencia y pasión.'}
              </p>
              <p className="text-stone-500 leading-relaxed text-sm sm:text-base mt-3">
                {'Empacamos al vacío para conservar intacto el sabor y la calidad, llevando a cada hogar un producto auténtico, saludable y lleno de tradición.'}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/60 hover:border-stone-300 transition-colors group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100">
                  <span className="text-2xl font-bold text-amber-700">2</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-stone-900">{'Visión'}</h3>
              </div>
              <p className="text-stone-500 leading-relaxed text-sm sm:text-base">
                {'Queremos ser más que una marca: aspiramos a convertirnos en una tradición en la mesa de nuestros clientes. Soñamos con crecer manteniendo nuestra esencia artesanal, el respeto por la naturaleza y el compromiso con la excelencia.'}
              </p>
              <p className="text-stone-500 leading-relaxed text-sm sm:text-base mt-3">
                {'Buscamos que cada embutido que elaboramos sea sinónimo de confianza, frescura y amor por lo que hacemos, fortaleciendo el vínculo entre el campo y la familia.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Productos / Features */}
      <section className="px-6 sm:px-10 lg:px-16 pb-16 sm:pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700 mb-3">Lo que nos distingue</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight text-balance">{'Calidad en cada paso'}</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                img: '/producto-embutidos.jpg',
                title: 'Embutidos artesanales',
                desc: 'Proceso tradicional con estándares modernos de calidad y frescura garantizada.',
              },
              {
                img: '/producto-calidad.jpg',
                title: 'Control de calidad',
                desc: 'Trazabilidad completa del inventario y supervisión de la producción diaria.',
              },
              {
                img: '/producto-delivery.jpg',
                title: 'Atención al cliente',
                desc: 'Pedidos fáciles, seguimiento en tiempo real y respuesta oportuna garantizada.',
              },
            ].map((item, i) => (
              <div key={i} className="group bg-white rounded-2xl overflow-hidden border border-stone-200/60 hover:border-stone-300 hover:shadow-lg transition-all duration-300">
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5 sm:p-6">
                  <h3 className="font-bold text-stone-900 text-base sm:text-lg">{item.title}</h3>
                  <p className="text-stone-500 text-sm mt-2 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="px-6 sm:px-10 lg:px-16 pb-12 sm:pb-20">
        <div className="max-w-4xl mx-auto text-center bg-stone-900 rounded-2xl sm:rounded-3xl p-8 sm:p-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight text-balance">{'¿Listo para gestionar tu negocio artesanal?'}</h2>
          <p className="text-stone-400 mt-3 text-sm sm:text-base max-w-xl mx-auto">
            {'Accede al sistema integrado de AgroMAE y lleva tu producción al siguiente nivel.'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <button
              onClick={() => setMostrarLogin(true)}
              className="flex items-center gap-2 bg-white text-stone-900 font-semibold px-8 py-3.5 rounded-full hover:bg-stone-100 transition-all text-sm"
            >
              Iniciar Sesión
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              to="/catalogo-publico"
              className="flex items-center gap-2 text-stone-400 font-medium hover:text-white transition-colors text-sm px-4 py-3"
            >
              <ShoppingCart className="w-4 h-4" />
              Explorar {'Catálogo'}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 sm:px-10 lg:px-16 py-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <img
          src="/agromae_transparent.png"
          alt="AgroMAE"
          className="h-7 w-auto object-contain opacity-60"
          style={{ mixBlendMode: 'darken' }}
        />
        <p className="text-xs text-stone-400">{'AgroMAE — Sabor artesanal, del campo a tu mesa.'}</p>
      </footer>
    </div>
  )
}

// ============================================
// RUTA PROTEGIDA
// ============================================
function RutaProtegida({ usuario, rol, path, children }) {
  console.log('RutaProtegida:', { usuario: usuario?.nombre, rol: usuario?.rol, path })
  if (!usuario) return <Navigate to="/login" replace />
  if (!tieneAcceso(usuario.rol, path)) {
    console.log('Acceso denegado:', { rol: usuario.rol, path, permisos: PERMISOS[usuario.rol] })
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Shield className="w-12 h-12 text-gray-300 mb-3" />
        <p className="text-gray-500 font-medium">Acceso restringido</p>
        <p className="text-gray-400 text-sm mt-1">No tienes permiso para ver esta sección</p>
      </div>
    )
  }
  console.log('Acceso permitido, renderizando componente')
  return children
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
function App() {
  const [usuario, setUsuario] = useState(() => {
    try { return JSON.parse(localStorage.getItem('usuario') || 'null') } catch { return null }
  })

  const handleLogin = (data) => setUsuario(data)
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    setUsuario(null)
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/catalogo-publico" element={<Catalogo />} />
        <Route path="/login" element={
          usuario ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />
        } />
        <Route path="*" element={
          !usuario ? <Navigate to="/login" replace /> : (
            <Layout usuario={usuario} onLogout={handleLogout}>
              <Routes>
                <Route path="/"             element={<RutaProtegida usuario={usuario} path="/"><Dashboard /></RutaProtegida>} />
                <Route path="/ventas"       element={<RutaProtegida usuario={usuario} path="/ventas"><Ventas /></RutaProtegida>} />
                <Route path="/clientes"     element={<RutaProtegida usuario={usuario} path="/clientes"><Clientes /></RutaProtegida>} />
                <Route path="/productos"    element={<RutaProtegida usuario={usuario} path="/productos"><Productos /></RutaProtegida>} />
                <Route path="/ingredientes" element={<RutaProtegida usuario={usuario} path="/ingredientes"><Ingredientes /></RutaProtegida>} />
                <Route path="/produccion"   element={<RutaProtegida usuario={usuario} path="/produccion"><Produccion /></RutaProtegida>} />
                <Route path="/pedidos"      element={<RutaProtegida usuario={usuario} path="/pedidos"><Pedidos /></RutaProtegida>} />
                <Route path="/catalogo"     element={<RutaProtegida usuario={usuario} path="/catalogo"><Catalogo /></RutaProtegida>} />
                <Route path="/estadisticas" element={<RutaProtegida usuario={usuario} path="/estadisticas"><Estadisticas /></RutaProtegida>} />
                <Route path="/productos-disponibles" element={<RutaProtegida usuario={usuario} path="/productos-disponibles"><ProductosDisponibles /></RutaProtegida>} />
                <Route path="/financiero"   element={<RutaProtegida usuario={usuario} path="/financiero"><Financiero /></RutaProtegida>} />
                <Route path="/tasas-cambio" element={<RutaProtegida usuario={usuario} path="/tasas-cambio"><TasasCambio /></RutaProtegida>} />
                <Route path="/auditoria"    element={<RutaProtegida usuario={usuario} path="/auditoria"><Auditoria /></RutaProtegida>} />
                <Route path="/usuarios"     element={<RutaProtegida usuario={usuario} path="/usuarios"><Usuarios /></RutaProtegida>} />
                <Route path="/lista-precios" element={<RutaProtegida usuario={usuario} path="/lista-precios"><ListaPrecios /></RutaProtegida>} />
              </Routes>
            </Layout>
          )
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
