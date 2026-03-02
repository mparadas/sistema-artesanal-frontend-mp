@echo off
echo 🔧 Actualizando frontend para Vercel deploy...
echo.

echo 📋 Ejecutando comandos Git...
echo.

echo 1️⃣ Agregando archivos modificados...
git add src/pages/Catalogo.jsx src/pages/Productos.jsx src/pages/ProductosDisponibles.jsx src/pages/ListaPrecios.jsx src/pages/Catalogo_Limpio.jsx

echo.
echo 2️⃣ Creando commit...
git commit -m "Fix hamburguesa icons - Priority fix for 🍔 display"

echo.
echo 3️⃣ Enviando a GitHub...
git push origin main

echo.
echo ✅ ¡Completado! Vercel hará deploy automático en 2-3 minutos
echo 🌐 URL: https://sistema-artesanal-frontend-mp.vercel.app
echo 🍔 Las hamburguesas mostrarán 🍔 después del deploy

pause
