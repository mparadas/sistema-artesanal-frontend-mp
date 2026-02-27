// Utilidad de diagnóstico para problemas de conexión
export class DiagnosticoConexion {
  constructor() {
    this.resultados = [];
  this.ips = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://192.168.100.224:3000'
    ];
  this.endpoints = [
      '/api/productos',
      '/api/ingredientes',
      '/api/auditoria'
    ];
  }

  async probarConexion(ip, endpoint) {
    const url = `${ip}${endpoint}`;
    const startTime = Date.now();
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (response.ok) {
        const data = await response.json();
        return {
          exito: true,
          ip,
          endpoint,
          status: response.status,
          duration,
          registros: data.length,
          error: null
        };
      } else {
        return {
          exito: false,
          ip,
          endpoint,
          status: response.status,
          duration,
          registros: 0,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        exito: false,
        ip,
        endpoint,
        status: 0,
        duration: Date.now() - startTime,
        registros: 0,
        error: error.message
      };
    }
  }

  async diagnosticarCompleto() {
    console.log('🔍 Iniciando diagnóstico completo de conexión...');
    this.resultados = [];
    
    for (const ip of this.ips) {
      for (const endpoint of this.endpoints) {
        const resultado = await this.probarConexion(ip, endpoint);
        this.resultados.push(resultado);
        
        // Pequeña pausa para no sobrecargar el servidor
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return this.analizarResultados();
  }

  analizarResultados() {
    const exitosos = this.resultados.filter(r => r.exito);
    const fallidos = this.resultados.filter(r => !r.exito);
    
    const analisis = {
      total: this.resultados.length,
      exitosos: exitosos.length,
      fallidos: fallidos.length,
      ipsFuncionando: [...new Set(exitosos.map(r => r.ip))],
      endpointsFuncionando: [...new Set(exitosos.map(r => r.endpoint))],
      problemas: this.identificarProblemas(fallidos),
      recomendaciones: this.generarRecomendaciones(fallidos)
    };
    
    console.log('📊 Análisis de conexión:', analisis);
    return analisis;
  }

  identificarProblemas(fallidos) {
    const problemas = [];
    
    fallidos.forEach(fallo => {
      if (fallo.error.includes('fetch')) {
        problemas.push({
          tipo: 'conexion_red',
          descripcion: 'Error de red - no se puede conectar al servidor',
          solucion: 'Verifica que el servidor esté corriendo y accesible'
        });
      } else if (fallo.error.includes('ECONNREFUSED')) {
        problemas.push({
          tipo: 'servidor_no_corriendo',
          descripcion: 'El servidor no está corriendo',
          solucion: 'Inicia el servidor backend con "node server.js"'
        });
      } else if (fallo.status === 404) {
        problemas.push({
          tipo: 'endpoint_no_existe',
          descripcion: `El endpoint ${fallo.endpoint} no existe`,
          solucion: 'Verifica que el endpoint esté implementado en el servidor'
        });
      } else if (fallo.status >= 500) {
        problemas.push({
          tipo: 'error_servidor',
          descripcion: 'Error interno del servidor',
          solucion: 'Revisa los logs del servidor para más detalles'
        });
      }
    });
    
    return [...new Map(problemas.map(p => [p.tipo, p])).values()];
  }

  generarRecomendaciones(fallidos) {
    const recomendaciones = [];
    
    if (fallidos.length === this.resultados.length) {
      recomendaciones.push({
        prioridad: 'alta',
        titulo: 'Verificar que el servidor backend esté corriendo',
        descripcion: 'Ejecuta "node server.js" en la carpeta backend',
        comando: 'cd backend && node server.js'
      });
    }
    
    const problemasCORS = fallidos.filter(f => f.error.includes('CORS'));
    if (problemasCORS.length > 0) {
      recomendaciones.push({
        prioridad: 'alta',
        titulo: 'Problemas de CORS',
        descripcion: 'El servidor está rechazando peticiones desde el frontend',
        comando: 'Verifica la configuración CORS en server.js'
      });
    }
    
    const problemasRed = fallidos.filter(f => f.ip.includes('192.168'));
    if (problemasRed.length > 0) {
      recomendaciones.push({
        prioridad: 'media',
        titulo: 'Problemas de red local',
        descripcion: 'Verifica que ambos dispositivos estén en la misma red WiFi',
        comando: 'ping 192.168.100.224'
      });
    }
    
    return recomendaciones;
  }

  async probarConexionRapida() {
    console.log('⚡ Prueba de conexión rápida...');
    
    // Probar solo el endpoint de auditoría en la IP de red
    const resultado = await this.probarConexion('http://192.168.100.224:3000', '/api/auditoria');
    
    if (resultado.exito) {
      console.log('✅ Conexión exitosa:', {
        ip: resultado.ip,
        endpoint: resultado.endpoint,
        registros: resultado.registros,
        duracion: resultado.duration + 'ms'
      });
      return true;
    } else {
      console.log('❌ Error de conexión:', resultado.error);
      return false;
    }
  }

  generarReporte() {
    const analisis = this.analizarResultados();
    
    let reporte = '\n📋 REPORTE DE DIAGNÓSTICO DE CONEXIÓN\n';
    reporte += '=' .repeat(50) + '\n\n';
    
    reporte += `📊 Estadísticas:\n`;
    reporte += `   Total de pruebas: ${analisis.total}\n`;
    reporte += `   Exitosas: ${analisis.exitosos} ✅\n`;
    reporte += `   Fallidas: ${analisis.fallidos} ❌\n`;
    reporte += `   Tasa de éxito: ${Math.round((analisis.exitosos / analisis.total) * 100)}%\n\n`;
    
    if (analisis.ipsFuncionando.length > 0) {
      reporte += `🌐 IPs funcionando:\n`;
      analisis.ipsFuncionando.forEach(ip => {
        reporte += `   ✅ ${ip}\n`;
      });
      reporte += '\n';
    }
    
    if (analisis.endpointsFuncionando.length > 0) {
      reporte += `🔗 Endpoints funcionando:\n`;
      analisis.endpointsFuncionando.forEach(endpoint => {
        reporte += `   ✅ ${endpoint}\n`;
      });
      reporte += '\n';
    }
    
    if (analisis.problemas.length > 0) {
      reporte += `⚠️ Problemas detectados:\n`;
      analisis.problemas.forEach(problema => {
        reporte += `   ❌ ${problema.descripcion}\n`;
        reporte += `      💡 Solución: ${problema.solucion}\n`;
      });
      reporte += '\n';
    }
    
    if (analisis.recomendaciones.length > 0) {
      reporte += `💡 Recomendaciones:\n`;
      analisis.recomendaciones.forEach((rec, index) => {
        reporte += `   ${index + 1}. [${rec.prioridad.toUpperCase()}] ${rec.titulo}\n`;
        reporte += `      ${rec.descripcion}\n`;
        if (rec.comando) {
          reporte += `      📝 Comando: ${rec.comando}\n`;
        }
        reporte += '\n';
      });
    }
    
    reporte += '=' .repeat(50) + '\n';
    reporte += `🕐 Generado: ${new Date().toLocaleString()}\n`;
    
    return reporte;
  }
}

// Exportar para uso en componentes
export default DiagnosticoConexion;
