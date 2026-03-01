import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { KeyRound, ShoppingCart, Eye, EyeOff, User, Lock, ArrowRight, Sparkles } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'https://agromae-b.onrender.com/api'

const API_URLS = [
  'https://agromae-b.onrender.com/api',
  'http://localhost:3001/api',
  'https://agromae-backend.onrender.com/api'
]

// ============================================
// COMPONENTE LOGIN MEJORADO
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
    if (!usuario || !password) { 
      setError('Por favor, ingresa usuario y contraseña'); 
      return 
    }
    setCargando(true)
    setError('')
    
    try {
      // Configurar timeout de 8 segundos por intento
      const TIMEOUT = 8000 // 8 segundos en lugar de 30
      
      // Try multiple API URLs con timeout personalizado
      for (const apiUrl of API_URLS) {
        try {
          console.log(`Intentando con ${apiUrl}...`)
          
          // Crear Promise con timeout
          const fetchPromise = fetch(`${apiUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario: usuario.trim(), password })
          })
          
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout')), TIMEOUT)
          })
          
          // Race entre fetch y timeout
          const r = await Promise.race([fetchPromise, timeoutPromise])
          
          if (r.ok) {
            const data = await r.json()
            // Guardar sesión
            localStorage.setItem('token', data.token)
            localStorage.setItem('usuario', JSON.stringify(data))
            onLogin(data)
            navigate('/')
            return
          } else {
            const data = await r.json()
            setError(data.error || 'Error al iniciar sesión')
            return
          }
        } catch (error) {
          console.log(`Error con ${apiUrl}: ${error.message}`)
          if (error.message === 'Timeout') {
            console.log(`Timeout de ${TIMEOUT/1000}s para ${apiUrl}`)
          }
          continue // Try next URL
        }
      }
      
      // If all URLs failed
      setError('No se pudo conectar con el servidor. Por favor, verifica tu conexión o intenta más tarde.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 bg-[url('/IMG_9805.png')] bg-center bg-no-repeat bg-contain opacity-[0.03]" />
      
      {/* Hero Section con imagen de fondo atractiva */}
      <div className="relative min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 overflow-hidden">
        {/* Imagen de fondo con overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 via-amber-600/20 to-yellow-600/20">
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f97316' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>
        
        {/* Contenido principal */}
        <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
          <div className="max-w-7xl mx-auto w-full">
            {/* Layout responsivo: móvil vertical, PC horizontal */}
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">
              
              {/* Sección Izquierda - Contenido atractivo (siempre visible) */}
              <div className="w-full lg:w-1/2 text-center space-y-6">
                {/* Badge animado */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-100 to-amber-100 rounded-full border border-orange-200 shadow-lg">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                  <span className="text-orange-700 font-semibold text-xs sm:text-sm">🌟 Bienvenidos a AgroMAE</span>
                </div>
                
                {/* Título principal - ajustado para móvil */}
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 animate-pulse" />
                    <h1 className="text-3xl sm:text-4xl lg:text-6xl xl:text-7xl font-bold bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent leading-tight">
                      Sabor artesanal
                    </h1>
                    <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500 animate-pulse delay-300" />
                  </div>
                  <p className="text-lg sm:text-xl lg:text-3xl xl:text-4xl font-semibold text-gray-700 leading-tight px-2">
                    que conecta <span className="text-orange-600 font-bold">tradición</span> y{' '}
                    <span className="text-amber-600 font-bold">frescura del campo</span> en casa
                  </p>
                </div>
                
                {/* Botones de acción principales - optimizados para móvil */}
                <div className="flex flex-col gap-3 px-4">
                  <button
                    onClick={() => setLoginExpandido(true)}
                    className="group relative px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-orange-600 to-amber-500 text-white rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-700 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-center justify-center gap-2 sm:gap-3">
                      <KeyRound className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Iniciar Sesión</span>
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                  
                  <Link
                    to="/catalogo-publico"
                    className="group relative px-6 py-3 sm:px-8 sm:py-4 bg-white/90 backdrop-blur text-orange-700 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-orange-200 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-50 to-amber-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-center justify-center gap-2 sm:gap-3">
                      <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Ver Catálogo</span>
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                </div>
                
                {/* Descripción mejorada - responsive */}
                <div className="space-y-3 px-4 max-w-lg mx-auto">
                  <p className="text-gray-600 text-sm sm:text-base lg:text-lg leading-relaxed">
                    🌱 AgroMAE integra producción, inventario, ventas y pedidos para impulsar el crecimiento
                    de un negocio artesanal con procesos modernos.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 font-medium text-xs sm:text-sm shadow-md">
                      🥩 Productos Frescos
                    </span>
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 font-medium text-xs sm:text-sm shadow-md">
                      🏺 Artesanal
                    </span>
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-green-100 text-green-700 font-medium text-xs sm:text-sm shadow-md">
                      🌿 Natural
                    </span>
                  </div>
                </div>
              </div>

              {/* Sección Derecha - Login (condicional) */}
              {loginExpandido && (
                <div className="w-full lg:w-1/2 flex justify-center">
                  <div className="w-full max-w-md">
                    <div className="bg-white/95 backdrop-blur-xl p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl border border-orange-100 hover:shadow-3xl transition-all duration-300">
                      
                      {/* Header del login */}
                      <div className="text-center mb-6 sm:mb-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl sm:rounded-2xl shadow-lg mb-3 sm:mb-4">
                          <KeyRound className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                          Acceso al Sistema
                        </h2>
                        <p className="text-gray-500 text-xs sm:text-sm">
                          Ingresa tus credenciales para continuar
                        </p>
                      </div>

                      {/* Formulario */}
                      <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
                        {/* Campo Usuario */}
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700">
                            <User className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" />
                            Usuario
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={usuario}
                              onChange={e => setUsuario(e.target.value)}
                              className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all duration-200 bg-gray-50/50 hover:bg-white text-sm sm:text-base"
                              placeholder="Ej: admin"
                              autoComplete="username"
                              autoFocus
                            />
                            <User className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                          </div>
                        </div>

                        {/* Campo Contraseña */}
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700">
                            <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" />
                            Contraseña
                          </label>
                          <div className="relative">
                            <input
                              type={verPass ? 'text' : 'password'}
                              value={password}
                              onChange={e => setPassword(e.target.value)}
                              className="w-full pl-8 sm:pl-10 pr-10 sm:pr-12 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all duration-200 bg-gray-50/50 hover:bg-white text-sm sm:text-base"
                              placeholder="••••••••"
                              autoComplete="current-password"
                            />
                            <Lock className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                            <button 
                              type="button" 
                              onClick={() => setVerPass(!verPass)} 
                              className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors"
                            >
                              {verPass ? <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" /> : <Eye className="w-3 h-3 sm:w-4 sm:h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Mensaje de error */}
                        {error && (
                          <div className="bg-red-50 border-2 border-red-200 text-red-700 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl flex items-center gap-2 animate-pulse">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full" />
                            {error}
                          </div>
                        )}

                        {/* Botón de ingreso */}
                        <button
                          type="submit"
                          disabled={cargando}
                          className="w-full bg-gradient-to-r from-orange-600 to-amber-500 text-white py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl font-semibold hover:from-orange-700 hover:to-amber-600 disabled:opacity-60 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group text-sm sm:text-base"
                        >
                          {cargando ? (
                            <>
                              <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Ingresando...
                            </>
                          ) : (
                            <>
                              Ingresar al Sistema
                              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </button>
                      </form>

                      {/* Footer del login */}
                      <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-100">
                        <button
                          onClick={() => setLoginExpandido(false)}
                          className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg sm:rounded-xl font-medium transition-all duration-200 text-xs sm:text-sm"
                        >
                          ← Volver a opciones
                        </button>
                        <p className="text-center text-xs text-gray-400 mt-3 sm:mt-4">
                          © 2026 AgroMAE - Sabor artesanal con tradición
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
  )
}

export default Login
