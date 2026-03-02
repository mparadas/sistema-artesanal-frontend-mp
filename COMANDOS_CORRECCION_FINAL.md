# 🚀 COMANDOS FINALES - CORRECCIÓN COMPLETA

## 📋 PASOS 1: CORREGIR PACKAGE.JSON Y SUBIR TODO

```bash
# 1. Agregar todos los cambios (incluyendo package.json corregido)
git add .

# 2. Commit con todas las correcciones
git commit -m "Complete fix: Render build + Image cache + Anular ventas

🔧 Render Build Fix:
- Fix package.json JSON syntax error
- Use node_modules/.bin/vite paths for Render compatibility
- Add postinstall script for executable permissions
- Bump version to 1.0.4 to force Render update

🖼️ Image Cache Fix:
- Add cache-busting to getImageUrl() for HTTP→HTTPS conversion
- Prevent browser from using cached HTTP versions of images
- Fix mixed content errors for agromae-b.onrender.com URLs
- Add timestamp parameter to force fresh image loads
- Resolve issue where chistorras disappear in catalog but work in table

💼 New Feature:
- Add anular ventas button for admin users only
- Implement validation for ventas < 2 days old
- Update Ventas.jsx with new anular functionality
- Add confirmation dialog with complete sale details"

# 3. Push forzado a GitHub
git push origin main --force
```

## ⏱️ Después de ejecutar:

1. **Render detectará cambios** (2-3 minutos)
2. **Build debería funcionar** sin errores JSON
3. **Imágenes de chistorras** deberían verse en catálogo
4. **Botón anular ventas** disponible para admins

## 🧪 Verificación:

### Render Build:
- Debería mostrar `agromae-frontend@1.0.4`
- Sin errores de JSON parse
- Sin errores de vite permission

### Imágenes:
- Chistorras deberían verse en catálogo
- Muslos deberían seguir funcionando
- URLs con `?v=timestamp` en DevTools

### Funcionalidad:
- Botón "Anular" visible para admins
- Solo en ventas < 2 días
- Confirmación antes de anular

---

**EJECUTAR ESTOS COMANDOS AHORA MISMO** 🚀
