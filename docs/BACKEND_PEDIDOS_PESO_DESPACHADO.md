# Backend: persistir peso despachado en ítems del pedido

Para que el registro del pedido en la lista muestre el peso despachado tras enviar a ventas (y al recargar la página), el backend debe hacer lo siguiente.

---

## 1. Al despachar: guardar en BD (POST `/api/pedidos/:id/despachar`)

Al procesar `items_despachados` (cada uno con `producto_id`, `cantidad_entregada`, `peso_entregado`):

- **Actualizar la tabla de ítems del pedido** (ej. `pedido_items` o la que una pedido con sus líneas) con:
  - `cantidad_entregada` = valor recibido
  - `peso_entregado` = valor recibido  
  para cada ítem que coincida por `pedido_id` + `producto_id` (o por `id` del ítem si lo envías).

Ejemplo de lógica (pseudocódigo):

```js
// Para cada item en req.body.items_despachados:
for (const item of items_despachados) {
  await pool.query(
    `UPDATE pedido_items 
     SET cantidad_entregada = $1, peso_entregado = $2 
     WHERE pedido_id = $3 AND producto_id = $4`,
    [item.cantidad_entregada, item.peso_entregado, pedidoId, item.producto_id]
  );
}
```

(Ajustar nombres de tabla/columnas según tu esquema.)

---

## 2. Al listar pedidos: devolver ítems con peso (GET `/api/pedidos`)

En la respuesta de GET `/api/pedidos` (o en el detalle de cada pedido), asegurar que cada ítem del pedido incluya:

- `cantidad_entregada`
- `peso_entregado`

Así el frontend puede calcular y mostrar el “peso total despachado” (suma de `peso_entregado` o `cantidad_entregada`) en la tarjeta del pedido.

Ejemplo de SELECT (ajustar a tu esquema):

```sql
SELECT 
  pi.id, pi.pedido_id, pi.producto_id, pi.cantidad_pedida,
  pi.cantidad_entregada, pi.peso_entregado,
  p.nombre AS producto_nombre, ...
FROM pedido_items pi
JOIN productos p ON p.id = pi.producto_id
WHERE pi.pedido_id = $1
```

---

## 3. Comprobar esquema

- Que la tabla de ítems del pedido tenga columnas `cantidad_entregada` y `peso_entregado` (o equivalentes). Si no existen, añadir migración.
- Que el endpoint de despacho actualice esas columnas y que el endpoint de listado/detalle de pedidos las devuelva en el JSON de cada ítem.

Con esto, el peso despachado se mantendrá en la lista de pedidos tanto en la actualización optimista del frontend como después de recargar.
