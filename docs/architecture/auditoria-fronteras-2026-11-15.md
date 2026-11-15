# Auditoría de fronteras de arquitectura — rama refactor/monolito-modular-clean-v1

## Objetivo y alcance

Verificar dependencias, composición y acoplamiento técnico de backend y frontend sin modificar contratos HTTP, datos ni reglas agrícolas. Este informe refleja revisión estática y pruebas automatizadas; **no equivale a una aprobación funcional manual**.

## Backend

- Los servicios de `src/modules/*/application` revisados emplean puertos de repositorio y no importan el cliente Prisma directamente. Los puertos viven bajo `application/ports`; los adaptadores Prisma residen en `infrastructure`.
- Fachadas que antes reexportaban composición desde `application` fueron reemplazadas por módulos de composición en `activities/activity.module.ts`, `administration/admin-msp.module.ts` y los módulos existentes de cuidados y plantas. Se adaptaron consumidores y pruebas de integración.
- `care.controller.ts`, `harvest.controller.ts` y `user.controller.ts` ya no ejecutan consultas Prisma: usan casos de uso con puertos y adaptadores específicos.
- Los middleware de rol global, rol comunitario y autorización de cosecha consultan servicios compuestos; las decisiones se prueban sin base de datos.
- `npm run check:architecture` comprueba importaciones indebidas de dominio/aplicación, acceso desde presentación a infraestructura, consultas Prisma directas desde middleware y ciclos entre módulos. No sustituye un analizador semántico de dependencias.

### Atención especial: transacciones

La composición de `harvest.service.ts` realiza registros de cosecha, movimientos de inventario y cambio de estado mediante operaciones separadas. `activity-registration.service.ts` coordina cuidados, cosecha, actividad, evidencia, recompensas y misiones a través de varios puertos; **no se garantiza atomicidad integral** en la secuencia completa. La revisión de MSP sí contiene una transacción explícita en su adaptador de rechazo.

Esto no implica una regresión nueva, pero es deuda transaccional de la implementación que debe evaluarse con pruebas de integración y un puerto de unidad de trabajo antes de introducir cambios de atomicidad. No introducir transacciones multicomponente a ciegas durante una refactorización que exige comportamiento idéntico.

### Pruebas

Se añadieron casos aislados para permisos de cuidados/cosecha, consulta de usuarios y RBAC global/comunitario. El CI backend y Docker deben aprobar sobre el SHA final; registrar en el PR los enlaces de ejecución correspondientes.

## Frontend y Phaser

- `App.tsx` bajó de 1.412 a 1.296 líneas mediante extracción de catálogo, miembros comunitarios y carga persistente del jardín. La composición principal conserva handlers de altas, actualizaciones y bitácora, pendientes de una extracción posterior.
- `shared` no debe importar `features` ni `app`, verificado con `tools/check-frontend-architecture.cjs`.
- La integración de Phaser emplea `phaser-poc/adapter.ts`, `model.ts` y `bridge.ts` para recibir el estado visual desde React. El control estático bloquea imports directos desde Phaser a cliente HTTP y transporte de sesión.
- Las cuatro regiones, modalidades y parcelas se comprueban con suites de representación regional y Playwright; el resultado visual sobre datos reales no puede certificarse únicamente con imports.

## Condiciones de cierre no verificadas automáticamente

- Comparar contratos HTTP contra el baseline de `main`.
- Probar manualmente cuatro regiones, cuatro modalidades, seis parcelas, fotografías existentes, nuevas evidencias y bitácora.
- Confirmar persistencia de SQLite y volúmenes de uploads usando copia y sin reinicializar datos reales.
- Registrar y separar los tres errores preexistentes del jardín observados en `main`, sin considerarlos nuevas regresiones de arquitectura.
- Revisar las dependencias y responsabilidades restantes de los handlers de `App.tsx`.

El PR continúa sin fusionar mientras estos puntos no estén acreditados.
