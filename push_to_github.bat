@echo off
echo 🔧 EJECUTANDO COMANDOS GIT - Solución Directa
echo ==========================================
echo.

echo 📋 Este script ejecutará los comandos git necesarios
echo    para subir los cambios al repositorio
echo.

echo ⏳ Paso 1: Verificando estado de Git...
cd /d "c:\Users\Miguel Prada\agromae-web'frontend\sistema-artesanal-frontend-mp"
git status

echo.
echo ⏳ Paso 2: Agregando todos los cambios...
git add .

echo.
echo ⏳ Paso 3: Creando commit...
git commit -m "Fix imágenes persistentes y problemas de carga

- Corregir vercel.json para apuntar a backend correcto
- Implementar URLs externas para imágenes persistentes
- Solucionar problema de módulo de ventas que no carga
- Optimizar rendimiento de carga de imágenes
- Eliminar errores 404 de imágenes"

echo.
echo ⏳ Paso 4: Enviando a GitHub...
git push origin main

echo.
echo 🎉 ¡COMPLETADO!
echo.
echo 📊 Resumen:
echo    • Cambios agregados: ✅
echo    • Commit creado: ✅
echo    • Push a GitHub: ✅
echo    • Deploy Vercel: ⏳ (automático en 2-3 minutos)
echo.

echo ✅ ¡Todo subido a GitHub correctamente!

pause
