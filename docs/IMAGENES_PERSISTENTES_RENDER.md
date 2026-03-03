# Por qué se pierden las imágenes tras deploy (Render) y cómo solucionarlo

## Causa

En **Render** el sistema de archivos del servicio es **efímero**: cada deploy o reinicio arranca un contenedor nuevo y se borra todo lo escrito en disco. Las fotos que el backend guarda en `uploads/productos/` desaparecen. En la base de datos solo queda la ruta (`/uploads/productos/foto.jpg`), pero el archivo ya no existe → la imagen no carga.

---

## Solución 1: Disco persistente de Render (recomendado si ya guardas en disco)

Render permite **añadir un disco persistente** al servicio. Todo lo que el backend escriba en la ruta montada se conserva entre deploys.

### Pasos

1. En **Render Dashboard** → tu **servicio backend** (agromae-b).
2. **Settings** → **Disks** → **Add Disk**.
3. **Mount Path**: debe ser la carpeta donde el backend escribe las imágenes.
   - Si en el backend usas algo como `./uploads` o `uploads/`, la ruta absoluta en Render suele ser:
   - **`/opt/render/project/src/uploads`**
   - (Ajusta si tu backend usa otra ruta; debe coincidir con donde se hace `writeFile` o `mkdir`.)
4. Elige un tamaño (ej. 1 GB).
5. Guarda y haz **redeploy** del servicio.

### En el backend (sistema-artesanal-backend-mp)

- Asegúrate de que las imágenes se guardan **siempre** en esa misma ruta. Por ejemplo, usar una ruta absoluta en producción:

```js
const path = require('path');
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
// y guardar en UPLOADS_DIR + '/productos/...'
```

- En Render puedes definir la variable de entorno **`UPLOADS_DIR`** = `/opt/render/project/src/uploads` y que el backend use esa variable para construir la ruta de guardado. Así el disco montado en ese path conservará las fotos.

---

## Solución 2: Cloudinary (URLs en BD, sin disco en el servidor)

Subir las imágenes a **Cloudinary** (u otro almacenamiento externo) y guardar en la BD solo la URL que devuelvan. No dependes del disco del servidor.

- **Backend**: en el endpoint `POST /uploads/productos`, en lugar de escribir en disco, subir el archivo a Cloudinary con su API y devolver la URL (ej. `https://res.cloudinary.com/...`).
- **Base de datos**: en `imagen_url` guardar esa URL completa.
- **Frontend**: ya está preparado: si `imagen_url` es una URL `https://`, `getImageUrl` la usa tal cual.

Ventaja: las imágenes no se pierden nunca con los deploys y no necesitas disco en Render.

---

## Resumen

| Opción              | Qué hacer |
|---------------------|-----------|
| **Disco Render**    | Añadir disco al servicio, mount path = carpeta de uploads del backend (ej. `/opt/render/project/src/uploads`), y que el backend escriba ahí. |
| **Cloudinary**      | Cambiar el endpoint de subida en el backend para subir a Cloudinary y guardar en BD la URL que devuelvan. |

Mientras tanto, el frontend ya usa **fallback** (`/logo_agromae.png`) cuando la imagen falla al cargar, así que la interfaz no se rompe; solo se ven las fotos viejas perdidas hasta que re-subas o reconfigurees el almacenamiento.
