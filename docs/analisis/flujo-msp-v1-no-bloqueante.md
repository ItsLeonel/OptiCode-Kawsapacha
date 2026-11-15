# Kawsapacha V1 — Flujo agrícola sin bloqueos por revisión MSP

**Decisión funcional del equipo (14/11/2026).** Esta regla sustituye las instrucciones anteriores que exigían aprobación institucional antes de crear un huerto, cuidar una planta o registrar tareas agrícolas. El ranking competitivo queda fuera de la V1.

## Navegación principal acordada
La barra lateral del usuario muestra **solo cuatro módulos**: **Mi Huerto**, **Comunidad**, **Mi Camino Verde** y **Notificaciones** (este último al iniciar sesión). **Mi terreno**, **Catálogo medicinal**, **Mis plantas**, **Bitácora general** y el registro de actividades son funciones internas de **Mi Huerto**; sus rutas existentes se conservan para no perder historial ni enlaces. Los puntos, niveles e insignias se consultan dentro de **Mi Camino Verde**, no como otro enlace de la barra lateral.

## Comunidades
- **PENDING / NEEDS_CHANGES:** la comunidad permanece visible y operativa. Su creador y sus miembros autorizados pueden crear huertos, plantar y registrar actividades.
- **APPROVED:** el MSP confirmó los datos institucionales de la comunidad; no se crean nuevas actividades ni puntos por aprobarla.
- **REJECTED / SUSPENDED:** se preserva todo el historial, pero el backend bloquea nuevos registros agrícolas hasta resolver la situación institucional.

El usuario debe pertenecer al huerto o ser su creador. La ausencia de aprobación MSP **no** concede acceso a huertos ajenos.

## Plantas y tareas del huerto
- La planta y la evidencia de la siembra se guardan inmediatamente en SQLite y se reflejan en Mi Jardín, Bitácora y Pasaporte Vivo.
- Una siembra con estado de evidencia **PENDING / NEEDS_CHANGES** no bloquea riego, abonado, poda, observación o cosecha. Una parcela ocupada sigue sin admitir otra planta.
- Cada actividad se registra con su fecha, responsable y evidencia disponible. La revisión posterior no debe congelar actividades del mismo tipo en días posteriores.
- El calendario lunar **aconseja**; no representa una acción realizada hasta que una persona la registra. No se debe inventar crecimiento fotográfico ni atribuir etapas a partir del tiempo.
- Conservar controles de seguridad, acceso, idempotencia de reintentos y advertencias de exceso de riego/abono/poda.

## Recompensas y moderación
- Una actividad elegible recibe una **acreditación provisional** inmediatamente después del registro.
- El MSP puede **verificar** una actividad: su estado pasa a APPROVED y no se duplica el saldo.
- Puede solicitar corrección (NEEDS_CHANGES): la actividad sigue visible en el historial.
- Puede **invalidar** (REJECTED) una actividad pendiente o incluso ya verificada, registrando motivo, revisor y fecha. El saldo se revierte mediante un asiento negativo relacionado con el original, una sola vez.
- La invalidación también recalcula las misiones e insignias basadas en evidencias verificadas. El historial agrícola y la evidencia se conservan; no se elimina la planta por rechazar un registro.
- Una resolución REJECTED no se reabre sin proceso separado de corrección/apelación.

**Nota:** El saldo visible de Semillas incluye la parte provisional mientras está pendiente; se distingue del saldo verificado en el resumen del servidor. La V1 no usa estos puntos para determinar ganadores.

## Panel MSP
- Ver el historial completo de siembras y tareas, sin necesidad de aprobarlas una a una.
- Filtrar por comunidad y estado: PENDING, NEEDS_CHANGES, APPROVED, REJECTED o todos.
- Revisar evidencia, indicar justificación de rechazo/corrección y consultar ajustes de puntos.
- Mantener un registro de auditoría y notificaciones, sin dar acceso administrativo a usuarios comunes.

## Criterios de aceptación de V1
1. Crear comunidad PENDING → crear huerto → sembrar planta con foto → consultar Pasaporte.
2. Sin esperar aprobación, registrar riego/abono y recuperar Bitácora desde otra sesión del mismo usuario.
3. Registrar actividades de fechas diferentes mientras existen otras PENDING.
4. Recibir una sola acreditación provisional por acción elegible, respetando límites; aprobación MSP no duplica puntos.
5. Invalidar actividad PENDING/APPROVED: saldo baja una vez, la evidencia queda en historial, la auditoría identifica responsable.
6. Mostrar actividad en los cuatro estados y filtrar por comunidad y estado.
7. Probar permisos entre dos cuentas, límites de cuidados y persistencia sin alterar registros preexistentes.

## Exclusión V1
**Ranking nacional/provincial, auditoría de finalistas y entrega de premios:** V2, con criterios y reglas de competencia acordados con el cliente.
