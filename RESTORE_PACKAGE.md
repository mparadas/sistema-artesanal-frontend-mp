# 🔄 RESTAURAR PACKAGE.JSON - COMANDOS PARA EJECUTAR

## 📋 COMANDOS PARA RESTAURAR Y CORREGIR:

```bash
# 1. Restaurar package.json a versión válida
git checkout HEAD~1 -- package.json

# 2. Verificar que esté correcto
type package.json

# 3. Actualizar versión y scripts manualmente
echo { > package.json
echo   "name": "agromae-frontend", >> package.json
echo   "private": true, >> package.json
echo   "version": "1.0.4", >> package.json
echo   "type": "module", >> package.json
echo   "scripts": { >> package.json
echo     "dev": "node_modules/.bin/vite --host", >> package.json
echo     "dev-local": "node_modules/.bin/vite --host 192.168.100.224", >> package.json
echo     "build": "node_modules/.bin/vite build", >> package.json
echo     "lint": "eslint .", >> package.json
echo     "preview": "node_modules/.bin/vite preview", >> package.json
echo     "start": "npm run dev", >> package.json
echo     "postinstall": "chmod +x node_modules/.bin/*" >> package.json
echo   }, >> package.json
echo   "dependencies": { >> package.json
echo     "@vitejs/plugin-react": "^5.1.4", >> package.json
echo     "autoprefixer": "^10.4.24", >> package.json
echo     "axios": "^1.13.5", >> package.json
echo     "clsx": "^2.1.1", >> package.json
echo     "lucide-react": "^0.574.0", >> package.json
echo     "postcss": "^8.5.6", >> package.json
echo     "react": "^19.2.0", >> package.json
echo     "react-dom": "^19.2.0", >> package.json
echo     "react-router-dom": "^7.13.0", >> package.json
echo     "react-toastify": "^11.0.5", >> package.json
echo     "tailwind-merge": "^3.5.0", >> package.json
echo     "tailwindcss": "^3.4.19", >> package.json
echo     "terser": "^5.34.1", >> package.json
echo     "vite": "^5.4.10" >> package.json
echo   }, >> package.json
echo   "devDependencies": { >> package.json
echo     "@eslint/js": "^9.39.1", >> package.json
echo     "@types/react": "^19.2.7", >> package.json
echo     "@types/react-dom": "^19.2.3", >> package.json
echo     "eslint": "^9.39.1", >> package.json
echo     "eslint-plugin-react-hooks": "^7.0.1", >> package.json
echo     "eslint-plugin-react-refresh": "^0.4.24", >> package.json
echo     "globals": "^16.5.0" >> package.json
echo   }, >> package.json
echo   "overrides": {}, >> package.json
echo   "homepage": "https://agromae.onrender.com", >> package.json
echo   "engines": { >> package.json
echo     "node": ">=18.0.0", >> package.json
echo     "npm": ">=8.0.0" >> package.json
echo   } >> package.json
echo } >> package.json

# 4. Agregar y commit
git add package.json
git commit -m "Fix package.json JSON syntax - version 1.0.4

- Restore valid JSON format
- Fix vite permission error with node_modules/.bin paths
- Add postinstall script for executable permissions
- Bump version to 1.0.4"

# 5. Push
git push origin main
```

## ✅ DESPUÉS DE EJECUTAR:

Render debería poder parsear el package.json correctamente y construir sin errores.

---

**COPIA Y PEGA ESTOS COMANDOS EN TU TERMINAL** 🚀
