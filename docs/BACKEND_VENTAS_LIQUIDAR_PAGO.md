# Backend: marcar venta como pagada cuando el abono cubre el saldo

## Contexto

En el módulo Ventas, cuando el usuario hace clic en **"Pagar restante"** y luego **"Agregar abono"**, el monto enviado puede ser igual al saldo pendiente de la venta. En ese caso debe procesarse como **pago total** y la venta debe quedar en estado **pagada**, no solo con un abono más.

## Cambio en el frontend

En `POST /api/ventas/:id/pagos` el frontend envía un campo opcional:

- **`liquidar`** (boolean): `true` cuando el monto del abono cubre (o casi cubre) el saldo pendiente de esa venta.

## Comportamiento esperado en el backend

En el endpoint que registra el pago (por ejemplo `POST /api/ventas/:id/pagos`):

1. Aplicar el pago como hasta ahora (insertar en tabla de pagos, actualizar `saldo_pendiente`, etc.).
2. Si en el body viene **`liquidar === true`**, o si tras aplicar el pago el **`saldo_pendiente` de la venta queda en 0** (o por debajo de un umbral pequeño), actualizar la venta:
   - `estado_pago = 'pagado'`
   - `saldo_pendiente = 0` (si no se calcula solo)

Así, cuando el usuario paga el restante desde el botón verde "Pagar", la venta queda marcada como **pagada** y no solo con un abono parcial.
