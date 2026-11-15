# ADR-0001 — Monolito modular + Clean Architecture

**Estado:** Arquitectura objetivo aprobada; migración incremental.

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

Beneficio esperado: cambios más localizados y pruebas aisladas. Costo: más interfaces y adaptación de código heredado. Trasladar archivos NO implica cumplir Clean Architecture por sí solo; los servicios que aún utilizan Prisma directamente requieren migraciones sucesivas.

## Verificación

CI sobre último SHA, matriz de regresión, métricas de dependencias y revisión humana antes de fusionar.
