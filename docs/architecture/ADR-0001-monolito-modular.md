# ADR-0001 — Monolito modular + Clean Architecture

**Estado:** Implementación estructural y fronteras de aplicación/dominio verificadas en CI. Integración de despliegue y regresión visual sujetas al último commit.

## Contexto

La cliente exige modularidad, bajo acoplamiento, reutilización, analizabilidad, modificabilidad y facilidad de prueba. La aplicación existente usa React/Phaser y Express/Prisma/SQLite.

## Decisión

Mantener frontend y backend en el mismo repositorio y un único proceso backend desplegable. Separar capacidades de negocio en backend/src/modules con domain, application, infrastructure y presentation. Mantener src/app/router.ts como composición HTTP. Frontend organizado con src/app, src/features y src/shared.

## Reglas

- Dominio sin dependencias de Express, Prisma, HTTP ni sistema de archivos.
- Aplicación usa interfaces/puertos; adaptadores concretos en infraestructura.
- Preservar rutas API, esquema de datos, migraciones, fotos, sesiones y funcionamiento.
- No introducir microservicios ni cambios de reglas de negocio en este PR.
- Mantener fachadas temporales donde existan consumidores heredados.

## Consecuencias

La arquitectura cuenta con repositorios/puertos inyectados y adaptadores Prisma, de fotografía y de JWT. El control `check:architecture` verifica todas las capas `application/` y `domain/`, y rechaza ciclos entre módulos; pruebas con repositorios simulados ejercitan las reglas sin Prisma. El coste de mantenimiento se desplaza a los contratos y módulos de composición. El control estático no demuestra equivalencia visual ni cobertura exhaustiva en ejecución.

## Verificación

CI sobre último SHA, matriz de regresión, métricas de dependencias y revisión humana antes de fusionar.
