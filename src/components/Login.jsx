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
  const [loginExpandido, setLoginExpandido] = useState(true)

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!usuario || !password) { 
      setError('Por favor, ingresa usuario y contraseña'); 
      return 
    }
    setCargando(true)
    setError('')
    
    try {
      // Try multiple API URLs
      for (const apiUrl of API_URLS) {
        try {
          const r = await fetch(`${apiUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario: usuario.trim(), password })
          })
          
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
          console.log(`Intentando con ${apiUrl}...`)
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
      
      {/* Esferas decorativas */}
      <div className="absolute -top-32 -left-24 w-96 h-96 bg-gradient-to-br from-orange-200/30 to-amber-200/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute top-1/2 -right-32 w-[500px] h-[500px] bg-gradient-to-br from-amber-200/25 to-yellow-200/15 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-gradient-to-br from-orange-100/40 to-transparent rounded-full blur-2xl animate-pulse delay-500" />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            
            {/* Sección Izquierda - Información de la empresa */}
            <div className="text-center lg:text-left space-y-6 lg:space-y-8">
              {/* Logo */}
              <div className="flex justify-center lg:justify-start">
                <img
                  src="/agromae_transparent.png"
                  alt="AgroMAE"
                  className="h-20 sm:h-28 w-auto object-contain drop-shadow-lg"
                />
              </div>

              {/* Título principal */}
              <div className="space-y-4">
                <div className="flex items-center justify-center lg:justify-start gap-2">
                  <Sparkles className="w-6 h-6 text-orange-500 animate-pulse" />
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent leading-tight">
                    Sabor artesanal
                  </h1>
                  <Sparkles className="w-6 h-6 text-amber-500 animate-pulse delay-300" />
                </div>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-700 leading-tight">
                  que conecta <span className="text-orange-600 font-bold">tradición</span> y{' '}
                  <span className="text-amber-600 font-bold">frescura del campo</span>
                </p>
                <p className="text-xl lg:text-2xl text-gray-600 font-medium">
                  en casa
                </p>
              </div>

              {/* Descripción */}
              <div className="space-y-3 max-w-2xl mx-auto lg:mx-0">
                <p className="text-gray-600 text-lg leading-relaxed">
                  AgroMAE integra producción, inventario, ventas y pedidos para impulsar el crecimiento
                  de un negocio artesanal con procesos modernos.
                </p>
                <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm font-medium">
                    🌱 Tradición Artesanal
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-medium">
                    🥓 Calidad Superior
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                    🏡 Fresca del Campo
                  </span>
                </div>
              </div>

              {/* Misión y Visión */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto lg:mx-0">
                <div className="bg-white/80 backdrop-blur p-4 rounded-2xl border border-orange-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <h3 className="text-lg font-bold text-orange-700 mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                    Misión
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    En nuestra finca criamos con respeto y dedicación, convencidos de que la calidad comienza desde el origen. Elaboramos embutidos artesanales naturales cuidando cada detalle: la alimentación y bienestar de nuestros animales, la frescura de la carne, la selección de especias y condimentos naturales, y un proceso hecho con paciencia y pasión.
                  </p>
                  <p className="text-gray-600 text-sm leading-relaxed mt-2">
                    Empacamos al vacío para conservar intacto el sabor y la calidad, llevando a cada hogar un producto auténtico, saludable y lleno de tradición.
                  </p>
                </div>
                <div className="bg-white/80 backdrop-blur p-4 rounded-2xl border border-amber-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <h3 className="text-lg font-bold text-amber-700 mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    🟢 Visión
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Queremos ser más que una marca: aspiramos a convertirnos en una tradición en la mesa de nuestros clientes. Soñamos con crecer manteniendo nuestra esencia artesanal, el respeto por la naturaleza y el compromiso con la excelencia.
                  </p>
                  <p className="text-gray-600 text-sm leading-relaxed mt-2">
                    Buscamos que cada embutido que elaboramos sea sinónimo de confianza, frescura y amor por lo que hacemos, fortaleciendo el vínculo entre el campo y la familia.
                  </p>
                </div>
              </div>
            </div>

            {/* Sección Derecha - Formulario de Login */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-md">
                <div className="bg-white/95 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-orange-100 hover:shadow-3xl transition-all duration-300">
                  
                  {/* Header del login */}
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl shadow-lg mb-4">
                      <KeyRound className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                      Acceso al Sistema
                    </h2>
                    <p className="text-gray-500 text-sm">
                      Ingresa tus credenciales para continuar
                    </p>
                  </div>

                  {/* Formulario */}
                  <form onSubmit={handleLogin} className="space-y-5">
                    {/* Campo Usuario */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <User className="w-4 h-4 text-orange-500" />
                        Usuario
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={usuario}
                          onChange={e => setUsuario(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all duration-200 bg-gray-50/50 hover:bg-white"
                          placeholder="Ej: admin"
                          autoComplete="username"
                          autoFocus
                        />
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                    </div>

                    {/* Campo Contraseña */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Lock className="w-4 h-4 text-orange-500" />
                        Contraseña
                      </label>
                      <div className="relative">
                        <input
                          type={verPass ? 'text' : 'password'}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all duration-200 bg-gray-50/50 hover:bg-white"
                          placeholder="••••••••"
                          autoComplete="current-password"
                        />
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <button 
                          type="button" 
                          onClick={() => setVerPass(!verPass)} 
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors"
                        >
                          {verPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Mensaje de error */}
                    {error && (
                      <div className="bg-red-50 border-2 border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2 animate-pulse">
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                        {error}
                      </div>
                    )}

                    {/* Botón de ingreso */}
                    <button
                      type="submit"
                      disabled={cargando}
                      className="w-full bg-gradient-to-r from-orange-600 to-amber-500 text-white py-3.5 rounded-xl font-semibold hover:from-orange-700 hover:to-amber-600 disabled:opacity-60 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
                    >
                      {cargando ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Ingresando...
                        </>
                      ) : (
                        <>
                          Ingresar al Sistema
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Footer del login */}
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link
                        to="/catalogo-publico"
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-100 to-orange-100 hover:from-amber-200 hover:to-orange-200 text-orange-700 rounded-xl font-medium transition-all duration-200 group"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Ver Catálogo
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                    <p className="text-center text-xs text-gray-400 mt-4">
                      © 2026 AgroMAE - Sabor artesanal con tradición
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
