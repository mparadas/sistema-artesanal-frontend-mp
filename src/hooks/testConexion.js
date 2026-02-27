// Script para probar el sistema de manejo de errores de conexión
export function testConexion() {
  console.log('🔍 Iniciando pruebas de conexión...');
  
  // Prueba 1: Conexión exitosa
  const testFetchExitoso = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/productos');
      const data = await response.json();
      console.log('✅ Prueba 1 - Fetch exitoso:', data.length, 'productos');
      return true;
    } catch (error) {
      console.error('❌ Prueba 1 - Error inesperado:', error.message);
      return false;
    }
  };
  
  // Prueba 2: Error 404
  const testError404 = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/no-existe');
      const data = await response.json();
      console.log('❌ Prueba 2 - Debería haber fallado:', data);
      return false;
    } catch (error) {
      console.log('✅ Prueba 2 - Error 404 capturado correctamente:', error.message);
      return true;
    }
  };
  
  // Prueba 3: Error de red
  const testErrorRed = async () => {
    try {
      const response = await fetch('http://192.168.100.224:9999/api/productos');
      const data = await response.json();
      console.log('❌ Prueba 3 - Debería haber fallado:', data);
      return false;
    } catch (error) {
      console.log('✅ Prueba 3 - Error de red capturado correctamente:', error.message);
      return true;
    }
  };
  
  // Prueba 4: Timeout
  const testTimeout = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 100);
      
      const response = await fetch('http://localhost:3000/api/productos', { 
        signal: controller.signal 
      });
      const data = await response.json();
      console.log('❌ Prueba 4 - Debería haber fallado por timeout:', data);
      return false;
    } catch (error) {
      console.log('✅ Prueba 4 - Timeout capturado correctamente:', error.name, error.message);
      return true;
    }
  };
  
  // Ejecutar todas las pruebas
  const ejecutarPruebas = async () => {
    console.log('🚀 Ejecutando pruebas de conexión...');
    
    const resultados = {
      exitoso: await testFetchExitoso(),
      error404: await testError404(),
      errorRed: await testErrorRed(),
      timeout: await testTimeout()
    };
    
    console.log('📊 Resultados de las pruebas:');
    console.log('✅ Fetch exitoso:', resultados.exitoso ? 'PASS' : 'FAIL');
    console.log('✅ Error 404:', resultados.error404 ? 'PASS' : 'FAIL');
    console.log('✅ Error de red:', resultados.errorRed ? 'PASS' : 'FAIL');
    console.log('✅ Timeout:', resultados.timeout ? 'PASS' : 'FAIL');
    
    const totalPruebas = Object.values(resultados).filter(Boolean).length;
    console.log(`🎯 Total: ${totalPruebas}/4 pruebas pasaron`);
    
    return resultados;
  };
  
  return {
    ejecutarPruebas,
    testFetchExitoso,
    testError404,
    testErrorRed,
    testTimeout
  };
}

// Detectar cambios de conexión
export function detectarConexion() {
  console.log('🔍 Configurando detección de conexión...');
  
  const handleOnline = () => {
    console.log('🟢 Conexión restaurada');
    document.body.classList.remove('offline');
    document.body.classList.add('online');
  };
  
  const handleOffline = () => {
    console.log('🔴 Conexión perdida');
    document.body.classList.remove('online');
    document.body.classList.add('offline');
  };
  
  // Event listeners
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Estado inicial
  if (navigator.onLine) {
    handleOnline();
  } else {
    handleOffline();
  }
  
  // Cleanup
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

// Simular desconexión
export function simularDesconexion() {
  console.log('🔌 Simulando desconexión...');
  
  // Simular desconexión
  Object.defineProperty(navigator, 'onLine', { get: () => false });
  window.dispatchEvent(new Event('offline'));
  
  // Restaurar después de 3 segundos
  setTimeout(() => {
    console.log('🟢 Restaurando conexión...');
    Object.defineProperty(navigator, 'onLine', { get: () => true });
    window.dispatchEvent(new Event('online'));
  }, 3000);
}

// Exportar todo
export default {
  testConexion,
  detectarConexion,
  simularDesconexion
};
