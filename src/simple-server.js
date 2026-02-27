const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 5173;
const host = '0.0.0.0';

const server = http.createServer((req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Servir archivos estáticos
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  
  // Si no existe el archivo, servir index.html (para SPA)
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, 'index.html');
  }

  // Determinar el content type
  const extname = path.extname(filePath);
  let contentType = 'text/html';
  
  switch (extname) {
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.css':
      contentType = 'text/css';
      break;
    case '.json':
      contentType = 'application/json';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.jpg':
      contentType = 'image/jpg';
      break;
  }

  // Leer y servir el archivo
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code == 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Server error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf8');
    }
  });
});

server.listen(port, host, () => {
  console.log(`🚀 Servidor frontend corriendo en http://192.168.100.224:${port}`);
  console.log(`📱 Acceso móvil: http://192.168.100.224:${port}`);
  console.log(`💻 Acceso local: http://localhost:${port}`);
});
