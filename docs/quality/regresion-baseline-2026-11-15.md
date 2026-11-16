# Línea base de regresión — 15 de noviembre de 2026

**Objetivo:** distinguir los defectos previos de posibles regresiones derivadas del cambio de arquitectura. No se alteran las pruebas ni las funcionalidades existentes en este PR.

## Evidencia comparada

| Rama | Commit | Workflow | Resultado |
| --- | --- | --- | --- |
| `main` (antes de la migración) | `e9ef2a6d` | [Frontend Actions #43683034306](https://github.com/ItsLeonel/OptiCode-Kawsapacha/actions/runs/43683034306) | 29 aprobadas, **3 fallidas** |
| `refactor/monolito-modular-clean-v1` (primer movimiento de App) | `bb6475ba` | [Frontend Actions #43684388554](https://github.com/ItsLeonel/OptiCode-Kawsapacha/actions/runs/43684388554) | 29 aprobadas, **3 fallidas** |

Los **mismos tres casos** fallaron en ambas ejecuciones:

1. `tests/garden-poc-living.spec.ts:46` — bitácora agrícola, nueve actividades, fotos reales y cosecha reversible; espera un botón de actualización de evidencia en el pasaporte.
2. `tests/garden-poc-living.spec.ts:120` — espejo digital, actualización de fotografía, traslado, archivo/restauración; timeout en el botón de actualización.
3. `tests/garden-poc-production.spec.ts:7` — jardín persistente, edición regional, progreso y recompensas; el botón de registrar actividad permanece deshabilitado.

## Conclusión y límites

- Los fallos **preexistían a la refactorización**, por lo que no deben atribuirse automáticamente al traslado de carpetas.
- Esto **no demuestra** que la migración sea funcionalmente equivalente en todos los escenarios. Las ejecuciones del último commit del PR, pruebas manuales y comparación de flujos siguen siendo necesarias.
- Los fallos funcionales requieren un trabajo distinto de corrección con requisitos del cliente. No cambiar sus comportamientos dentro de un PR de refactorización estrictamente arquitectónica.
- La entrega de esta rama se mantiene como **PR borrador y no fusionado** mientras existan verificaciones pendientes.

Consultar [criterios de mantenibilidad](README.md).
