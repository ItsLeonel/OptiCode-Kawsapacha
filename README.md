# OptiCode — Kawsapacha 🌱

Aplicación web educativa para la gestión de huertos medicinales comunitarios en Ecuador. Proyecto de **Calidad de Software — EPN 2026B**.

**Objetivo V1 (10 de noviembre de 2026):** entregar un producto operativo con usuarios, comunidades, huertos reales (mapa interactivo de provincias del Ecuador), catálogo medicinal y huerto virtual 2D con fotografías.

## Inicio de trabajo del equipo

| Integrante | Primera tarea | Issues |
|---|---|---|
| **Leonel — PM / Frontend** | Ejecutar el frontend existente, revisar pantallas y coordinar contratos de API con Ronny. | [#6](https://github.com/ItsLeonel/OptiCode-Kawsapacha/issues/6), [#8](https://github.com/ItsLeonel/OptiCode-Kawsapacha/issues/8) |
| **Ronny — Backend** | Acordar arquitectura y stack, definir entidades/contratos API y configurar backend con base de datos. | [#4](https://github.com/ItsLeonel/OptiCode-Kawsapacha/issues/4), [#7](https://github.com/ItsLeonel/OptiCode-Kawsapacha/issues/7) |
| **Dylan — Diseño UI/UX** | Preparar Figma del login, dashboard, mapa provincial y huerto virtual; compartir recursos y guía de estilos. | [#3](https://github.com/ItsLeonel/OptiCode-Kawsapacha/issues/3) |
| **Leonardo — Análisis y documentación** | Elaborar historias de usuario con la plantilla oficial, organizar documentos y preparar el informe final. **Responsable de toda la documentación.** | [#2](https://github.com/ItsLeonel/OptiCode-Kawsapacha/issues/2), [#15](https://github.com/ItsLeonel/OptiCode-Kawsapacha/issues/15) |
| **Santiago — QA** | Preparar casos de prueba para los cinco módulos según la plantilla oficial; luego ejecutar pruebas con resultados reales. | [#5](https://github.com/ItsLeonel/OptiCode-Kawsapacha/issues/5), [#14](https://github.com/ItsLeonel/OptiCode-Kawsapacha/issues/14) |

Los módulos de implementación [#8–#13](https://github.com/ItsLeonel/OptiCode-Kawsapacha/issues) se desarrollan conjuntamente: **Leonel frontend + Ronny backend**.

### Reglas de colaboración

1. Abre tus [Issues asignados](https://github.com/ItsLeonel/OptiCode-Kawsapacha/issues), revisa las actividades y comienza por las prioridades de M1 pendientes.
2. Mueve el Issue a **In Progress** cuando empieces y registra avances y bloqueos.
3. Trabaja en una rama propia, envía cambios mediante **Pull Request** y vincula el Issue.
4. Comparte con **Leonardo** tus decisiones técnicas, diseños, casos de prueba y evidencias para el informe.
5. Marca **Done** solo cuando se cumplan los criterios de aceptación y exista evidencia comprobable. No inventes resultados de pruebas.

### Fechas

- **6 nov.:** V1 desarrollada e integrada.
- **8 nov.:** pruebas, correcciones y documentación consolidada.
- **10 nov.:** demostración y entrega.

### Documentación y desarrollo

- [Alcance de V1](docs/analisis/alcance-v1.md)
- [Reglas de trabajo](docs/organizacion/REGLAS-DE-TRABAJO.md)
- [Reparto y responsables](docs/organizacion/REPARTO-DE-TAREAS-V1.md)
- [Organización documental](docs/README.md)
- [Primer frontend (PR #18)](https://github.com/ItsLeonel/OptiCode-Kawsapacha/pull/18): React + TypeScript + Vite; **prototipo**, sin backend real todavía.

**Importante:** no es necesario esperar a que diseño, historias o backend estén completos para empezar. Leonardo y Dylan trabajan en paralelo, mientras Ronny y Leonel acuerdan cuanto antes las API. La arquitectura final del backend se confirma en #4.

## Entrega académica

Historias de usuario, arquitectura/diseño, tecnologías, código fuente, casos de prueba con **resultados ejecutados**, producto operativo, README e informe PDF. **Leonardo elabora y consolida el informe; Leonel revisa y realiza la entrega oficial.**
