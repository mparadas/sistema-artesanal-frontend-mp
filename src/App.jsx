import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, Link } from 'react-router-dom'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { LayoutDashboard, ShoppingCart, Users, Package, Factory, ClipboardList, BookOpen, BarChart2, Wallet, TrendingUp, Database, Shield, LogOut, Menu } from 'lucide-react'
import Layout from './components/Layout'
import Login from './components/Login'
import Dashboard from './pages/Dashboard'
import Ventas from './pages/Ventas'
import Clientes from './pages/Clientes'
import Productos from './pages/Productos'
import Ingredientes from './pages/Ingredientes'
import Produccion from './pages/Produccion'
import Pedidos from './pages/Pedidos'
import Catalogo from './pages/Catalogo'
import Estadisticas from './pages/Estadisticas'
import ProductosDisponibles from './pages/ProductosDisponibles'
import Financiero from './pages/Financiero'
import Auditoria from './pages/Auditoria'
import Auditoria_simple from './pages/Auditoria_simple'
import TasasCambio from './pages/TasasCambio'
import ListaPrecios from './pages/ListaPrecios'
import Usuarios from './pages/Usuarios'
import TestErroresConexion from './components/TestErroresConexion'
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
