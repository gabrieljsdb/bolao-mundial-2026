#!/bin/sh
set -e
echo "⏳ Aguardando banco de dados ficar disponível..."
until node -e "
const net = require('net');
const c = net.createConnection(5432, 'postgres');
c.on('connect', () => { c.destroy(); process.exit(0); });
c.on('error', () => { c.destroy(); process.exit(1); });
" 2>/dev/null; do
  echo "  banco ainda não disponível, aguardando 2s..."
  sleep 2
done
echo "✅ Banco conectado!"
echo "⏳ Iniciando servidor API..."
exec "$@"