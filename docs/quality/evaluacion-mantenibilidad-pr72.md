# Evaluación de mantenibilidad — PR #72

## Método y referencias

Comparación entre la base original `main` (`e9ef2a6d`) y la rama refactorizada tras eliminar dependencias cruzadas. Los recuentos de archivos y tamaños son de los árboles Git completos `backend/src` y `frontend/src`; los tamaños son **bytes de archivos TS/TSX versionados**, no memoria, binarios ni LOC. El análisis actual de dependencias y líneas se obtuvo con `node tools/maintainability-report.cjs` en [CI Backend #43737022726](https://github.com/ItsLeonel/OptiCode-Kawsapacha/actions/runs/43737022726) y se comprueba en ejecuciones posteriores.

| Métrica comparable | Antes (`main`) | Después (PR) |
| --- | ---: | ---: |
| Archivos TS/TSX backend | 67 | **181** |
| Tamaño fuente TS/TSX backend | 233.746 bytes | **294.313 bytes** |
| Módulos bajo `backend/src/modules/` | 0 | **13** |
| Archivos TS/TSX frontend | 143 | **177** |
| Tamaño fuente TS/TSX frontend | 1.036.958 bytes | **1.056.163 bytes** |
| Módulos bajo `frontend/src/features/` | 7 | **7** |
| Componente raíz `App.tsx` | 1.545 líneas | **833 líneas** |
| Servicio principal de actividad (archivo) | 534 líneas | **253 líneas** en el caso de uso extraído |

`App.tsx` se redujo en **712 líneas (46,1 %)**. Backend creció en archivos y bytes por interfaces, adaptadores, composición y separación de responsabilidades; estas cifras **no prueban** por sí solas mejoras de rendimiento o complejidad ciclomática. El servicio de actividades original se subdividió entre módulos, por lo que comparar solo dos archivos **no mide todo el código transferido**.

## Indicadores estructurales actuales (CI)

| Indicador | Valor |
| --- | ---: |
| Archivos backend / líneas físicas TS | 181 / 7.131 |
| Módulos backend / ciclos intermodulares | 13 / **0** |
| Referencias directas entre módulos backend | 24 |
| `application/` con imports directos Prisma | **0** |
| Archivos frontend / líneas físicas TS/TSX | 177 / 19.648 |
| Funcionalidades frontend | 7 |
| Imports directos entre funcionalidades frontend | **0** (antes: 78) |
| `shared/` importando `features/` | **0** |

Los contadores de importaciones son referencias, no relaciones únicas. Los valores de dependencia antes del cambio no se presentan como si fueran comparables: la estructura previa **no tenía** `backend/src/modules/` y la herramienta agrupa por carpetas `modules/`/`features/`. No hay medición de complejidad cognitiva/SonarQube ni cobertura porcentual.

## Contratos, compatibilidad y calidad comprobadas

- [Backend #43733059733](https://github.com/ItsLeonel/OptiCode-Kawsapacha/actions/runs/43733059733): 82 tests Node, integración de roles MSP, actividades, migración sobre SQLite heredada y reconciliación idempotente.
- [Docker #43733059756](https://github.com/ItsLeonel/OptiCode-Kawsapacha/actions/runs/43733059756): build, healthcheck, Caddy y persistencia de comunidad SQLite y fotografía tras reiniciar API.
- [Regresión crítica #43733059887](https://github.com/ItsLeonel/OptiCode-Kawsapacha/actions/runs/43733059887): 4 escenarios críticos aprobados.
- [Frontend #43733059738](https://github.com/ItsLeonel/OptiCode-Kawsapacha/actions/runs/43733059738): TypeScript, build, 82 unitarias, 32 Playwright de jardín y flujos de UI aprobados.
- Contratos backend fijados con 20 montajes, 47 rutas/métodos en 16 subrouters, y rutas de cosecha/plantas; no se modificaron esquema ni migraciones Prisma.
- Cuatro fachadas históricas verificadas con consumidores: `src/App` (3), `src/EcuadorMap` (3), `src/utils/reviewStatus` (2), `src/services/api` (16). Mantenerlas es obligatorio mientras se usen.

## Excepciones y límite de la certificación

1. Los flujos de cosecha/inventario y actividades/evidencias/recompensas mantienen escrituras separadas y requieren una evolución transaccional independiente; no afirmar atomicidad integral. [ADR-0002](../architecture/ADR-0002-limites-transaccionales.md).
2. Las 78 dependencias directas frontend originales se redujeron a **0** mediante `shared` y un bloqueo automático contra nuevas referencias entre funcionalidades. Las colaboraciones mediadas por la composición de `app` siguen siendo legítimas.
3. La **prueba manual sobre la instalación real** con cuentas, SQLite y fotografías existentes continúa a cargo del equipo. Los tests usan datos aislados y no sustituyen la aceptación de producción.
4. Las cifras de líneas incluyen comentarios y líneas vacías. El resultado de CI puede certificarse; la equivalencia funcional absoluta con datos privados no.

El commit final de documentación puede diferir de `5e024893` sin cambiar ningún archivo de aplicación. La rama se deja **lista para revisión, sin merge**.
