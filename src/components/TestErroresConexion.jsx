import { useState } from 'react'
import { Wifi, WifiOff, AlertCircle, RefreshCw, CheckCircle, XCircle } from 'lucide-react'

export default function TestErroresConexion() {
  const [resultados, setResultados] = useState([])
  const [probando, setProbando] = useState(false)

  const log = (mensaje, tipo = 'info') => {
    setResultados(prev => [...prev, { 
      mensaje, 
      tipo, 
      timestamp: new Date().toLocaleTimeString() 
    }])
  }

  const limpiarResultados = () => {
    setResultados([])
  }

  const testFetchExitoso = async () => {
    try {
      log('🔄 Probando fetch exitoso...', 'info')
      const response = await fetch('http://localhost:3000/api/productos')
      const data = await response.json()
      log(`✅ Fetch exitoso: ${data.length} productos cargados`, 'success')
    } catch (error) {
      log(`❌ Error inesperado: ${error.message}`, 'error')
    }
  }

  const testError404 = async () => {
    try {
      log('🔄 Probando error 404...', 'warning')
      const response = await fetch('http://localhost:3000/api/no-existe')
      const data = await response.json()
      log(`❌ Error inesperado: ${data}`, 'error')
    } catch (error) {
      log(`✅ Error 404 capturado: ${error.message}`, 'success')
    }
  }

  const testErrorRed = async () => {
    try {
      log('🔄 Probando error de red...', 'warning')
      const response = await fetch('http://192.168.100.224:9999/api/productos')
      const data = await response.json()
      log(`❌ Error inesperado: ${data}`, 'error')
    } catch (error) {
      log(`✅ Error de red capturado: ${error.message}`, 'success')
    }
  }

  const testTimeout = async () => {
    try {
      log('🔄 Probando timeout...', 'warning')
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 100)
      
      const response = await fetch('http://localhost:3000/api/productos', { 
        signal: controller.signal 
      })
      const data = await response.json()
      log(`❌ Timeout no debería llegar aquí: ${data}`, 'error')
    } catch (error) {
      log(`✅ Timeout capturado: ${error.name}: ${error.message}`, 'success')
    }
  }

  const testConexion = async () => {
    setProbando(true)
    limpiarResultados()
    
    log('🚀 Iniciando pruebas de conexión...', 'info')
    
    await testFetchExitoso()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    await testError404()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    await testErrorRed()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    await testTimeout()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const exitosos = resultados.filter(r => r.tipo === 'success').length
    const total = resultados.length
    
    log(`📊 Resultados: ${exitosos}/${total} pruebas exitosas`, 'info')
    setProbando(false)
  }

  const simularDesconexion = () => {
    log('🔌 Simulando desconexión...', 'warning')
    
    // Simular desconexión
    Object.defineProperty(navigator, 'onLine', { get: () => false })
    window.dispatchEvent(new Event('offline'))
    
    // Restaurar después de 3 segundos
    setTimeout(() => {
      log('🟢 Restaurando conexión...', 'info')
      Object.defineProperty(navigator, 'onLine', { get: () => true })
      window.dispatchEvent(new Event('online'))
    }, 3000)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6 flex items-center">
        <Wifi className="w-6 h-6 mr-2" />
        Prueba de Errores de Conexión
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={testConexion}
          disabled={probando}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center"
        >
          {probando ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Probando...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Ejecutar Todas las Pruebas
            </>
          )}
        </button>
        
        <button
          onClick={simularDesconexion}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center justify-center"
        >
          <WifiOff className="w-4 h-4 mr-2" />
          Simular Desconexión
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <button
          onClick={testFetchExitoso}
          disabled={probando}
          className="bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 disabled:opacity-50 text-sm"
        >
          ✅ Fetch Exitoso
        </button>
        <button
          onClick={testError404}
          disabled={probando}
          className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 disabled:opacity-50 text-sm"
        >
          ❌ Error 404
        </button>
        <button
          onClick={testErrorRed}
          disabled={probando}
          className="bg-yellow-500 text-white px-3 py-2 rounded hover:bg-yellow-600 disabled:opacity-50 text-sm"
        >
          ⚠️ Error Red
        </button>
        <button
          onClick={testTimeout}
          disabled={probando}
          className="bg-purple-500 text-white px-3 py-2 rounded hover:bg-purple-600 disabled:opacity-50 text-sm"
        >
          ⏱️ Timeout
        </button>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Resultados de Pruebas</h2>
        <button
          onClick={limpiarResultados}
          className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300 text-sm"
        >
          Limpiar
        </button>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
        {resultados.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No hay resultados. Ejecuta una prueba para ver los resultados aquí.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {resultados.map((resultado, index) => (
              <div
                key={index}
                className={`flex items-start p-3 rounded-lg ${
                  resultado.tipo === 'success' ? 'bg-green-50 text-green-800' :
                  resultado.tipo === 'error' ? 'bg-red-50 text-red-800' :
                  resultado.tipo === 'warning' ? 'bg-yellow-50 text-yellow-800' :
                  'bg-blue-50 text-blue-800'
                }`}
              >
                <div className="flex-shrink-0 mr-2">
                  {resultado.tipo === 'success' ? <CheckCircle className="w-4 h-4" /> :
                   resultado.tipo === 'error' ? <XCircle className="w-4 h-4" /> :
                   resultado.tipo === 'warning' ? <AlertCircle className="w-4 h-4" /> :
                   <RefreshCw className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm">{resultado.mensaje}</p>
                  <p className="text-xs opacity-75">{resultado.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Estado de Conexión</h3>
        <div className="flex items-center">
          {navigator.onLine ? (
            <>
              <Wifi className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-green-800">Conectado a internet</span>
            </>
          ) : (
            <>
              <WifiOff className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800">Sin conexión a internet</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
