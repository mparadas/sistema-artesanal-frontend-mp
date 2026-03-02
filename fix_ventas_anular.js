// Fix para el módulo de ventas - Anular y Devolver a Pedidos

// PROBLEMAS IDENTIFICADOS:
// 1. Inconsistencia en validación de estados
// 2. Estados diferentes entre frontend y backend
// 3. Mensajes confusos para el usuario

// SOLUCIÓN 1: Corregir validación en frontend
const puedeDevolverAPedidos = (venta) => {
  // Permitir anular ventas pendientes O pagadas
  const puedeAnular = ['pendiente', 'pagado', 'parcial'].includes(venta?.estado_pago);
  const noEstaAnulada = !['anulada', 'devuelta_a_pedidos'].includes(venta?.estado_pago);
  return puedeAnular && noEstaAnulada;
};

// SOLUCIÓN 2: Corregir estado en backend
// Cambiar 'anulada' por 'devuelta_a_pedidos' para consistencia

// SOLUCIÓN 3: Mejorar mensajes
const mensajes = {
  anulacion: 'Venta anulada correctamente',
  devolucion: 'Venta devuelta a pedidos correctamente',
  error: 'Error al procesar la solicitud'
};

// SOLUCIÓN 4: Agregar logging mejorado
const logAnulacion = (ventaId, antes, despues) => {
  console.log(`🔄 Venta ${ventaId} procesada:`, {
    antes: {
      estado: antes.estado_pago,
      total: antes.total,
      pagado: antes.monto_pagado
    },
    despues: {
      estado: despues.estado_pago,
      total: despues.total,
      pagado: despues.monto_pagado
    }
  });
};
