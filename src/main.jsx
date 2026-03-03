import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Desactivar SW y limpiar caches para evitar version vieja en movil.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map((registration) => registration.unregister()))
    } catch (error) {
      console.warn('No se pudo desregistrar service workers:', error)
    }
  })
}

if ('caches' in window) {
  window.addEventListener('load', async () => {
    try {
      const keys = await caches.keys()
      await Promise.all(keys.map((key) => caches.delete(key)))
    } catch (error) {
      console.warn('No se pudo limpiar cache del navegador:', error)
    }
  })
}

// Manejador de errores global para errores de service worker
window.addEventListener('error', (event) => {
  if (event.message.includes('message channel closed')) {
    console.warn('Service worker error ignorado:', event.message)
    event.preventDefault()
  }
})

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('message channel closed')) {
    console.warn('Promise rejection de service worker ignorado:', event.reason)
    event.preventDefault()
  }
})

createRoot(document.getElementById('root')).render(<App />)
