# Esquema del informe final — `Proyecto-Version1-OptiCode.pdf`

**Responsable:** Leonardo Lugmaña (Analista y documentación) · **Revisión y entrega:** Leonel Morales (PM) · **Issues:** #2 ANA-001, #15 DOC-002
**Fecha:** 15/11/2026 · **Entrega:** por confirmar con Leonel

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
| 3 | Alcance de la V1 | Ocho módulos funcionales, entradas de navegación y requisitos para la versión 2 | [alcance-v1.md](../analisis/alcance-v1.md) | Leonardo | ✅ Borrador listo |
| 4 | Historias de usuario | Backlog priorizado y las 31 HU en la plantilla oficial | [historias-usuario-v1.md](../historias-usuario/historias-usuario-v1.md) | Leonardo | ✅ Borrador listo |
| 5 | Arquitectura | 5.1 Vista general · 5.2 Backend monolito modular · 5.3 Frontend · 5.4 Modelo de datos (dos DER) · 5.5 Contratos de API · 5.6 Seguridad | [arquitectura implementada](../architecture/README.md); [ADR-0001](../architecture/ADR-0001-monolito-modular.md); [contratos-api.md](../arquitectura/contratos-api.md); `backend/prisma/schema.prisma` | Leonardo (fuente: Ronny) | ✅ Borrador listo |
| 6 | Diseño UI/UX | Identidad visual, decisiones de diseño, Figma, capturas y hallazgos UX | [entrega UI/UX](../diseno/entrega-ui-ux-v1.md), [guía visual](../diseno/guia-visual-v1.md) | Dylan (insumo); Leonardo (redacción) | ✅ Borrador listo |
| 7 | Herramientas y tecnologías | Tabla con herramienta, versión y uso | `backend/package.json`, `frontend/package.json`, `deploy/`, `.github/workflows/` | Leonardo | ✅ Borrador listo |
| 8 | Código fuente | Enlace al repositorio, estructura de carpetas, flujo de ramas, PR e integración continua | Repositorio GitHub | Leonardo | ⏳ Falta el commit entregado (Leonel) |
| 9 | Casos de prueba y resultados | Plan, resultados de los 17 casos, defectos, cobertura, casos en plantilla oficial, pruebas automatizadas y mantenibilidad ISO/IEC 25010 | `docs/casos-prueba/`, `docs/quality/` | Santiago (casos); Leonardo (redacción) | ✅ Borrador listo · ⏳ ejecución sobre el commit entregado |
| 10 | Producto operativo | Instrucciones de ejecución (backend + frontend, Docker), cuentas de prueba, recorrido de la demo, capturas | `README.md`, [credenciales](../CREDENCIALES-Y-ACTUALIZACION-BD.md) | Leonardo + verificación de Leonel | ⏳ Faltan capturas |
| 11 | Limitaciones y trabajo futuro | Lo no implementado o parcial (según estados de las HU, dudas abiertas y ADR-0002) | [dudas](../analisis/dudas-y-decisiones-pendientes.md) | Leonardo | ✅ Borrador listo |
| 12 | Conclusiones | Logros y aprendizajes de calidad de software | Secciones 3 a 11 | Leonardo | ✅ Borrador listo (revisar con la nueva ejecución) |
| 13 | Referencias | Definición del proyecto, MSP 2017, ISO/IEC 25010, INEC DPA 2026, OpenStreetMap, librerías | Documentos citados | Leonardo | Listo para redactar |
| — | Anexos | Enlaces a documentación, código, README y evidencias | Repositorio | Leonardo | Al final |

## Insumos que esperamos

| De | Qué | Para la sección |
|---|---|---|
| Santiago | Ejecución sobre el commit entregado (HU-020 a HU-031 y casos críticos) | 9, 12 |
| Leonel | Commit entregado y fecha de entrega | Portada, 8, 10 |
| Leonel y Ronny | Validación de horas de las HU (D-08) | 4 |

## Pasos para generar el PDF

1. Redactar las secciones en `docs/informe/informe-v1.md`.
2. Pasar el contenido a Word (las HU y los casos de prueba en formato de tabla de la plantilla oficial).
3. Exportar `Proyecto-Version1-OptiCode.pdf` y verificar enlaces.
4. Entregar a Leonel para revisión y envío.
