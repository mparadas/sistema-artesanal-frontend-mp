// Configuracion de la API - usa variables de entorno con fallback a Render
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://agromae-b.onrender.com/api'
const IMAGES_BASE_URL = import.meta.env.VITE_IMAGES_BASE_URL || 'https://agromae-b.onrender.com/uploads'

// Fallback si la conexion principal no funciona
const API_BASE_URL_FALLBACK = 'http://localhost:10000/api'
const API_BASE_URL_DEV = 'http://localhost:10000/api'
const API_BASE_URL_RENDER = import.meta.env.VITE_API_URL || 'https://agromae-b.onrender.com/api'

const isProduction = window.location.hostname.includes('vercel.app') || 
                   window.location.hostname.includes('onrender.com') ||
                   window.location.hostname !== 'localhost'

const FINAL_API_URL = isProduction ? API_BASE_URL_RENDER : API_BASE_URL

console.log('Configuracion API:', {
  hostname: window.location.hostname,
  isProduction,
  API_BASE_URL: FINAL_API_URL,
  IMAGES_BASE_URL,
})

export default FINAL_API_URL
export { API_BASE_URL_FALLBACK, API_BASE_URL_DEV, API_BASE_URL_RENDER, IMAGES_BASE_URL }
