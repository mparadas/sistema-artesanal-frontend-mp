// Configuración de la API
// Detectar si estamos en desarrollo o producción
const isDevelopment = process.env.NODE_ENV === 'development'
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

// Configuración para desarrollo y producción
let API_BASE_URL

if (isDevelopment && isLocalhost) {
  // Desarrollo en localhost
  API_BASE_URL = 'https://agromae.onrender.com/api'
} else {
  // Producción - usar Render
  API_BASE_URL = 'https://agromae_b.onrender.com/api'
}

// Fallback si la conexión principal no funciona
const API_BASE_URL_FALLBACK = 'https://agromae_b.onrender.com/api'

// Conexión alternativa para desarrollo
const API_BASE_URL_DEV = 'https://agromae_b.onrender.com/api'

console.log('🔍 Configuración API:', {
  isDevelopment,
  isLocalhost,
  hostname: window.location.hostname,
  API_BASE_URL,
  API_BASE_URL_FALLBACK,
  API_BASE_URL_DEV
})

export default API_BASE_URL
export { API_BASE_URL_FALLBACK, API_BASE_URL_DEV }
