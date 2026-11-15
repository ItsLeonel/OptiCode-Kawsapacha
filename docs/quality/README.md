# Calidad — mantenibilidad y regresión

El objetivo de la refactorización es mejorar las subcaracterísticas de mantenibilidad de ISO/IEC 25010:2023: **modularidad, reusabilidad, analizabilidad, modificabilidad y capacidad de prueba**. Bajo acoplamiento se evalúa dentro de modularidad.

## Evidencia técnica

- Compilar: `cd backend && npm run typecheck && npm run build`; `cd frontend && npm run typecheck && npm run build`.
- Pruebas existentes: `npm run test:activities` y `npm test` en backend; `npm run test:unit` y la suite Playwright del jardín en frontend.
- Reglas estructurales: `cd backend && npm run check:architecture` valida todos los dominios y casos de uso de `application/` y rechaza dependencias circulares.
- GitHub Actions: validación de backend, frontend y Docker en cada PR (comprobar ejecución **del último commit**).

## Evidencia pendiente

- `node tools/maintainability-report.cjs` entrega métricas reproducibles en CI; consultar la [evaluación de mantenibilidad](evaluacion-mantenibilidad-pr72.md).
- Comparar ese reporte contra la rama `main` usando el mismo comando; después medir complejidad, duplicación y cobertura con herramientas específicas.
- Mantener la restricción de 0 ciclos y 0 dependencias de infraestructura en la capa de aplicación; la cobertura de pruebas E2E debe revisarse en la ejecución final.
- Ejecutar regresión manual con cuentas existentes, fotos históricas, MSP, comunidad y todas las modalidades/regiones Phaser.

**No afirmar equivalencia funcional al 100 % solo por CI verde**. La documentación histórica de calidad sigue en [casos de prueba](../casos-prueba/README.md).

## Línea base existente

Ver [fallos Playwright anteriores a la refactorización](regresion-baseline-2026-11-15.md) para separar defectos funcionales previos de la validación del PR.
