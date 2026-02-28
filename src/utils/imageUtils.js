import { IMAGES_BASE_URL } from '../src/config'

// Función para obtener URL de imagen correcta
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '/placeholder-product.jpg'
  
  // Si ya es una URL completa, verificar si necesita corrección
  if (imagePath.startsWith('http')) {
    // Reemplazar URLs locales por URLs de producción
    if (imagePath.includes('192.168.100.224') || imagePath.includes('localhost')) {
      return imagePath.replace(/http:\/\/(localhost|192\.168\.100\.224):\d+/, IMAGES_BASE_URL)
    }
    return imagePath
  }
  
  // Si es una ruta relativa, combinar con base URL
  return `${IMAGES_BASE_URL}/${imagePath.startsWith('/') ? imagePath.slice(1) : imagePath}`
}

// Función para verificar si una imagen es válida
export const isValidImageUrl = (url) => {
  if (!url) return false
  return url.startsWith('https://agromae.onrender.com') || url.startsWith('/placeholder')
}
