// Configuración de la API
// Detectar si estamos en desarrollo o producción
const isDevelopment = process.env.NODE_ENV === 'development'
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
const isRenderProduction = window.location.hostname.includes('onrender.com')

// Configuración para desarrollo y producción
let API_BASE_URL

if (isDevelopment && isLocalhost) {
  // Desarrollo en localhost - backend en puerto 10000
  API_BASE_URL = 'http://localhost:10000/api'
} else if (isRenderProduction && window.location.hostname.includes('agromae-b')) {
  // Frontend en Render (agromae-b) - backend en agromae
  API_BASE_URL = 'https://agromae.onrender.com/api'
} else if (isRenderProduction) {
  // Backend en Render - frontend local
  API_BASE_URL = 'https://agromae.onrender.com/api'
} else {
  // Producción o red local - usar IP de la red
  API_BASE_URL = 'http://192.168.100.224:10000/api'
}

// Fallback si la conexión principal no funciona
const API_BASE_URL_FALLBACK = 'http://localhost:10000/api'

// Conexión alternativa para desarrollo
const API_BASE_URL_DEV = 'http://localhost:10000/api'

// Conexión para producción en Render
const API_BASE_URL_RENDER = 'https://agromae.onrender.com/api'

console.log('🔍 Configuración API:', {
  isDevelopment,
  isLocalhost,
  isRenderProduction,
  hostname: window.location.hostname,
  API_BASE_URL,
  API_BASE_URL_FALLBACK,
  API_BASE_URL_DEV,
  API_BASE_URL_RENDER
})

export default API_BASE_URL
export { API_BASE_URL_FALLBACK, API_BASE_URL_DEV, API_BASE_URL_RENDER }
