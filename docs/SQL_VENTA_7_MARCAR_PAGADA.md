# Marcar venta 7 como pagada en la base de datos

Ejecuta en tu base de datos (Neon u otro) el siguiente SQL para que la venta 7 quede registrada como **pagada** y con saldo 0.

Ajusta el nombre de la tabla si en tu backend no se llama `ventas` (por ejemplo `venta`, `sales`, etc.):

```sql
-- Marcar venta 7 como pagada y saldo en 0
UPDATE ventas
SET estado_pago = 'pagado',
    saldo_pendiente = 0
WHERE id = 7;
```

Si tu tabla tiene nombres de columnas en inglés u otro esquema, podría ser algo como:

```sql
UPDATE ventas
SET payment_status = 'pagado',   -- o 'paid' si tu backend usa inglés
    balance_due = 0
WHERE id = 7;
```

Después de ejecutar, recarga el módulo Ventas en el frontend; la venta 7 debería mostrarse como **pagada** (badge verde) y no mostrar botones "Abonar" ni "Devolver a pedidos".
