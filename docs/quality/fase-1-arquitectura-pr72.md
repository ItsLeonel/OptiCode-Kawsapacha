# PR #72 — Registro de cierre estructural de la Fase 1

**Rama:** `refactor/monolito-modular-clean-v1`  
**Base:** `main` (`e9ef2a6d`)  
**No fusionado.** El cierre funcional depende de CI, pruebas con datos reales y regresión manual (Fase 2).

## Cambios de responsabilidad

- Registro/edición de plantas, bitácora y actividades: handlers trasladados de `frontend/src/app/App.tsx` a `features/my-garden`.
- Registro/edición de comunidades y huertos: coordinador separado `app/setup-actions.ts`, evitando que una feature incorpore la lógica de otra.
- Catálogo, roles y miembros: hooks de feature ya separados.
- Contrato de borrador de registro independiente de `PlantRegistrationModal`, con reexportación compatible.
- La comunicación con Phaser utiliza el adaptador de modelo y el puente de eventos; un control del CI impide importaciones directas a HTTP o imports inversos `features → app`.
- Los puertos/adaptadores y las reglas de dependencia del backend habían sido reforzados en la parte anterior de la misma migración.

## Comparación estática verificable

| Evidencia | Resultado |
| --- | --- |
| `App.tsx` previo a Fase 1 | 1.296 líneas |
| `App.tsx` tras extraer registros y bitácora | 831 líneas |
| Archivos Phaser en esta fase | 80, contenido idéntico al commit `65d74ac6` |
| Archivos `backend/prisma` vs `main` | 13, sin diferencias de hash |
| Contratos REST | Prueba `backend/tests/api-route-contract.test.cjs` comprueba puntos de montaje y orden |
| Comandos cliente | Nuevas pruebas unitarias de planta y actividad en modo visitante |
| Puente React–Phaser | Nueva prueba unit de eventos, bloqueo y aislamiento |

No se deduce equivalencia funcional únicamente de estas comparaciones. La validación definitiva requiere CI y flujo manual con los datos y fotos persistentes.

## Límites transaccionales

Se completó la revisión en [ADR-0002](../architecture/ADR-0002-limites-transaccionales.md). Las transacciones existentes permanecen; se registran excepciones en actividad, cosecha e inventario. **No se declara atomicidad de extremo a extremo.** Adoptar un `UnitOfWork` requerirá pruebas de errores y decisión explícita sobre reversión/compensación, diferenciando ese trabajo de la migración puramente estructural.

## Fase 2 (no iniciar merge)

Comparar contratos de API, roles, fotografías y datos reales, ejecutar Playwright completo, corregir regresiones nuevas, documentar resultados finales. Los fallos preexistentes del jardín figuran en `regresion-baseline-2026-11-15.md`.
