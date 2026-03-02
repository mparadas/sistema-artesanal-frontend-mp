#!/usr/bin/env node

// Script para probar la configuración de WhatsApp
const axios = require('axios');

// Configuración
const BACKEND_URL = 'http://localhost:3000';
const VERIFY_TOKEN = 'agromae-whatsapp-2026';

async function testWhatsAppConfig() {
  console.log('🧪 Probando configuración de WhatsApp...\n');

  // Test 1: Health check
  try {
    console.log('1️⃣ Probando health check...');
    const healthResponse = await axios.get(`${BACKEND_URL}/health`);
    console.log('✅ Health check OK:', healthResponse.data);
    console.log('');
  } catch (error) {
    console.log('❌ Health check falló:', error.message);
    return;
  }

  // Test 2: Webhook verification
  try {
    console.log('2️⃣ Probando verificación de webhook...');
    const webhookResponse = await axios.get(
      `${BACKEND_URL}/webhook?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=test123`
    );
    console.log('✅ Webhook verification OK:', webhookResponse.data);
    console.log('');
  } catch (error) {
    console.log('❌ Webhook verification falló:', error.message);
    console.log('   Verifica que el servidor esté corriendo en el puerto 3000');
    return;
  }

  // Test 3: API endpoints
  try {
    console.log('3️⃣ Probando API endpoints...');
    
    // Test conversations
    const convResponse = await axios.get(`${BACKEND_URL}/api/conversations`);
    console.log('✅ Conversaciones API OK:', convResponse.data.length, 'conversaciones');
    
    // Test stats
    const statsResponse = await axios.get(`${BACKEND_URL}/api/stats`);
    console.log('✅ Stats API OK:', statsResponse.data);
    
    // Test AgroMAE API
    try {
      const productsResponse = await axios.get(`${BACKEND_URL}/api/productos`);
      console.log('✅ AgroMAE productos API OK:', productsResponse.data.length, 'productos');
    } catch (error) {
      console.log('⚠️  AgroMAE API no disponible (normal en desarrollo)');
    }
    
    console.log('');
  } catch (error) {
    console.log('❌ API endpoints fallaron:', error.message);
  }

  // Test 4: Variables de entorno
  console.log('4️⃣ Verificando variables de entorno...');
  const requiredEnvVars = [
    'WHATSAPP_PHONE_ID',
    'WHATSAPP_ACCESS_TOKEN', 
    'WHATSAPP_VERIFY_TOKEN',
    'WHATSAPP_BUSINESS_ACCOUNT_ID'
  ];

  const missingVars = requiredEnvVars.filter(varName => {
    const value = process.env[varName];
    return !value || value.includes('...') || value.includes('aqui');
  });

  if (missingVars.length === 0) {
    console.log('✅ Variables de entorno OK');
  } else {
    console.log('❌ Variables de entorno faltantes:');
    missingVars.forEach(varName => {
      console.log(`   - ${varName}: necesita configurarse`);
    });
    console.log('');
    console.log('📝 Edita backend/.env con tus credenciales de WhatsApp');
  }

  console.log('');
  console.log('🎉 Pruebas completadas!');
  console.log('');
  console.log('📋 Próximos pasos:');
  console.log('1. Configura tus credenciales en backend/.env');
  console.log('2. Reinicia el servidor: npm start');
  console.log('3. Prueba enviando un mensaje a tu número WhatsApp Business');
  console.log('4. Verifica la respuesta automática del bot');
}

// Ejecutar pruebas
if (require.main === module) {
  testWhatsAppConfig().catch(console.error);
}

module.exports = testWhatsAppConfig;
