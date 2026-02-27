import { useState, useCallback, useEffect } from 'react'

export function useApiError() {
  const [error, setError] = useState(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // Escuchar cambios de conexión
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const manejarError = useCallback((error, contexto = '') => {
    console.error(`❌ Error en ${contexto}:`, error)
    
    let mensajeError = 'Error de conexión'
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      mensajeError = 'No se puede conectar al servidor. Verifica tu conexión a internet.'
    } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      mensajeError = 'El servidor no responde. Intenta recargar la página.'
    } else if (error.status === 0) {
      mensajeError = 'Error de conexión. El servidor no está disponible.'
    } else if (error.status === 404) {
      mensajeError = 'Recurso no encontrado. El módulo solicitado no existe.'
    } else if (error.status === 500) {
      mensajeError = 'Error interno del servidor. Contacta al administrador.'
    } else if (error.status >= 400) {
      mensajeError = `Error ${error.status}: ${error.message || 'Solicitud inválida'}`
    } else if (error.message) {
      mensajeError = error.message
    }
    
    setError({
      mensaje: mensajeError,
      contexto: contexto,
      timestamp: new Date().toISOString(),
      detalles: error
    })
    
    // Auto-limpiar después de 5 segundos
    setTimeout(() => setError(null), 5000)
  }, [])

  const limpiarError = useCallback(() => {
    setError(null)
  }, [])

  const fetchWithErrorHandling = useCallback(async (url, options = {}) => {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      })
      
      if (!response.ok) {
        const error = new Error(response.statusText)
        error.status = response.status
        error.response = response
        throw error
      }
      
      return response.json()
    } catch (error) {
      manejarError(error, url)
      throw error
    }
  }, [manejarError])

  return {
    error,
    isOnline,
    manejarError,
    limpiarError,
    fetchWithErrorHandling
  }
}
