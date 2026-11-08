# Kawsapacha — Propuesta de alcance V1

> **Estado:** Alcance de trabajo definido por el Project Manager para comenzar V1 el 26/10/2026. La evaluación de esta V1 corresponde a los entregables. El equipo debe conocer esta delimitación y estimarla; no se espera una aprobación previa del profesor.

## Visión general
Kawsapacha es una aplicación web educativa y gamificada de huertos medicinales comunitarios en Ecuador. El producto completo incluye comunidades, huertos, catálogo, bodega, actividades y saberes tradicionales, calendario lunar, huerto virtual, recompensas/ranking y foro.

## Entregables académicos obligatorios V1
1. Historias de usuario siguiendo la plantilla del docente.
2. Arquitectura y diseño del producto.
3. Herramientas y tecnologías utilizadas.
4. Código fuente V1.
5. Casos de prueba ejecutados, resultados y evidencias.
6. Producto operativo.
7. README, repositorio e informe final `Proyecto-Version1-OptiCode.pdf` según plantilla Word oficial.

## Cinco módulos funcionales seleccionados para V1
- **Usuarios:** registro, login, logout y roles básicos.
- **Comunidades:** crear y editar, responsable y participantes.
- **Huertos reales:** creación y edición, ubicación y características; selección provincial con **mapa interactivo de Ecuador** y alternativa accesible.
- **Plantas medicinales:** catálogo inicial con fichas y fotografías con fuentes.
- **Huerto virtual:** parcela 2D interactiva, seleccionar especie, subir fotografía real, registrar planta y abrir pasaporte básico.

### Funciones añadidas durante la integración (PR #30, 08/11/2026)

Al integrar el backend se incorporaron funciones de la definición del proyecto que estaban previstas para incrementos posteriores. Se documentan como parte de la V1, sujetas a confirmación del PM (D-12 en [dudas y decisiones](dudas-y-decisiones-pendientes.md)):

- **Roles e invitaciones:** Responsable y Participante; invitación de integrantes por correo con notificaciones (HU-007, HU-020).
- **Almacén comunitario (bodega):** herramientas, insumos y semillas (HU-021).
- **Cosecha:** registro de cosecha con rebrote de la planta y suma al almacén (HU-022).
- **Calendario de siembra:** temporada, frecuencias de riego y abono, ciclo y consejo lunar por especie (HU-023).

Detalle completo en las [historias de usuario V1](../historias-usuario/historias-usuario-v1.md).

## Demostración propuesta
Crear cuenta → iniciar sesión → crear comunidad → registrar huerto con provincia en mapa → explorar catálogo → registrar planta con foto → verla en parcela del huerto 2D → consultar ficha → cerrar/iniciar sesión y verificar persistencia.

## Requisitos del producto completo planificados para incrementos posteriores
Rituales de siembra y cosecha, secado y etiquetado de plantas, foro y moderación, retos validados por el servidor, certificación de talentos, ranking entre comunidades, video e historia visual extendida. (La bodega y el calendario lunar se adelantaron a la V1; los niveles e insignias existen como reglas locales.) **Estos requisitos no se eliminan ni se declaran opcionales para el producto completo.** El objetivo de la primera entrega es el incremento inicial de cinco módulos; si la rúbrica de evaluación especifica una cobertura distinta, se documentará como cambio de alcance.

## Ejecución sin bloqueos de aprobación
- [x] Leonel y la planificación de OptiCode definieron cinco módulos como primera entrega funcional.
- [ ] Comunicar la delimitación y estimaciones a los demás integrantes.
- [x] Leonardo transcribe la delimitación en historias de usuario y documenta los compromisos concretos ([HU V1](../historias-usuario/historias-usuario-v1.md), PR #33).
- [ ] Verificar los entregables contra la consigna y cualquier rúbrica facilitada por el docente.

**No existe un requisito conocido de aprobación previa del profesor para comenzar la V1.**

## Responsables
- Leonel Morales — PM, frontend, revisión y entrega oficial.
- Leonardo Lugmaña — **toda la documentación, incluidas historias, consolidación README e informe PDF final**.
- Dylan Maldonado — UI/UX, diseño Figma y recursos gráficos.
- Ronny Veloz — backend, arquitectura, base de datos y servicios.
- Santiago Guamán — QA, casos de prueba, ejecución y evidencias.

## Calendario
- M1 (30/10/2026): análisis, diseño y preparación.
- M2 (06/11/2026): desarrollo e integración.
- M3 (08/11/2026): pruebas, documentación y entrega.
- 10/11/2026: demostración.

**Referencia de decisión:** Issue #1 (PM-001). Leonardo mantiene y actualiza este documento durante la ejecución.
