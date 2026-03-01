// Configuración de la API - HARDCODE ABSOLUTO
const API_BASE_URL = 'https://agromae-b.onrender.com/api'
const IMAGES_BASE_URL = 'https://agromae-b.onrender.com/uploads'

// Fallback si la conexión principal no funciona
const API_BASE_URL_FALLBACK = 'http://localhost:10000/api'
const API_BASE_URL_DEV = 'http://localhost:10000/api'
const API_BASE_URL_RENDER = 'https://agromae-b.onrender.com/api'

// Forzar producción en Vercel/Render
const isProduction = window.location.hostname.includes('vercel.app') || 
                   window.location.hostname.includes('onrender.com') ||
                   window.location.hostname !== 'localhost'

const FINAL_API_URL = isProduction ? API_BASE_URL_RENDER : API_BASE_URL

export default FINAL_API_URL
export { API_BASE_URL_FALLBACK, API_BASE_URL_DEV, API_BASE_URL_RENDER, IMAGES_BASE_URL }
