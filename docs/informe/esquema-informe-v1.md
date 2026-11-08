# Esquema del informe final — `Proyecto-Version1-OptiCode.pdf`

**Responsable:** Leonardo Lugmaña (Analista y documentación) · **Revisión y entrega:** Leonel Morales (PM) · **Issues:** #2 ANA-001, #15 DOC-002
**Fecha:** 08/11/2026 · **Entrega:** 10/11/2026

> No existe una plantilla Word oficial del informe (D-10). Esta estructura sigue la consigna de la Versión 1: historias de usuario, arquitectura y diseño, herramientas y tecnologías, código fuente, casos de prueba con resultados y producto operativo, con enlaces a documentación, código y README.
>
> **Regla:** cada sección cita su fuente en el repositorio. Lo que no esté entregado y verificado se marca como pendiente o limitación; no se completa con supuestos.

## Estructura y estado

| # | Sección | Contenido | Fuente en el repositorio | Aporta | Estado |
|---|---|---|---|---|---|
| — | Portada | Universidad, materia ISWD652, período 2026B, proyecto, equipo OptiCode, integrantes y roles, fecha | `docs/organizacion/REPARTO-DE-TAREAS-V1.md` | Leonardo | Listo para redactar |
| — | Índice | Generado en Word | — | Leonardo | Al final |
| 1 | Introducción | Problema, cliente (MSP), objetivo de la aplicación, significado de *Kawsapacha* | Definición del proyecto; [MSP aplicado](../analisis/lineamientos-msp-aplicados.md) §1 | Leonardo | Listo para redactar |
| 2 | Análisis de requisitos | 2.1 Revisión de la definición · 2.2 Estudio de lineamientos MSP · 2.3 Actores · 2.4 Preguntas abiertas al cliente y decisiones · 2.5 Uso de IA en la investigación | [MSP aplicado](../analisis/lineamientos-msp-aplicados.md); [preguntas](../analisis/preguntas-al-cliente.md); [dudas](../analisis/dudas-y-decisiones-pendientes.md) | Leonardo | Listo para redactar |
| 3 | Alcance de la V1 | Módulos incluidos, ampliaciones (bodega, cosecha, calendario) y requisitos para incrementos posteriores | [alcance-v1.md](../analisis/alcance-v1.md) | Leonardo (confirmación de Leonel, D-12) | Falta actualizar `alcance-v1.md` |
| 4 | Historias de usuario | Backlog priorizado y las 23 HU en la plantilla oficial | [historias-usuario-v1.md](../historias-usuario/historias-usuario-v1.md) | Leonardo | ✅ Borrador listo |
| 5 | Arquitectura | 5.1 Vista general (frontend React + API REST + SQLite) · 5.2 Capas del backend · 5.3 Modelo de datos (DER) · 5.4 Contratos de API · 5.5 Seguridad | [backend.md](../arquitectura/backend.md); [contratos-api.md](../arquitectura/contratos-api.md); [frontend.md](../arquitectura/frontend.md) | Ronny (backend), Leonel (frontend) | Backend ✅ entregado; frontend.md desactualizado |
| 6 | Diseño UI/UX | Guía visual, prototipo Figma, capturas reales del producto, decisiones de identidad regional | `docs/diseno/` | Dylan | ⏳ Esperando entrega (enlace Figma, guía, capturas) |
| 7 | Herramientas y tecnologías | Tabla con herramienta, versión y uso | `backend/package.json`, `frontend/package.json`, [backend.md](../arquitectura/backend.md) §2 | Leonardo | Falta leer `frontend/package.json` |
| 8 | Código fuente | Enlace al repositorio, estructura de carpetas, ramas y PR principales | Repositorio GitHub | Leonardo | Listo para redactar |
| 9 | Casos de prueba y resultados | Plan, casos en plantilla oficial, ejecuciones con fecha, responsable, resultado y capturas; resumen de aprobados/reprobados; defectos | `docs/casos-prueba/` | Santiago | ⏳ Esperando entrega |
| 10 | Producto operativo | Instrucciones de ejecución verificadas (backend + frontend), recorrido de la demo, capturas | `README.md`, `backend/README.md`, `frontend/README.md` | Leonardo + verificación de Leonel | Falta actualizar README raíz |
| 11 | Limitaciones y trabajo futuro | Lo no implementado o parcial (según estados de las HU y dudas abiertas) | [dudas](../analisis/dudas-y-decisiones-pendientes.md) | Leonardo | Listo para redactar |
| 12 | Conclusiones | Logros, aprendizajes de calidad de software | — | Leonardo | Al final |
| 13 | Referencias | Definición del proyecto, MSP 2017, INEC DPA 2026, OpenStreetMap, librerías | Documentos citados | Leonardo | Listo para redactar |
| — | Anexos | Enlaces a documentación, código, README y evidencias | Repositorio | Leonardo | Al final |

## Insumos que esperamos

| De | Qué | Para la sección |
|---|---|---|
| Dylan | Enlace Figma, guía visual, capturas | 6 |
| Santiago | Casos ejecutados con capturas y resumen | 9 |
| Leonel | Commit de la demo, confirmación del alcance (D-12) | 3, 8, 10 |
| Leonel y Ronny | Validación de horas de las HU (D-08) | 4 |

## Pasos para generar el PDF

1. Redactar las secciones en `docs/informe/informe-v1.md`.
2. Pasar el contenido a Word (las HU y los casos de prueba en formato de tabla de la plantilla oficial).
3. Exportar `Proyecto-Version1-OptiCode.pdf` y verificar enlaces.
4. Entregar a Leonel para revisión y envío.
