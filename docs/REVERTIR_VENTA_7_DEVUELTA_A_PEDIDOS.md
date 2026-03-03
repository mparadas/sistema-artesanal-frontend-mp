# Revertir venta #7 devuelta a pedidos por error

Si pulsó **"Devolver a pedidos"** por error en la venta #7 y quiere dejarla otra vez como venta normal (pagada o pendiente), ejecute en la base de datos (Neon / PostgreSQL) el SQL que aplique a su esquema.

## 1. Restaurar la venta como pagada (si antes estaba pagada)

Ajuste nombres de tabla/columnas si en su BD son distintos (`ventas`, `estado_pago`, `saldo_pendiente`, `monto_pagado`, `total`).

```sql
-- Restaurar venta 7: estado pagado, saldo en cero, monto_pagado = total
UPDATE ventas
SET estado_pago = 'pagado',
    saldo_pendiente = 0,
    monto_pagado = total
WHERE id = 7;
```

Si la tabla tiene `estado_venta` o algo distinto a `estado_pago`, cámbielo en el `UPDATE`.

## 2. Si quiere dejarla pendiente para probar de nuevo el pago

```sql
UPDATE ventas
SET estado_pago = 'pendiente',
    saldo_pendiente = total,
    monto_pagado = 0
WHERE id = 7;
```

## 3. Desvincular del pedido (si su backend guarda relación venta–pedido)

Si tiene una tabla tipo `venta_pedido` o una columna `pedido_id` en `ventas`:

```sql
-- Ejemplo si existe columna pedido_id en ventas
UPDATE ventas SET pedido_id = NULL WHERE id = 7;
```

Después de ejecutar el `UPDATE`, recargue la app y la venta #7 debería verse de nuevo en Ventas con el estado elegido.
