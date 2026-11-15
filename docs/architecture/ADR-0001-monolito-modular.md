# ADR-0001 — Monolito modular + Clean Architecture

**Estado:** decisión adoptada e implementación estructural verificada mediante GitHub Actions.  
**PR:** [#72](https://github.com/ItsLeonel/OptiCode-Kawsapacha/pull/72) · destino: `main` · **no fusionado**.

## Contexto

Kawsapacha partía de un backend Express/Prisma/SQLite con servicios y controladores ampliamente agrupados y un frontend React/Phaser cuyo `App.tsx` concentraba la coordinación de múltiples flujos. Se pidió mejorar modularidad, analizabilidad, modificabilidad y capacidad de prueba **sin alterar ningún comportamiento observable**.

## Decisión

Mantener un backend desplegable único y organizarlo en 13 módulos por capacidad de negocio; aplicar dependencias hacia dominio y puertos, implementados por adaptadores Prisma y de archivos, con composición en `*.module.ts` y `app/router.ts`. Organizar el frontend en `app/`, `features/`, `shared/`, y adaptar el estado del jardín al puente Phaser, sin conexión del renderizador al backend.

## Convenciones obligatorias

1. El dominio no conoce Prisma, Express, archivos ni HTTP.
2. Los casos de uso dependen de contratos/puertos; la infraestructura implementa esas interfaces.
3. El ensamblaje se mantiene en módulos de composición, no dentro de dominio o aplicación.
4. El frontend compartido no puede importar funcionalidades ni `app`; las funcionalidades no importan `app` **ni otras funcionalidades**. Todo contrato y componente transversal pertenece a `shared`.
5. Las rutas, respuestas, códigos HTTP, permisos, migraciones, fotografías y semántica de las operaciones deben conservarse.
6. Eliminar fachadas heredadas **solo cuando no queden consumidores**; CI verifica su uso.
7. Los cambios funcionales y alteraciones de límites ACID se tramitan por separado.

## Consecuencias positivas verificadas

- 13 módulos backend, **0 ciclos intermodulares**, 0 archivos `application/` con import directo a Prisma.
- Pruebas aisladas de aplicación y dominio más cobertura HTTP y SQLite.
- `App.tsx` de 1.545 a 833 líneas mediante extracción de registro de plantas, actividades/bitácora, carga de jardín y coordinación de comunidades.
- 0 dependencias inversas `frontend/src/shared → features` y **0 imports cruzados entre funcionalidades** (eran 78); Phaser desacoplado de HTTP.
- Rutas de API aseguradas con pruebas de montaje y método; esquema y migraciones de Prisma idénticos a `main`.

## Costes y excepciones aceptadas

La separación genera más archivos y aumenta la cantidad total de código estructural; **menos líneas por archivo no equivale automáticamente a menor complejidad del sistema**. Las importaciones directas entre funcionalidades fueron eliminadas; se mantienen las fachadas de compatibilidad necesarias. Las transacciones multioperación de actividades/cosechas permanecen en los límites históricos: ver [ADR-0002](ADR-0002-limites-transaccionales.md). No se asegura atomicidad global ni ausencia de todos los acoplamientos.

## Evidencia de aceptación

En la rama funcional `5e024893`, aprobaron Backend, Docker con datos/fotografías persistentes tras reinicio, regresión crítica y Frontend con Playwright completo, incluidos **82 tests Node backend**, **82 tests unitarios frontend**, **32 pruebas Playwright de jardín** y **4 pruebas críticas**. Véanse [métricas](../quality/evaluacion-mantenibilidad-pr72.md) y [matriz](../quality/regresion-arquitectura.md).

**Fuera de la certificación automática:** aceptación manual sobre una copia de la instalación con usuarios, SQLite y fotografías reales. No se hizo merge.
