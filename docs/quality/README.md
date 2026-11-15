# Calidad — mantenibilidad y regresión

El objetivo de la refactorización es mejorar las subcaracterísticas de mantenibilidad de ISO/IEC 25010:2023: **modularidad, reusabilidad, analizabilidad, modificabilidad y capacidad de prueba**. Bajo acoplamiento se evalúa dentro de modularidad.

## Evidencia técnica

- Compilar: `cd backend && npm run typecheck && npm run build`; `cd frontend && npm run typecheck && npm run build`.
- Pruebas existentes: `npm run test:activities` y `npm test` en backend; `npm run test:unit` y la suite Playwright del jardín en frontend.
- Reglas estructurales: `cd backend && npm run test:architecture` valida el aislamiento de los dominios ya extraídos y reporta dependencias entre módulos como línea base.
- GitHub Actions: validación de backend, frontend y Docker en cada PR (comprobar ejecución **del último commit**).

## Evidencia pendiente

- Medir antes/después complejidad, duplicación y cobertura con reportes reproducibles.
- Reducir referencias directas entre servicios sin cambiar el contrato.
- Ejecutar regresión manual con cuentas existentes, fotos históricas, MSP, comunidad y todas las modalidades/regiones Phaser.

**No afirmar equivalencia funcional al 100 % solo por CI verde**. La documentación histórica de calidad sigue en [casos de prueba](../casos-prueba/README.md).
