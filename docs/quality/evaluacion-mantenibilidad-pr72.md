# Evaluación de mantenibilidad — PR #72

## Alcance y metodología

La migración conserva un solo backend Express/Prisma/SQLite y un frontend React/Vite/Phaser en el mismo repositorio. Se establecieron módulos funcionales con dominio, aplicación, puertos, infraestructura y presentación, así como composición explícita por módulo. No existen microservicios.

Los indicadores proceden del análisis estático `node tools/maintainability-report.cjs` y `npm run check:architecture` ejecutados en la [Action backend #43727049446](https://github.com/ItsLeonel/OptiCode-Kawsapacha/actions/runs/43727049446), commit `dabd7121`, el 15/11/2026. Los valores incluyen líneas físicas, comentarios y vacías y **no** miden por sí solos complejidad cognitiva, cobertura ni eficacia funcional.

| Indicador | Resultado |
| --- | ---: |
| Módulos de negocio del backend | 13 |
| Archivos TS del backend | 167 |
| Líneas físicas TS del backend | 7.036 |
| Referencias directas entre módulos backend | 23 |
| Grupos circulares entre módulos backend | **0** |
| Archivos `application/` que importan Prisma directamente | **0** |
| Archivos en `domain/` verificados por reglas de dependencia | 12 |
| Archivos TS/TSX del frontend | 164 |
| Líneas físicas TS/TSX frontend | 19.423 |
| Módulos `features/` del frontend | 7 |
| Referencias entre funcionalidades frontend | 74 |
| Archivos `shared/` que importan `features/` | **0** |
| Pruebas Node del backend | 73 aprobadas, 0 fallidas |

### Evaluación de los requisitos de calidad

- **Modularidad:** los 13 módulos backend agrupan lógica por capacidad y compilan mediante un mismo entrypoint; no hay ciclos intermodulares.
- **Bajo acoplamiento:** dominio/aplicación no importan persistencia, y `shared` frontend no importa `features`. Persisten llamadas legítimas entre módulos a través de fachadas, cuantificadas en el reporte.
- **Reusabilidad:** funciones puras y componentes compartidos; contratos y utilidades se consumen sin duplicar infraestructura.
- **Analizabilidad:** estructura homogénea, ADR, documentación de contratos y reporte ejecutable en CI.
- **Modificabilidad:** puertos/repositorios permiten cambiar infraestructura sin modificar casos de uso; controles bloquean regresiones arquitectónicas.
- **Capacidad de prueba:** tests de dominio, aplicación con repositorios falsos, API/integración con SQLite y E2E Playwright.

### Verificaciones y límites de la afirmación

La ejecución citada aprobó compilación, análisis estático, pruebas de backend y reconciliación sobre SQLite heredada; Docker también aprobó [Action #43727049467](https://github.com/ItsLeonel/OptiCode-Kawsapacha/actions/runs/43727049467). Los workflows visuales pueden tardar más que backend/Docker y **solo su resultado completo del último SHA** permite valorar la regresión.

No se modificó `backend/prisma/schema.prisma`, ni las migraciones ni los archivos de usuario en `uploads/`. No puede sustituirse la inspección de fotografías y sesiones reales de una instalación desplegada por una prueba con datos simulados.

**Criterio de entrega:** no fusionar con regresiones nuevas ni marcar evidencia manual como aprobada sin ejecutarla; actualizar las ejecuciones a la SHA final de la rama después de cualquier commit documental.
