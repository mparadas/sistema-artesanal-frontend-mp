# 🖼️ COMPARACIÓN DE IMÁGENES: MUSLOS VS CHISTORRAS

## 📋 CARACTERÍSTICAS DE `imagen_url` EN PRODUCTOS

### 🔍 **Función de procesamiento de imágenes:**
```javascript
// En src/utils/imageUtils.js
export const getImageUrl = (imagePath) => {
  // 1. Si es URL completa → Verificar y convertir
  // 2. Si es ruta relativa → Combinar con base URL
  // 3. Si está vacía → Usar placeholder
}
```

### 🎯 **Características comunes de imagen_url:**

#### **1. 📂 Formatos de URL aceptados:**
- **URLs completas:** `https://agromae-b.onrender.com/uploads/producto.jpg`
- **Rutas relativas:** `/uploads/producto.jpg`
- **URLs locales:** `http://localhost:3000/uploads/imagen.jpg` (se convierten)

#### **2. 🔄 Conversiones automáticas:**
- **Local → Producción:** `192.168.100.224` → `https://agromae-b.onrender.com`
- **HTTP → HTTPS:** `http://agromae-b.onrender.com` → `https://agromae-b.onrender.com`

#### **3. 🖼️ Placeholder por defecto:**
```javascript
'https://placehold.co/320x220/F97316/FFFFFF?text=Producto'
```

### 📊 **Diferencias esperadas entre Muslos y Chistorras:**

#### **🍗 MUSLOS (Carnes Frías):**
- **Categoría:** `Carnes Frías`
- **Tipo:** `producido` o `comprado`
- **Típico imagen_url:** 
  - `/uploads/muslos-pollo-crujientes.jpg`
  - `https://agromae-b.onrender.com/uploads/muslos.jpg`
  - Placeholder si no tiene imagen

#### **🌭 CHISTORRAS (Embutidos):**
- **Categoría:** `Chistorras` o `Embutidos`
- **Tipo:** `producido`
- **Típico imagen_url:**
  - `/uploads/chistorras-artesanales.jpg`
  - `https://agromae-b.onrender.com/uploads/chistorra.jpg`
  - Placeholder si no tiene imagen

### 🔍 **Para verificar las diferencias reales:**

#### **Opción 1: Revisar en la aplicación:**
1. Ve a **Productos** en AgroMAE
2. Filtra por **"Carnes Frías"** → busca muslos
3. Filtra por **"Chistorras"** → busca chistorras
4. Compara las URLs de imagen

#### **Opción 2: Verificar en la base de datos:**
```bash
# Revisar productos de muslos
curl "https://agromae-b.onrender.com/api/productos?categoria=Carnes%20Frías" | grep -i muslo

# Revisar productos de chistorras  
curl "https://agromae-b.onrender.com/api/productos?categoria=Chistorras" | grep -i chistorra
```

#### **Opción 3: Inspeccionar el código fuente:**
En el navegador, inspecciona las imágenes:
```html
<!-- Muslos -->
<img src="https://agromae-b.onrender.com/uploads/muslos.jpg" ...>

<!-- Chistorras -->
<img src="https://agromae-b.onrender.com/uploads/chistorras.jpg" ...>
```

### 🎯 **Posibles diferencias a encontrar:**

#### **1. 📏 Dimensiones de imagen:**
- **Muslos:** Generalmente imágenes más grandes (productos principales)
- **Chistorras:** Pueden ser imágenes más pequeñas (productos secundarios)

#### **2. 🎨 Calidad/Estilo:**
- **Muslos:** Fotos reales del producto
- **Chistorras:** Pueden ser ilustraciones o fotos genéricas

#### **3. 📂 Nombres de archivo:**
- **Muslos:** `muslos-pollo.jpg`, `muslos-cocidos.jpg`
- **Chistorras:** `chistorra-navarra.jpg`, `chistorra-artesanal.jpg`

#### **4. 🔗 Formato de URL:**
- **Muslos:** Pueden usar URLs absolutas
- **Chistorras:** Pueden usar rutas relativas

### 📋 **Tabla comparativa esperada:**

| Característica | Muslos | Chistorras |
|---------------|--------|------------|
| **Categoría** | Carnes Frías | Chistorras/Embutidos |
| **URL típica** | `/uploads/muslos-*.jpg` | `/uploads/chistorra-*.jpg` |
| **Placeholder** | ✅ Si no tiene imagen | ✅ Si no tiene imagen |
| **Conversión HTTPS** | ✅ Automática | ✅ Automática |
| **Fallback** | `placehold.co/320x220/F97316` | `placehold.co/320x220/F97316` |

---

**¿Quieres que revise los datos reales de la API para ver las diferencias específicas?**
