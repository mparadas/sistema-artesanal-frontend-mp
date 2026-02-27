import React from 'react'
import { AlertCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react'

export default function ErrorBoundary({ error, onRetry, onDismiss }) {
  if (!error) return null

  const esErrorConexion = error.mensaje?.toLowerCase().includes('conexión') || 
                          error.mensaje?.toLowerCase().includes('servidor') ||
                          error.mensaje?.toLowerCase().includes('internet')

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className={`p-4 rounded-lg shadow-lg ${
        esErrorConexion ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
      }`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {esErrorConexion ? (
              <WifiOff className="w-5 h-5 text-red-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-400" />
            )}
          </div>
          <div className="ml-3 flex-1">
            <h3 className={`text-sm font-medium ${
              esErrorConexion ? 'text-red-800' : 'text-yellow-800'
            }`}>
              {esErrorConexion ? 'Error de Conexión' : 'Error'}
            </h3>
            <div className={`mt-1 text-sm ${
              esErrorConexion ? 'text-red-700' : 'text-yellow-700'
            }`}>
              {error.mensaje}
            </div>
            {error.contexto && (
              <div className="mt-1 text-xs text-gray-500">
                Contexto: {error.contexto}
              </div>
            )}
          </div>
          <div className="ml-auto pl-3">
            <div className="flex space-x-2">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className={`inline-flex items-center px-2 py-1 border border-transparent rounded text-xs font-medium ${
                    esErrorConexion 
                      ? 'text-red-700 bg-red-100 hover:bg-red-200' 
                      : 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200'
                  }`}
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Reintentar
                </button>
              )}
              <button
                onClick={onDismiss}
                className={`inline-flex items-center px-2 py-1 border border-transparent rounded text-xs font-medium ${
                  esErrorConexion 
                    ? 'text-red-700 bg-red-100 hover:bg-red-200' 
                    : 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200'
                }`}
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
