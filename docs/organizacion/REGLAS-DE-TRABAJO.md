# Reglas de trabajo de OptiCode — Kawsapacha V1

## Roles y propiedad de la documentación
- Leonel Morales: Project Manager y frontend. Acuerda alcance, coordina prioridades, revisa, aprueba y entrega oficialmente.
- **Leonardo Lugmaña: responsable de TODA la documentación**, incluidas historias de usuario, estructura y actualización de documentos, integración de arquitectura/diseño/pruebas, README e **informe final PDF**. Recibe aportes de especialistas; no inventa resultados.
- Dylan Maldonado: diseños Figma, UX/UI, mapa interactivo y huerto visual.
- Ronny Veloz: backend, arquitectura, modelo de datos, servicios y almacenamiento de fotos.
- Santiago Guamán: pruebas, resultados observados, evidencias y defectos.

## Organización de Issues
- Todo: registrado, no iniciado.
- In Progress: en ejecución.
- In Review: listo para revisión técnica o QA.
- Done: criterios cumplidos y entregable comprobado; cerrar Issue sólo entonces.
- Cada Issue requiere responsable, milestone, prioridad, resultado verificable y referencias a evidencias.
- Las fechas en descripciones son fechas objetivo del equipo; los hitos mantienen la fecha de milestone.
- Los cambios de alcance se registran en PM-001 y los coordina Leonel con el equipo. La evaluación docente ocurre sobre los entregables, no se necesita aprobación previa para empezar.

## Git y colaboración
- Rama `main` para entregables integrados.
- Crear ramas específicas por tarea (`feature/...`, `docs/...`, `fix/...`).
- Proponer cambios mediante Pull Requests, vinculando el Issue correspondiente; revisar antes de integrar.
- No subir secretos ni archivos `.env` con credenciales; usar `.env.example`.
- Coordinar contrato de API entre Leonel y Ronny antes de implementación dependiente; trabajar con datos simulados cuando corresponda.
- Los commits y PR deben explicar qué se cambió y cómo comprobarlo.

## Definición de terminado
- Código o documento entregado y revisado.
- Criterios de aceptación satisfechos.
- Pruebas relevantes realizadas, con resultados reales; no marcar como aprobado sin ejecución.
- Documentación entregada a Leonardo.
- Sin defectos críticos conocidos que impidan el flujo comprometido.

## Seguridad y privacidad
- Revisar permisos antes de publicar fotografías; validar archivos y evitar exposición de metadatos de ubicación.
- No exponer datos personales reales del equipo o usuarios de prueba.
- Distinguir saberes culturales de recomendaciones médicas.

## Entrega
- Informe: `Proyecto-Version1-OptiCode.pdf` elaborado por Leonardo usando plantilla docente, revisado y enviado por Leonel.
- El repositorio debe incluir documentación V1, código y README con instrucciones probadas.
