const express = require('express');
const path = require('path');
const app = express();
const port = 5173;

// Servir archivos estáticos del build
app.use(express.static(path.join(__dirname, 'dist')));

// Servir archivos estáticos de src para desarrollo
app.use('/src', express.static(path.join(__dirname, 'src')));

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API proxy para desarrollo
app.get('/api/*', (req, res) => {
  res.redirect(`http://192.168.100.224:3000/${req.originalUrl}`);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Servidor frontend corriendo en http://192.168.100.224:${port}`);
  console.log(`📱 Acceso móvil: http://192.168.100.224:${port}`);
  console.log(`💻 Acceso local: http://localhost:${port}`);
});
