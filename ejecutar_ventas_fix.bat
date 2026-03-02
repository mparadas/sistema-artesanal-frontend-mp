@echo off
echo 🚀 SUBIENDO CORRECCIONES MÓDULO VENTAS
echo =====================================
echo.

echo 📋 Cambios realizados:
echo    • Corregida validación para devolver ventas
echo    • Mensajes consistentes (devolver a pedidos)
echo    • Backend actualizado con estado correcto
echo    • Botones y tooltips corregidos
echo.

echo ⏳ Paso 1: Verificando estado...
cd /d "C:\users\miguel prada\agromae-web'frontend\sistema-artesanal-frontend-mp"
git status

echo.
echo ⏳ Paso 2: Agregando cambios...
git add .

echo.
echo ⏳ Paso 3: Creando commit...
git commit -m "Fix módulo ventas - Anular y Devolver a Pedidos

Frontend:
- Corregida validación puedeDevolverAPedidos (permite pendientes, pagadas, parciales)
- Mensajes consistentes: 'devolver a pedidos' en lugar de 'anular'
- Botón actualizado: 'Devolver' en lugar de 'Anular'
- Tooltips corregidos: 'Devolver a pedidos (montos en cero)'

Backend:
- Estado consistente: 'devuelta_a_pedidos' en lugar de 'anulada'
- Mensajes corregidos: 'Venta devuelta a pedidos correctamente'
- Logs actualizados: 'Devolviendo venta a pedidos'
- Respuesta JSON: ventaDevuelta en lugar de ventaAnulada

Fix:
- Inconsistencia entre frontend y backend
- Mensajes confusos para el usuario
- Validación restrictiva (solo pendientes)
- Estados diferentes entre sistemas"

echo.
echo ⏳ Paso 4: Enviando a GitHub...
git push origin main

echo.
echo 🎉 ¡CORRECCIONES SUBIDAS!
echo.
echo 📊 Resumen:
echo    • Módulo de ventas optimizado: ✅
echo    • GitHub actualizado: ✅
echo    • Deploy Vercel: ⏳ (2-3 minutos)
echo.

echo 🌐 Para verificar:
echo    1. Esperar 2-3 minutos para deploy
echo    2. Recargar módulo de ventas
echo    3. Probar función "Devolver a pedidos"
echo.

echo ✅ ¡Módulo de ventas corregido y optimizado!

pause
