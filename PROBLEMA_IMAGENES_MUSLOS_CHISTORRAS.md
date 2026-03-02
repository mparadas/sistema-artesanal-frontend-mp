# 🔍 ANÁLISIS: ¿Por qué muslos se ven pero chistorras desaparecen?

## 📊 DATOS REALES EXTRAÍDOS DE LA BASE DE DATOS

### 🍗 **MUSLOS (ID: 22)**
```json
"imagen_url": "http://192.168.100.224:3000/uploads/productos/1772139592838-descarga-jpg-7f6f6d29.jpg"
```

### 🌭 **CHISTORRA (ID: 44)**
```json
"imagen_url": "http://agromae-b.onrender.com/uploads/productos/1772408049776-WhatsApp-Image-2026-03-01-at-1-15-13-PM--2f602de4.jpg"
```

## 🎯 **PROBLEMA IDENTIFICADO: CACHÉ DE NAVEGADOR**

### 📋 **¿Qué está pasando realmente?**

#### **🍗 MUSLOS - FUNCIONAN BIEN:**
1. **URL local:** `http://192.168.100.224:3000/...`
2. **Conversión:** `getImageUrl()` la convierte a `https://agromae-b.onrender.com/...`
3. **Resultado:** Imagen se carga correctamente
4. **Caché:** Navegador guarda la versión convertida

#### **🌭 CHISTORRA - PROBLEMA DE CACHÉ:**
1. **URL producción:** `http://agromae-b.onrender.com/...`
2. **Conversión:** `getImageUrl()` la convierte a `https://agromae-b.onrender.com/...`
3. **Problema:** Navegador tiene versión HTTP en caché
4. **Conflicto:** HTTP vs HTTPS en caché

## 🔍 **ANÁLISIS TÉCNICO DEL PROBLEMA:**

### **📱 Comportamiento del Navegador:**

#### **Escenario Muslos:**
```
1. Navegador pide: http://192.168.100.224:3000/imagen.jpg
2. getImageUrl() convierte a: https://agromae-b.onrender.com/imagen.jpg
3. Navegador descarga: https://agromae-b.onrender.com/imagen.jpg
4. Navegador guarda en caché: https://agromae-b.onrender.com/imagen.jpg ✅
```

#### **Escenario Chistorras:**
```
1. Navegador pide: http://agromae-b.onrender.com/imagen.jpg
2. getImageUrl() convierte a: https://agromae-b.onrender.com/imagen.jpg
3. Navegador busca en caché: "¡Ya tengo http://agromae-b.onrender.com/imagen.jpg!"
4. Navegador usa versión HTTP en caché ❌
5. HTTP es bloqueado por seguridad (mixed content)
6. Imagen desaparece
```

### **🚫 Mixed Content Error:**
```
La página usa HTTPS pero la imagen usa HTTP → Bloqueada por seguridad
```

## 🔧 **SOLUCIONES POSIBLES:**

### **Opción 1: Forzar limpieza de caché**
```javascript
// En getImageUrl()
export const getImageUrl = (imagePath) => {
  if (!imagePath) return placeholder
  
  let finalUrl = imagePath
  
  // Si es HTTP de agromae-b, forzar HTTPS con timestamp
  if (imagePath.includes('agromae-b.onrender.com')) {
    finalUrl = imagePath.replace('http://', 'https://')
    // Agregar timestamp para evitar caché
    finalUrl += `?t=${Date.now()}`
  }
  
  return finalUrl
}
```

### **Opción 2: Actualizar base de datos**
```sql
UPDATE productos 
SET imagen_url = REPLACE(imagen_url, 'http://', 'https://')
WHERE imagen_url LIKE 'http://agromae-b.onrender.com%';
```

### **Opción 3: Headers de no-caché**
```javascript
// Agregar headers para evitar caché
const headers = new Headers({
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
})
```

## 🎯 **¿Por qué funciona en tabla pero no en catálogo?**

### **📊 Diferencia de componentes:**

#### **Tabla de Productos:**
- **Recarga más frecuente**
- **Menos caché**
- **Renderizado más simple**
- **Carga imágenes individualmente**

#### **Catálogo:**
- **Carga todas las imágenes juntas**
- **Más propenso a caché**
- **Renderizado complejo**
- **Lazy loading puede interferir**

### **🔄 Timing de carga:**
```
Tabla: Carga imagen → Procesa → Muestra
Catálogo: Carga todas → Procesa → Algunas fallan por caché
```

## 📋 **VERIFICACIÓN DEL PROBLEMA:**

### **1. 🌐 Abrir DevTools:**
1. **F12** → Network tab
2. Filtrar por "Img"
3. Buscar imágenes de chistorras
4. Ver si hay errores (mixed content)

### **2. 🔍 Inspeccionar elemento:**
```html
<!-- Chistorra en catálogo -->
<img src="http://agromae-b.onrender.com/uploads/..." 
     onerror="this.src='placeholder'" 
     style="display: none">
```

### **3. 📱 Limpiar caché:**
- **Ctrl+Shift+R** (Hard refresh)
- **F12** → Application → Storage → Clear site data

## 🎯 **DIAGNÓSTICO DEFINITIVO:**

### **Si el problema es caché:**
- **Hard refresh** soluciona temporalmente
- **Vuelve a fallar** después de navegar

### **Si el problema es mixed content:**
- **Console muestra errores** HTTPS/HTTP
- **Imágenes bloqueadas** por seguridad

### **Si el problema es servidor:**
- **Status 404** en imágenes
- **Timeout** en carga

## 🚀 **SOLUCIÓN RECOMENDADA:**

### **Actualizar getImageUrl() con cache-busting:**
```javascript
export const getImageUrl = (imagePath) => {
  if (!imagePath) return placeholder
  
  let finalUrl = imagePath
  
  // Convertir HTTP a HTTPS para agromae-b
  if (imagePath.includes('agromae-b.onrender.com')) {
    finalUrl = imagePath.replace('http://', 'https://')
    // Agregar timestamp solo para URLs HTTP originales
    if (imagePath.startsWith('http://')) {
      finalUrl += `?v=${Date.now()}`
    }
  }
  
  return finalUrl
}
```

---

**✅ El problema es CACHÉ del navegador con versiones HTTP/HTTPS mezcladas**
