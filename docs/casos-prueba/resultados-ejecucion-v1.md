# Resultados de ejecución — Kawsapacha V1

**Responsable:** Santiago Guamán · **Issue:** #14 QA-002 · **Fecha de ejecución:** 08/11/2026

> Resultados tomados del documento oficial `casos-prueba-v1.docx`. Las capturas están insertadas en cada caso del docx y deben guardarse además en `evidencias/` con el formato `P-XXX-descripcion-AAAA-MM-DD.png`.

## 1. Resumen para Leonardo y Leonel
- **Commit probado y entorno:** Windows, Mozilla Firefox, frontend `http://localhost:5173` y API `http://localhost:3000`. P-001 a P-009 sobre `8066d69` (antes de actualizar el repositorio); P-010 a P-017 sobre `de1c6c9` (con backend).
- **Casos diseñados:** 17 · **Ejecutados:** 17
- **APROBADOS (estado final):** 17 · **FALLIDOS:** 0 · **BLOQUEADOS:** 0 · **NO EJECUTADOS:** 0
- **Fallaron en la primera ejecución:** 5 (P-010, P-011, P-012, P-013, P-017); todos se aprobaron tras reejecutar.
- **Defectos críticos abiertos:** ninguno registrado (ver `registro-defectos-v1.md`).
- **Limitaciones:** sin casos diseñados para HU-020 (invitaciones), HU-021 (almacén), HU-022 (cosecha) y HU-023 (calendario de siembra), añadidas durante la integración; hallazgos M-01 (suelos gredoso y pantanoso) y M-02 (fichas sin fotos ni fuentes) documentados por Leonardo.
- **Recomendación para la demo:** con la evidencia actual los 17 casos terminan aprobados y el recorrido P-013 (cuenta → comunidad → huerto → planta → reingreso) funciona. Antes de la demo: congelar el commit, repetir P-001, P-010 a P-013 sobre ese commit (P-001 a P-009 se ejecutaron en una versión anterior) y levantar el backend con migraciones y seed. No mostrar como probadas las funciones de HU-020 a HU-023 y mencionar las limitaciones M-01 y M-02.

## 2. Matriz de ejecución
| ID | HU | Fecha | 1.ª ejecución | Estado final | Resultado obtenido (resumen) | Capturas |
|---|---|---|---|---|---|---|
| P-001 | HU-004 | 08/11/2026 | APROBADO | APROBADO | Se ejecutaron los 5 pasos del procedimiento y el comportamiento observado coincide con lo esperado: Se ingresa… | 6 |
| P-002 | HU-001, HU-002 | 08/11/2026 | APROBADO | APROBADO | Se ejecutaron los 5 pasos del procedimiento y el comportamiento observado coincide con lo esperado: Pasos 1-2:… | 5 |
| P-003 | HU-005, HU-007 | 08/11/2026 | APROBADO | APROBADO | Se ejecutaron los 6 pasos del procedimiento y el comportamiento observado coincide con lo esperado: Sin provin… | 5 |
| P-004 | HU-006 | 08/11/2026 | APROBADO | APROBADO | Se ejecutaron los 6 pasos del procedimiento y el comportamiento observado coincide con lo esperado: La descrip… | 5 |
| P-005 | HU-008, HU-009 | 08/11/2026 | APROBADO | APROBADO | Se ejecutaron los 5 pasos del procedimiento y el comportamiento observado coincide con lo esperado: Los canton… | 3 |
| P-006 | HU-010 | 08/11/2026 | APROBADO | APROBADO | Se ejecutaron los 6 pasos del procedimiento y el comportamiento observado coincide con lo esperado: El huerto … | 11 |
| P-007 | HU-011 | 08/11/2026 | APROBADO | APROBADO | Se ejecutaron los 5 pasos del procedimiento y el comportamiento observado coincide con lo esperado: Tras cance… | 5 |
| P-008 | HU-019 | 08/11/2026 | APROBADO | APROBADO | Se ejecutaron los 3 pasos del procedimiento y el comportamiento observado coincide con lo esperado: En el mism… | 2 |
| P-009 | Transversal (sin HU específica) | 08/11/2026 | APROBADO | APROBADO | Se ejecutaron los 4 pasos del procedimiento y el comportamiento observado coincide con lo esperado: Todos los … | 4 |
| P-010 | HU-001, HU-002, HU-003 | 08/11/2026 | REPROBADO | APROBADO | No ingresa al sistema ya que aun no esta conectado a una base de datos… | 6 |
| P-011 | HU-002, HU-006, HU-007 | 08/11/2026 | REPROBADO | APROBADO | Únicamente se puede ingresar sin iniciar sesión a las comunidades y huertos… | 4 |
| P-012 | HU-019 | 08/11/2026 | REPROBADO | APROBADO | Los datos no persisten luego de recargar la pagina… | 7 |
| P-013 | HU-003, HU-019 | 08/11/2026 | REPROBADO | APROBADO | Se produce un error al intentar recuperar los datos guardados… | 3 |
| P-014 | HU-014, HU-015, HU-016, HU-017 | 08/11/2026 | APROBADO | APROBADO | Se ejecutaron los 5 pasos del procedimiento y el comportamiento observado coincide con lo esperado: La búsqued… | 4 |
| P-015 | HU-014 | 08/11/2026 | APROBADO | APROBADO | Se ejecutaron los 4 pasos del procedimiento y el comportamiento observado coincide con lo esperado: La versión… | 2 |
| P-016 | HU-018 | 08/11/2026 | APROBADO | APROBADO | Se ejecutaron los 4 pasos del procedimiento y el comportamiento observado coincide con lo esperado: La siembra… | 2 |
| P-017 | HU-012, HU-013 | 08/11/2026 | REPROBADO | APROBADO | Únicamente muestra los nombres científicos nada mas de información… | 1 |
