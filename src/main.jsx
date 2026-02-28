import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

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

createRoot(document.getElementById('root')).render(
  <App />
)
