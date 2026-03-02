# 🖼️ CORRECCIÓN DE CACHÉ DE IMÁGENES - COMANDOS PARA EJECUTAR

## 📋 COMANDOS PARA SUBIR LA CORRECCIÓN:

```bash
# 1. Agregar cambios
git add src/utils/imageUtils.js

# 2. Commit con la corrección
git commit -m "Fix image cache issue - chistorras disappearing

- Add cache-busting to getImageUrl() for HTTP→HTTPS conversion
- Prevent browser from using cached HTTP versions of images
- Fix mixed content errors for agromae-b.onrender.com URLs
- Add timestamp parameter to force fresh image loads
- Resolve issue where chistorras disappear in catalog but work in table"

# 3. Push a GitHub
git push origin main
```

## ✅ ¿Qué soluciona esta corrección?

### **🔥 Problema:**
- Chistorras usan `http://agromae-b.onrender.com/...`
- Navegador tiene versión HTTP en caché
- Mixed content error bloquea las imágenes
- Imágenes desaparecen en catálogo

### **🚀 Solución:**
- Convierte `http://` → `https://`
- Agrega `?v=timestamp` para evitar caché
- Fuerza carga fresca de imágenes HTTPS
- Previene mixed content errors

## 📊 Antes vs Después:

### **Antes:**
```
ENTRADA: http://agromae-b.onrender.com/imagen.jpg
SALIDA:  https://agromae-b.onrender.com/imagen.jpg
PROBLEMA: Navegador usa caché HTTP → Bloqueada
```

### **Después:**
```
ENTRADA: http://agromae-b.onrender.com/imagen.jpg
SALIDA:  https://agromae-b.onrender.com/imagen.jpg?v=1677634567890
SOLUCIÓN: URL única → Sin caché → Funciona
```

## ⏱️ Después de ejecutar:

1. **Render detectará cambios** (2-3 minutos)
2. **Build y deploy** (1-2 minutos)
3. **Las chistorras deberían verse** en catálogo
4. **Hard refresh** para limpiar caché antigua

## 🧪 Para verificar la solución:

1. **Abre catálogo de productos**
2. **Busca chistorras**
3. **Deberían verse las imágenes** sin desaparecer
4. **DevTools Network** → Ver URLs con `?v=timestamp`

---

**COPIA Y PEGA ESTOS COMANDOS AHORA MISMO** 🚀
