# Matriz de trazabilidad HU ↔ casos ↔ resultado — Kawsapacha V1

> **Lectura vigente — 15/11/2026:** esta matriz refleja exclusivamente los resultados reportados el **08/11** (P-001 a P-017) y **no acredita** pruebas sobre el `main` actual ni las modificaciones del [PR #74](https://github.com/ItsLeonel/OptiCode-Kawsapacha/pull/74). Mantener los veredictos originales como histórico hasta nueva ejecución identificada con SHA.
>
> **Cobertura por añadir a solicitud del PM:** HU-020–HU-023; flujo completo de evidencia fotográfica/actividades, pasaporte y bitácora del corte actual; regresión móvil regional/multimodal; verificación HTTPS y persistencia cruzada (#49/#75). Los módulos de foro/eventos/ranking (#48) se prueban **solo cuando estén implementados**. Santiago define casos/resultados y Leonardo comprueba la correspondencia con historias y alcance.
>


**Responsables:** Santiago Guamán (casos y resultados) y Leonardo Lugmaña (historias de usuario) · **Actualizada:** 08/11/2026
Fuente de las HU: `docs/historias-usuario/historias-usuario-v1.md` (HU-001 a HU-023).

| Caso | HU | Módulo | Estado final | 1.ª ejecución |
|---|---|---|---|---|
| P-001 | HU-004 | Bienvenida y exploración en modo visitante | APROBADO | APROBADO |
| P-002 | HU-001, HU-002 | Validación de formularios de registro e inicio de sesión (solo interfaz) | APROBADO | APROBADO |
| P-003 | HU-005, HU-007 | Crear comunidad: validaciones y creación correcta | APROBADO | APROBADO |
| P-004 | HU-006 | Editar comunidad, integrantes y conservación tras recarga | APROBADO | APROBADO |
| P-005 | HU-008, HU-009 | Selección de provincia, cantón y parroquia coherentes | APROBADO | APROBADO |
| P-006 | HU-010 | Registrar huerto real con todos sus datos | APROBADO | APROBADO |
| P-007 | HU-011 | Editar huerto y cancelar la edición | APROBADO | APROBADO |
| P-008 | HU-019 | Persistencia local al recargar y límite por origen | APROBADO | APROBADO |
| P-009 | Transversal (sin HU específica) | Uso con teclado y pantalla móvil básica | APROBADO | APROBADO |
| P-010 | HU-001, HU-002, HU-003 | Crear cuenta e iniciar/cerrar sesión con backend real | APROBADO | REPROBADO |
| P-011 | HU-002, HU-006, HU-007 | Aislamiento de datos entre dos cuentas | APROBADO | REPROBADO |
| P-012 | HU-019 | Persistencia en base de datos de comunidad y huerto | APROBADO | REPROBADO |
| P-013 | HU-003, HU-019 | Flujo integrado de demostración (cuenta → comunidad → huerto → reingreso) | APROBADO | REPROBADO |
| P-014 | HU-014, HU-015, HU-016, HU-017 | Mi Jardín: catálogo, registro de planta y pasaporte (modo local) | APROBADO | APROBADO |
| P-015 | HU-014 | Integración final de Mi Jardín | APROBADO | APROBADO |
| P-016 | HU-018 | Puntos y niveles locales (exploratorio, fuera del corte formal) | APROBADO | APROBADO |
| P-017 | HU-012, HU-013 | Catálogo de plantas medicinales: búsqueda y ficha de especie | APROBADO | REPROBADO |

## Ejecución sobre la versión entregada (15/11/2026)
Ejecutada por Leonardo Lugmaña sobre `main` `661ad6b`; detalle y evidencias en [casos-prueba-v2.md](casos-prueba-v2.md). No reemplaza los resultados del 08/11.

| Caso | HU | Módulo | Resultado |
|---|---|---|---|
| P-001 | HU-004 | Bienvenida y exploración en modo visitante | APROBADO |
| P-010 | HU-001, HU-002, HU-003 | Cuenta, inicio y cierre de sesión con backend real | APROBADO |
| P-011 | HU-002, HU-006, HU-007 | Aislamiento de datos entre dos cuentas | APROBADO |
| P-012 | HU-019 | Persistencia en base de datos | APROBADO |
| P-013 | HU-003, HU-015, HU-016, HU-019 | Flujo integrado de demostración | APROBADO |
| P-018 | HU-007, HU-020 | Invitaciones a la comunidad | APROBADO |
| P-019 | HU-021 | Almacén comunitario con permisos | APROBADO |
| P-020 | HU-010, HU-015, HU-017, HU-018, HU-022 | Riego, puntos y cosecha con rebrote | APROBADO |
| P-021 | HU-028, HU-029, HU-031 | Revisión MSP, reversión de puntos y notificación | APROBADO |

## HU sin caso de prueba ejecutado
Fuente: [historias de usuario V1](../historias-usuario/historias-usuario-v1.md) (HU-001 a HU-031). «Plan existente» = casos redactados en [ciclo-agricola-v2-manual.md](ciclo-agricola-v2-manual.md), sin ejecutar.

| HU | Título | Plan existente |
|---|---|---|
| HU-023 | Consultar el calendario de siembra y la fase lunar | — (caso nuevo) |
| HU-024 | Registrar la poscosecha | CP-AG-06 a CP-AG-11 |
| HU-025 | Registrar los rituales de siembra y de gratitud | CP-AG-03 |
| HU-026 | Imprimir la señalética botánica de una planta | CP-AG-04 |
| HU-027 | Reflejar en el Espejo Digital la etapa real de mi planta | CP-AG-14 |
| HU-030 | Publicar eventos y recursos educativos del MSP | — (caso nuevo) |

*Columna HU mantenida por Leonardo; casos y resultados del 08/11, por Santiago.*
