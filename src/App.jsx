// Backup del archivo App.jsx
import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  Factory, LogOut, Menu, X, BarChart2, Shield, Eye, EyeOff, ClipboardList,
  TrendingUp, Database, BookOpen, KeyRound, Wallet
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
              src="/IMG_9805.png"
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
                src="/IMG_9805.png"
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
// COMPONENTE LOGIN REAL
// ============================================
function Login({ onLogin }) {
  const navigate = useNavigate()
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [verPass, setVerPass] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [loginExpandido, setLoginExpandido] = useState(false)

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
      // Guardar sesión
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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-orange-100 via-amber-50 to-white p-4 sm:p-6">
      <div className="absolute -top-24 -left-20 w-72 h-72 bg-orange-300/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-80 h-80 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <img
          src="/IMG_9805.png"
          alt="Marca de agua AgroMAE"
          className="w-[70vw] max-w-[760px] opacity-[0.08] object-contain bg-transparent"
          style={{ mixBlendMode: 'darken', backgroundColor: 'transparent' }}
        />
      </div>

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <img
              src="/IMG_9805.png"
              alt="AgroMAE"
              className="h-16 sm:h-20 w-auto object-contain mb-3 bg-transparent"
              style={{ mixBlendMode: 'darken', backgroundColor: 'transparent' }}
            />
            <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-800 leading-tight tracking-tight">
              Sabor artesanal <span className="text-orange-600">que conecta tradición</span> y tecnología
            </h1>
            <p className="text-gray-600 mt-3 max-w-2xl text-base sm:text-lg">
              AgroMAE integra producción, inventario, ventas y pedidos para impulsar el crecimiento
              de un negocio artesanal con procesos modernos.
            </p>
          </div>

          <div className={`bg-white/95 backdrop-blur p-5 sm:p-6 rounded-2xl shadow-2xl w-full lg:sticky lg:top-6 border border-orange-100 transition-all duration-300 ${loginExpandido ? 'lg:w-[390px]' : 'lg:w-[300px]'}`}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-gray-500 text-sm">Acceso al sistema</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <button
                type="button"
                onClick={() => setLoginExpandido((prev) => !prev)}
                className="group rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 transition-colors p-3 flex flex-col items-center justify-center"
              >
                <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-orange-100 flex items-center justify-center">
                  <KeyRound className="w-6 h-6 text-orange-700" />
                </div>
                <span className="mt-2 text-xs font-semibold text-orange-700">
                  {loginExpandido ? 'Cerrar Login' : 'Abrir Login'}
                </span>
              </button>

              <Link
                to="/catalogo-publico"
                className="group rounded-xl border border-amber-300 bg-gradient-to-br from-amber-100 to-orange-100 hover:from-amber-200 hover:to-orange-200 transition-colors p-3 flex flex-col items-center justify-center"
              >
                <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-amber-200 flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-orange-700" />
                </div>
                <span className="mt-2 text-xs font-semibold text-orange-700">Catálogo</span>
              </Link>
            </div>

            <div className={`overflow-hidden transition-all duration-300 ${loginExpandido ? 'max-h-[520px] mt-4 opacity-100' : 'max-h-0 mt-0 opacity-0'}`}>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                <input
                  type="text"
                  value={usuario}
                  onChange={e => setUsuario(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                  placeholder="Ej: admin"
                  autoComplete="username"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contrasena</label>
                <div className="relative">
                  <input
                    type={verPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2.5 pr-10 focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setVerPass(!verPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {verPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>
              )}

              <button
                type="submit"
                disabled={cargando}
                className="w-full bg-gradient-to-r from-orange-600 to-amber-500 text-white py-2.5 rounded-lg hover:from-orange-700 hover:to-amber-600 font-medium disabled:opacity-60 transition-all shadow-md"
              >
                {cargando ? 'Ingresando...' : 'Ingresar'}
              </button>
            </form>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/95 rounded-2xl border border-orange-100 p-5 shadow-sm">
            <h2 className="text-xl font-bold text-orange-700 mb-2">Mision</h2>
            <p className="text-gray-600">
              Ofrecer productos artesanales frescos y de alta calidad, gestionando cada etapa con
              eficiencia para brindar una experiencia confiable a clientes y aliados.
            </p>
          </div>
          <div className="bg-white/95 rounded-2xl border border-orange-100 p-5 shadow-sm">
            <h2 className="text-xl font-bold text-orange-700 mb-2">Vision</h2>
            <p className="text-gray-600">
              Ser referencia regional en produccion y comercializacion artesanal, combinando
              tradicion, tecnologia y servicio para crecer de forma sostenible.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
            <img src="https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=1200&q=80" alt="Producto artesanal 1" className="w-full h-44 object-cover" />
            <div className="p-4">
              <p className="font-semibold text-gray-800">Embutidos artesanales</p>
              <p className="text-sm text-gray-500 mt-1">Proceso tradicional con estandares modernos.</p>
            </div>
          </div>
          <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
            <img src="https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=1200&q=80" alt="Producto artesanal 2" className="w-full h-44 object-cover" />
            <div className="p-4">
              <p className="font-semibold text-gray-800">Control de calidad</p>
              <p className="text-sm text-gray-500 mt-1">Trazabilidad de inventario y produccion diaria.</p>
            </div>
          </div>
          <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
            <img src="https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=1200&q=80" alt="Producto artesanal 3" className="w-full h-44 object-cover" />
            <div className="p-4">
              <p className="font-semibold text-gray-800">Atencion al cliente</p>
              <p className="text-sm text-gray-500 mt-1">Pedidos faciles, seguimiento y respuesta oportuna.</p>
            </div>
          </div>
        </div>
      </div>
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
