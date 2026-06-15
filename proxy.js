const http = require('http');
const httpProxy = require('http-proxy');
const fs = require('fs');
const path = require('path');

const proxy = httpProxy.createProxyServer({});
const PUBLIC_DIR = '/home/ubuntu/bolao2_run/artifacts/bolao2026/dist/public';

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api')) {
    proxy.web(req, res, { target: 'http://localhost:8080' });
  } else {
    // Tentar servir arquivo estático
    let filePath = path.join(PUBLIC_DIR, req.url === '/' ? 'index.html' : req.url);
    
    // Se for uma rota SPA (sem extensão de arquivo), serve o index.html
    if (!path.extname(filePath)) {
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      // Para simplificar, usamos o proxy para o servidor http do python que já está rodando
      proxy.web(req, res, { target: 'http://localhost:3030' });
    } else {
      // Fallback para o index.html no servidor python
      req.url = '/index.html';
      proxy.web(req, res, { target: 'http://localhost:3030' });
    }
  }
});

console.log("Proxy listening on port 3000 (SPA mode)");
server.listen(3000);
