@echo off
echo 🔧 DEPLOY AUTOMÁTICO A VERCEL - Fix Hamburguesa Icons
echo ==================================================
echo.

echo 📋 Verificando repositorio...
git remote -v

echo.
echo 📂 Mostrando cambios a subir...
git status --porcelain

echo.
echo 🍔 Archivos modificados para iconos de hamburguesa:
echo    ✅ src/pages/Catalogo.jsx
echo    ✅ src/pages/Productos.jsx 
echo    ✅ src/pages/ProductosDisponibles.jsx
echo    ✅ src/pages/ListaPrecios.jsx
echo    ✅ src/pages/Catalogo_Limpio.jsx

echo.
echo 🚀 Iniciando proceso de deploy...

rem Paso 1: Agregar archivos
echo 1️⃣ Agregando archivos modificados...
git add src/pages/Catalogo.jsx src/pages/Productos.jsx src/pages/ProductosDisponibles.jsx src/pages/ListaPrecios.jsx src/pages/Catalogo_Limpio.jsx

if %errorlevel% neq 0 (
    echo    ❌ Error al agregar archivos
    pause
    exit /b 1
)
echo    ✅ Archivos agregados correctamente

rem Paso 2: Commit
echo.
echo 2️⃣ Creando commit...
git commit -m "Fix hamburguesa icons - Priority fix for 🍔 display"

if %errorlevel% neq 0 (
    echo    ❌ Error al crear commit
    pause
    exit /b 1
)
echo    ✅ Commit creado correctamente

rem Paso 3: Push
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
echo    https://sistema-artesanal-frontend-mp.vercel.app
echo.
echo 🍔 Después del deploy, las hamburguesas mostrarán:
echo    Hamburguesa Clasica → 🍔
echo    Hamburguesa De Pollo → 🍔  
echo    Hamburguesa Chistorra → 🍔
echo    Hamburguesa Pollo Con Tocipanceta → 🍔
echo.
echo ✅ ¡Listo! Espera 2-3 minutos y recarga la página

rem Abrir URL automáticamente
echo.
echo 🌐 Abriendo URL en 5 segundos...
timeout /t 5 /nobreak >nul
start https://sistema-artesanal-frontend-mp.vercel.app

pause
