import { IMAGES_BASE_URL } from '../config'

// Función para obtener URL de imagen correcta
export const getImageUrl = (imagePath) => {
  console.log('🔍 getImageUrl llamada con:', imagePath)
  
  if (!imagePath) {
    console.log('❌ imagePath vacío, usando placeholder')
    return 'https://placehold.co/320x220/F97316/FFFFFF?text=Producto'
  }
  
  // Si ya es una URL completa, verificar si necesita corrección
  if (imagePath.startsWith('http')) {
    console.log('🌐 URL completa detectada:', imagePath)
    
    // Reemplazar URLs locales por URLs de producción
    if (imagePath.includes('192.168.100.224') || imagePath.includes('localhost')) {
      const converted = imagePath.replace(/http:\/\/(localhost|192\.168\.100\.224):\d+/, 'https://agromae-b.onrender.com')
      console.log('🔄 URL local convertida:', converted)
      return converted
    }
    
    // Convertir HTTP a HTTPS para URLs de agromae-b.onrender.com
    if (imagePath.includes('agromae-b.onrender.com')) {
      if (imagePath.startsWith('http://')) {
        const converted = imagePath.replace('http://', 'https://')
        console.log('🔒 HTTP→HTTPS convertida:', converted)
        return converted
      } else if (imagePath.startsWith('https://')) {
        console.log('✅ URL HTTPS ya correcta:', imagePath)
        return imagePath
      }
    }
    
    console.log('⚠️ URL externa sin cambios:', imagePath)
    return imagePath
  }
  
  // Si es una ruta relativa, combinar con base URL
  const finalUrl = `${IMAGES_BASE_URL}/${imagePath.startsWith('/') ? imagePath.slice(1) : imagePath}`
  console.log('📂 Ruta relativa combinada:', finalUrl)
  return finalUrl
}

// Función para verificar si una imagen es válida
export const isValidImageUrl = (url) => {
  if (!url) return false
  return url.startsWith('https://agromae-b.onrender.com') || url.startsWith('/placeholder')
}
