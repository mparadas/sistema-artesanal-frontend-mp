// Configuración de la API
// Detectar si estamos en desarrollo o producción
const isDevelopment = process.env.NODE_ENV === 'development'
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
const isRenderProduction = window.location.hostname.includes('onrender.com')

// Configuración para desarrollo y producción
let API_BASE_URL
let IMAGES_BASE_URL

if (isDevelopment && isLocalhost) {
  // Desarrollo en localhost - backend en puerto 10000
  API_BASE_URL = 'http://localhost:10000/api'
  IMAGES_BASE_URL = 'http://localhost:10000/uploads'
} else if (isRenderProduction && window.location.hostname.includes('agromae-b')) {
  // Frontend en Render (agromae-b) - backend en agromae-b
  API_BASE_URL = 'https://agromae-b.onrender.com/api'
  IMAGES_BASE_URL = 'https://agromae-b.onrender.com/uploads'
} else if (isRenderProduction) {
  // Backend en Render - frontend local
  API_BASE_URL = 'https://agromae-b.onrender.com/api'
  IMAGES_BASE_URL = 'https://agromae-b.onrender.com/uploads'
} else {
  // Producción - usar agromae-b
  API_BASE_URL = 'https://agromae-b.onrender.com/api'
  IMAGES_BASE_URL = 'https://agromae-b.onrender.com/uploads'
}

// Fallback si la conexión principal no funciona
const API_BASE_URL_FALLBACK = 'http://localhost:10000/api'

// Conexión alternativa para desarrollo
const API_BASE_URL_DEV = 'http://localhost:10000/api'

// Conexión para producción en Render
const API_BASE_URL_RENDER = 'https://agromae-b.onrender.com/api'

export default API_BASE_URL
export { API_BASE_URL_FALLBACK, API_BASE_URL_DEV, API_BASE_URL_RENDER, IMAGES_BASE_URL }
