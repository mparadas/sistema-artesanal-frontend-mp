@echo off
echo 🔧 DEPLOY URGENTE - Fix vercel.json API URL
echo ==========================================
echo.

echo ❌ PROBLEMA ENCONTRADO:
echo    • vercel.json apuntaba a URL incorrecta
echo    • agromae.onrender.com ❌ (sin -b)
echo    • agromae-b.onrender.com ✅ (correcto)
echo.

echo ✅ SOLUCIÓN APLICADA:
echo    • Actualizado vercel.json con URL correcta
echo    • Ahora frontend podrá comunicarse con backend
echo.

echo 🚀 INICIANDO DEPLOY A VERCEL...
echo.

echo 1️⃣ Agregando archivo modificado...
git add vercel.json

if %errorlevel% neq 0 (
    echo    ❌ Error al agregar archivo
    pause
    exit /b 1
)
echo    ✅ Archivo agregado correctamente

echo.
echo 2️⃣ Creando commit...
git commit -m "Fix vercel.json API URL - Point to correct backend

- Update destination from agromae.onrender.com to agromae-b.onrender.com
- Fix API communication between Vercel frontend and Render backend
- Resolve 404 errors in frontend API calls
- Enable ventas module to load correctly"

if %errorlevel% neq 0 (
    echo    ❌ Error al crear commit
    pause
    exit /b 1
)
echo    ✅ Commit creado correctamente

echo.
echo 3️⃣ Enviando a GitHub...
git push origin main

if %errorlevel% neq 0 (
    echo    ❌ Error al hacer push
    pause
    exit /b 1
)
echo    ✅ Push exitoso a GitHub

echo.
echo 🎉 ¡DEPLOY COMPLETADO!
echo.
echo 🔄 Vercel detectará el cambio y hará deploy automático
echo ⏰ Tiempo de espera: 2-3 minutos
echo.
echo 🌐 URL para verificar:
echo    https://sistema-artesanal-frontend-mp.vercel.app/ventas
echo.
echo 📱 Después del deploy:
echo    ✅ El módulo de ventas debería cargar
echo    ✅ Los endpoints responderán correctamente
echo    ✅ Fin del problema "cargando ventas..."
echo.
echo ✅ ¡Listo! Espera 2-3 minutos y prueba el módulo de ventas

rem Abrir URL automáticamente
echo.
echo 🌐 Abriendo URL en 5 segundos...
timeout /t 5 /nobreak >nul
start https://sistema-artesanal-frontend-mp.vercel.app/ventas

pause
