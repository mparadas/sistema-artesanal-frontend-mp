# Operacion Blindaje 21 - Fase 1 (Semana 1)

Objetivo de fase: cerrar brechas criticas de seguridad y dejar base estable para fases 2 y 3.

## Dia 1 - Secretos y acceso base

- [ ] Definir en Render/entorno productivo: `DATABASE_URL`, `JWT_SECRET`, `ADMIN_PASS`.
- [ ] Rotar cualquier clave expuesta previamente (BD, JWT, admin).
- [ ] Verificar que el backend arranca solo si hay variables obligatorias en produccion.
- [ ] Confirmar login admin con nueva clave.

## Dia 2 - Endpoints de mutacion blindados

- [ ] Validar que mutaciones privadas sin token devuelven `401`.
- [ ] Validar que mutaciones con rol no autorizado devuelven `403`.
- [ ] Confirmar excepciones publicas permitidas (`/api/auth/login`, `/api/public/pedidos`, salud).
- [ ] Revisar desde frontend que flujos admin siguen funcionando con token.

## Dia 3 - Limpieza de scripts inseguros

- [ ] Eliminar o aislar scripts legacy con credenciales hardcodeadas.
- [ ] Migrar scripts operativos a uso de variables de entorno.
- [ ] Marcar scripts de prueba para no usar en produccion.
- [ ] Documentar un comando seguro de reseteo de admin.

## Dia 4 - Auditoria minima y endurecimiento

- [ ] Verificar trazas de auditoria en acciones sensibles (ventas, pedidos, produccion, usuarios).
- [ ] Revisar CORS en produccion y eliminar origenes de desarrollo no necesarios.
- [ ] Confirmar limites de peticiones para rutas publicas.
- [ ] Probar manejo de errores sin exponer informacion sensible.

## Dia 5 - Cierre tecnico de fase

- [ ] Prueba integral: login, crear pedido, convertir venta, registrar abono, producir receta.
- [ ] Checklist de regresion movil y escritorio.
- [ ] Publicar cambios a repositorio y desplegar.
- [ ] Registrar evidencia de pruebas y pendientes de Fase 2.

## Criterios de exito de Fase 1

- No existen secretos hardcodeados en runtime principal.
- Mutaciones privadas requieren autenticacion.
- Entorno productivo obliga configuracion de variables criticas.
- Flujo operativo principal funciona sin regresiones bloqueantes.
