# Auditoría: no aparecen datos desde el 26/02/2026

## Cambios en el frontend

1. **Petición con más registros:** Se envía `limit=5000` al endpoint `GET /api/auditoria` para solicitar más filas. Si el backend soporta el parámetro `limit`, devolverá hasta 5000 registros (incluyendo los más recientes).
2. **Sin caché:** Se usa `cache: 'no-store'` y un parámetro `_t` (timestamp) para evitar respuestas cacheadas.
3. **Aviso en pantalla:** Si el registro más reciente tiene más de 3 días, se muestra un mensaje indicando que el backend puede estar limitando o no registrando nuevas auditorías.

## Qué revisar en el backend

Si tras estos cambios la auditoría sigue sin mostrar información después del 26/02/2026:

1. **Límite por defecto en el endpoint de auditoría**  
   - Comprobar si `GET /api/auditoria` aplica un `LIMIT` fijo (ej. 100, 500) en la consulta SQL.  
   - Aceptar el query param `limit` y usarlo en la consulta (con un máximo razonable, ej. 5000).

2. **Orden y fechas**  
   - Asegurar que la consulta ordena por fecha/hora descendente (`ORDER BY fecha DESC` o equivalente) para que los registros más recientes aparezcan primero.

3. **Que se sigan registrando auditorías**  
   - Verificar que los triggers o el código que inserta en la tabla de auditoría se ejecuten en todos los flujos (crear/actualizar/eliminar en productos, ventas, etc.).  
   - Revisar logs del servidor por errores al escribir en la tabla de auditoría.

4. **Zona horaria**  
   - Si se filtra por `fecha_inicio`/`fecha_fin`, comprobar que las fechas se interpretan en la zona horaria correcta (ej. América/Caracas) y que no se excluyen por error los registros recientes.

5. **Nombre de la tabla y columnas**  
   - Confirmar que la tabla de auditoría existe, que las columnas de fecha tienen el tipo correcto y que no hay migraciones pendientes que afecten a este módulo.
