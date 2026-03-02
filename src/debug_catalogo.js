// Para agregar al catálogo si es necesario
const mostrarMensajeStock = () => {
  const productosSinStock = catalogoCompleto.filter(p => (p.stock || 0) <= 0);
  if (productosSinStock.length > 0) {
    console.log(`📊 Catálogo: ${productosSinStock.length} productos ocultos por falta de stock`);
  }
};

// Agregar en useEffect para depuración
useEffect(() => {
  if (catalogoCompleto.length > 0) {
    const conStock = catalogoCompleto.filter(p => (p.stock || 0) > 0);
    const sinStock = catalogoCompleto.filter(p => (p.stock || 0) <= 0);
    console.log(`🎯 Catálogo filtrado: ${conStock.length} mostrados, ${sinStock.length} ocultos`);
  }
}, [catalogoCompleto]);
