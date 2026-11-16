# ADR-0002 — Límites transaccionales durante la migración arquitectónica

**Estado:** revisión completada; excepciones explícitas para la refactorización sin cambios de comportamiento.  
**Alcance:** actividades agrícolas, cosecha/inventario, recompensas y revisión MSP.

## Decisión

La migración a monolito modular **no debe cambiar la semántica de negocio ni el orden de los efectos observables**. Los puertos y adaptadores separan detalles de Prisma del dominio, pero el uso de interfaces por sí solo no convierte una secuencia distribuida entre módulos en una transacción atómica.

Se mantienen las transacciones ya existentes; no se agrega una transacción global que mezcle archivos del disco, SQLite, recompensas y notificaciones sin pruebas de rollback y contratos de error.

## Mapa comprobado del código

| Proceso | Límite actual | Riesgo observado | Decisión de esta fase |
| --- | --- | --- | --- |
| Rechazo MSP de actividad y planta de siembra | `prisma-msp-activity.repository.ts` usa `prisma.$transaction` | Las notificaciones/auditorías externas a la transacción necesitan su propia gestión de errores | Conservar |
| Anulación de actividad | `prisma-activity-void.repository.ts` usa `prisma.$transaction` | Recompensas/misiones se coordinan después, en otros componentes | Conservar |
| Registro de actividad | `activity-registration.service.ts`: cuidado/cosecha → actividad → evidencia → puntos → misiones | Un fallo posterior puede dejar escrituras previas completas, salvo reglas existentes de recuperación | Documentar excepción, probar fallos y reintentos |
| Cosecha e inventario | `harvest.service.ts`: vincular huerto, crear cosecha, actualizar existencias y marcar rebrote | Operaciones Prisma separadas; una falla intermedia puede dejar estado parcial | Documentar excepción, evaluar unidad de trabajo |
| Recompensa y ledger | `rewards.service.ts` verifica duplicados y registra el premio; índice único en base de datos | La idempotencia de premio no garantiza atomicidad de actividad + premio + misión | Preservar idempotencia; validar reintentos |
| Fotografía/evidencia | Almacenamiento de archivos y registro SQL en adaptadores distintos | Las transacciones SQLite no revierten bytes ya escritos | Requiere compensación explícita y pruebas de fallo |

## Propuesta de evolución (fuera del cambio mecánico de arquitectura)

1. Definir operaciones atómicas por agregado y un puerto `UnitOfWork` donde exista una invariante de datos concreta, no un acoplamiento transaccional genérico entre todos los módulos.
2. En adaptadores, crear repositorios ligados al mismo cliente `Prisma.TransactionClient` para agrupar cambios de cosecha, inventario y estado. Evitar transacciones anidadas.
3. Diseñar compensación de fotografías y una salida duradera para notificaciones/recompensas que ocurren después del commit (patrón outbox si se justifica).
4. Probar fallos después de cada escritura y reintentos con los identificadores de idempotencia existentes, sobre SQLite temporal, antes de alterar la semántica de los errores.
5. Documentar y aprobar los cambios observables de rollback como corrección funcional diferenciada de este PR arquitectónico.

## Criterio de aceptación de esta revisión

- [x] Identificados los límites atómicos existentes y los flujos multioperación sin unidad de trabajo.
- [x] Priorizadas las excepciones y plan para corregirlas con pruebas específicas.
- [x] Sin cambios en `schema.prisma`, migraciones, rutas HTTP ni fotos persistidas durante esta revisión.
- [ ] Pruebas de inyección de errores y recuperación, que pertenecen a la validación funcional posterior.

**No equivale a garantizar atomicidad integral de los flujos.** Evitar declarar propiedades ACID que el código no implementa.
