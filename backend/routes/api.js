const express = require('express');
const axios = require('axios');
const winston = require('winston');

const router = express.Router();

// Configuración de logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/api.log' })
  ]
});

// URL del backend principal de AgroMAE
const AGROMAE_API_URL = process.env.AGROMAE_API_URL || 'https://agromae-b.onrender.com/api';

// Middleware para logging
router.use((req, res, next) => {
  logger.info(`API Request: ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Obtener productos de AgroMAE
router.get('/productos', async (req, res) => {
  try {
    const response = await axios.get(`${AGROMAE_API_URL}/productos`);
    res.json(response.data);
  } catch (error) {
    logger.error('Error obteniendo productos', error);
    res.status(500).json({ error: 'Error obteniendo productos' });
  }
});

// Obtener clientes de AgroMAE
router.get('/clientes', async (req, res) => {
  try {
    const response = await axios.get(`${AGROMAE_API_URL}/clientes`);
    res.json(response.data);
  } catch (error) {
    logger.error('Error obteniendo clientes', error);
    res.status(500).json({ error: 'Error obteniendo clientes' });
  }
});

// Obtener ventas de AgroMAE
router.get('/ventas', async (req, res) => {
  try {
    const response = await axios.get(`${AGROMAE_API_URL}/ventas`);
    res.json(response.data);
  } catch (error) {
    logger.error('Error obteniendo ventas', error);
    res.status(500).json({ error: 'Error obteniendo ventas' });
  }
});

// Crear venta desde WhatsApp
router.post('/ventas', async (req, res) => {
  try {
    const saleData = {
      ...req.body,
      fuente: 'whatsapp',
      fecha_creacion: new Date().toISOString()
    };

    const response = await axios.post(`${AGROMAE_API_URL}/ventas`, saleData);
    logger.info('Venta creada desde WhatsApp', { saleId: response.data.id });
    res.json(response.data);
  } catch (error) {
    logger.error('Error creando venta', error);
    res.status(500).json({ error: 'Error creando venta' });
  }
});

// Obtener estadísticas
router.get('/stats', async (req, res) => {
  try {
    // Obtener datos de diferentes endpoints
    const [productosResponse, ventasResponse, clientesResponse] = await Promise.all([
      axios.get(`${AGROMAE_API_URL}/productos`),
      axios.get(`${AGROMAE_API_URL}/ventas`),
      axios.get(`${AGROMAE_API_URL}/clientes`)
    ]);

    const stats = {
      productos: {
        total: productosResponse.data.length,
        activos: productosResponse.data.filter(p => p.activa).length,
        categorias: [...new Set(productosResponse.data.map(p => p.categoria))]
      },
      ventas: {
        total: ventasResponse.data.length,
        hoy: ventasResponse.data.filter(v => {
          const today = new Date().toDateString();
          return new Date(v.fecha).toDateString() === today;
        }).length,
        totalVentas: ventasResponse.data.reduce((sum, v) => sum + parseFloat(v.total || 0), 0)
      },
      clientes: {
        total: clientesResponse.data.length,
        activos: clientesResponse.data.filter(c => c.activo).length
      }
    };

    res.json(stats);
  } catch (error) {
    logger.error('Error obteniendo estadísticas', error);
    res.status(500).json({ error: 'Error obteniendo estadísticas' });
  }
});

// Buscar productos
router.get('/productos/search', async (req, res) => {
  try {
    const { q } = req.query;
    const response = await axios.get(`${AGROMAE_API_URL}/productos`);
    
    const filteredProducts = response.data.filter(product => 
      product.nombre.toLowerCase().includes(q.toLowerCase()) ||
      product.categoria.toLowerCase().includes(q.toLowerCase())
    );

    res.json(filteredProducts);
  } catch (error) {
    logger.error('Error buscando productos', error);
    res.status(500).json({ error: 'Error buscando productos' });
  }
});

// Obtener productos por categoría
router.get('/productos/categoria/:categoria', async (req, res) => {
  try {
    const { categoria } = req.params;
    const response = await axios.get(`${AGROMAE_API_URL}/productos`);
    
    const filteredProducts = response.data.filter(product => 
      product.categoria.toLowerCase() === categoria.toLowerCase()
    );

    res.json(filteredProducts);
  } catch (error) {
    logger.error('Error obteniendo productos por categoría', error);
    res.status(500).json({ error: 'Error obteniendo productos por categoría' });
  }
});

// Crear cliente desde WhatsApp
router.post('/clientes', async (req, res) => {
  try {
    const customerData = {
      ...req.body,
      fuente: 'whatsapp',
      fecha_creacion: new Date().toISOString()
    };

    const response = await axios.post(`${AGROMAE_API_URL}/clientes`, customerData);
    logger.info('Cliente creado desde WhatsApp', { customerId: response.data.id });
    res.json(response.data);
  } catch (error) {
    logger.error('Error creando cliente', error);
    res.status(500).json({ error: 'Error creando cliente' });
  }
});

// Actualizar stock de producto
router.put('/productos/:id/stock', async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    const response = await axios.put(`${AGROMAE_API_URL}/productos/${id}`, { stock });
    logger.info('Stock actualizado', { productId: id, newStock: stock });
    res.json(response.data);
  } catch (error) {
    logger.error('Error actualizando stock', error);
    res.status(500).json({ error: 'Error actualizando stock' });
  }
});

// Obtener lista de precios
router.get('/lista-precios', async (req, res) => {
  try {
    const response = await axios.get(`${AGROMAE_API_URL}/productos`);
    
    const priceList = response.data.map(product => ({
      id: product.id,
      nombre: product.nombre,
      categoria: product.categoria,
      precio: parseFloat(product.precio),
      stock: parseFloat(product.stock),
      unidad: product.unidad
    }));

    res.json(priceList);
  } catch (error) {
    logger.error('Error obteniendo lista de precios', error);
    res.status(500).json({ error: 'Error obteniendo lista de precios' });
  }
});

// Health check para API
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
    agromaeApi: AGROMAE_API_URL
  });
});

module.exports = router;
