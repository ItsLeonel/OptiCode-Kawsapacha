# Registro de defectos e incidencias — Kawsapacha V1

**Responsable:** Santiago Guamán · Un Issue de GitHub por cada defecto reproducible; avisar a Leonel (frontend) o Ronny (backend).

Incidencias detectadas en la **primera ejecución** (todas pasaron al reejecutar). No se abrieron Issues: se trató de incidencias de entorno o de versión, resueltas al reejecutar. La severidad es la que habrían tenido de seguir abiertas:

| Issue | Caso | Severidad | Observado | HU | Causa / resolución | Re-test |
|---|---|---|---|---|---|---|
| Sin Issue (incidencia de entorno: migraciones sin aplicar) | P-010 | Alta | No ingresa al sistema ya que aun no esta conectado a una base de datos | HU-001, HU-002, HU-003 | Posible causa: base de datos sin migraciones aplicadas en el entorno local (tablas inexistentes); resuelto al ejecutar migraciones y seed | Reejecutado: APROBADO |
| Sin Issue (incidencia de entorno: migraciones sin aplicar) | P-011 | Media | Únicamente se puede ingresar sin iniciar sesión a las comunidades y huertos | HU-002, HU-006, HU-007 | Posible causa: base de datos sin migraciones aplicadas en el entorno local (tablas inexistentes); resuelto al ejecutar migraciones y seed | Reejecutado: APROBADO |
| Sin Issue (incidencia de entorno: migraciones sin aplicar) | P-012 | Alta | Los datos no persisten luego de recargar la pagina | HU-019 | Posible causa: base de datos sin migraciones aplicadas en el entorno local (tablas inexistentes); resuelto al ejecutar migraciones y seed | Reejecutado: APROBADO |
| Sin Issue (incidencia de entorno: migraciones sin aplicar) | P-013 | Alta | Se produce un error al intentar recuperar los datos guardados | HU-003, HU-019 | Posible causa: base de datos sin migraciones aplicadas en el entorno local (tablas inexistentes); resuelto al ejecutar migraciones y seed | Reejecutado: APROBADO |
| Sin Issue (resuelto al actualizar el repositorio) | P-017 | Media | Únicamente muestra los nombres científicos nada mas de información | HU-012, HU-013 | Resuelto al actualizar el repositorio (confirmar versión) | Reejecutado: APROBADO |

## Hallazgos documentados por el equipo (no abiertos por QA)
- **M-01** (HU-010): faltan los suelos gredoso y pantanoso.
- **M-02** (HU-013): las fichas no tienen fotografías ni fuentes.
Verifica si se reproducen en tu ejecución y, si es así, enlaza el Issue.

## Plantilla de Issue de defecto
- **Título:** [P-XXX] resumen corto · **Caso y HU:** P-___ / HU-___
- **Entorno:** SO · navegador y versión · URL · rama y SHA
- **Pasos para reproducir / Esperado / Observado / Severidad**
- **Evidencia:** captura (sin contraseñas, tokens ni datos personales) · **Asignar a:** Leonel o Ronny
