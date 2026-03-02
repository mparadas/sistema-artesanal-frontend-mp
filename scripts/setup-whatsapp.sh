#!/bin/bash

# Script de instalación para WhatsApp Business API - AgroMAE
echo "🚀 Configurando AgroMAE WhatsApp Agent..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js 16+"
    exit 1
fi

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado"
    exit 1
fi

# Crear directorio de backend
echo "📁 Creando directorio de backend..."
mkdir -p backend
cd backend

# Instalar dependencias
echo "📦 Instalando dependencias del backend..."
npm init -y
npm install express body-parser cors helmet morgan dotenv axios node-cron winston

# Copiar archivo de webhook
echo "📋 Configurando webhook..."
cp ../backend-examples/whatsapp-webhook.js .
cp ../backend-examples/package.json .

# Crear archivo .env
echo "⚙️ Creando configuración..."
cat > .env << EOF
# Configuración de WhatsApp Business API
PORT=3000
WHATSAPP_PHONE_ID=tu_phone_number_id
WHATSAPP_ACCESS_TOKEN=tu_access_token
WHATSAPP_BUSINESS_ACCOUNT_ID=tu_business_account_id
WHATSAPP_VERIFY_TOKEN=agromae-whatsapp-2026
WHATSAPP_APP_SECRET=tu_app_secret

# URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000

# Base de datos (opcional)
DB_URL=mongodb://localhost:27017/agromae-whatsapp

# Logging
LOG_LEVEL=info
EOF

echo "✅ Backend configurado"

# Volver al directorio principal
cd ..

# Configurar frontend
echo "🎨 Configurando frontend..."
cp .env.example .env.local

# Instalar dependencias adicionales del frontend
echo "📦 Instalando dependencias del frontend..."
npm install

echo "🔧 Construyendo frontend..."
npm run build

echo "✅ Setup completado!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Configura tus credenciales de WhatsApp en backend/.env"
echo "2. Inicia el backend: cd backend && npm start"
echo "3. Inicia el frontend: npm run dev"
echo "4. Configura el webhook en Meta Developers"
echo ""
echo "🌐 URLs importantes:"
echo "- Frontend: http://localhost:5173"
echo "- Backend: http://localhost:3000"
echo "- Webhook: http://localhost:3000/webhook"
echo "- Health check: http://localhost:3000/health"
echo ""
echo "📚 Documentación: docs/WHATSAPP_API_SETUP.md"
