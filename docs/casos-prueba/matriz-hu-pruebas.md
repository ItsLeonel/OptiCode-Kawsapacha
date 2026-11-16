# Matriz de Trazabilidad: Historias de Usuario vs. Casos de Prueba
**Proyecto:** Kawsapacha — Mi Huerto Vivo (V1)  
**Elaborado por:** Santiago Guamán (QA) y Leonardo Lugmaña (Documentación)  
**Fecha de Cierre:** 15/11/2026  
**Entorno de Ejecución:** `https://head-lakes-efforts-vehicle.trycloudflare.com`  

---

## 1. Matriz de Cobertura y Trazabilidad

| Historia de Usuario (HU) | Título / Requisito | Caso de Prueba Vinculado | Estado de Ejecución | Veredicto |
|---|---|---|---|---|
| **HU-001** | Registro de nuevo usuario comunitario | P-002, P-010 | Ejecutado (15/11/2026) | **APROBADO** |
| **HU-002** | Inicio y cierre de sesión con JWT | P-002, P-010 | Ejecutado (15/11/2026) | **APROBADO** |
| **HU-003** | Recuperación y persistencia de sesión | P-010, P-012 | Ejecutado (15/11/2026) | **APROBADO** |
| **HU-004** | Exploración y bienvenida sin login | P-001 | Ejecutado (15/11/2026) | **APROBADO** |
| **HU-005** | Creación de comunidad medicinal | P-003, P-012 | Ejecutado (15/11/2026) | **APROBADO** |
| **HU-006** | Edición de comunidad y permisos | P-004, P-011 | Ejecutado (15/11/2026) | **APROBADO** |
| **HU-007** | Asignación de roles comunitarios | P-003, P-011 | Ejecutado (15/11/2026) | **APROBADO** |
| **HU-008** | Selección de provincia en mapa interactivo | P-005 | Ejecutado (15/11/2026) | **APROBADO** |
| **HU-009** | Filtro territorial INEC (Cantón/Parroquia) | P-005 | Ejecutado (15/11/2026) | **APROBADO** |
| **HU-010** | Registro de huerto real y fotos | P-006, P-012 | Ejecutado (15/11/2026) | **APROBADO** |
| **HU-011** | Modificación de características de huerto | P-007 | Ejecutado (15/11/2026) | **APROBADO** |
| **HU-012** | Consulta de catálogo medicinal (30 fichas) | P-015, CP-ESP-01 | Ejecutado (15/11/2026) | **APROBADO** |
| **HU-013** | Filtro de especies por región del Ecuador | P-015, CP-ESP-05 | Ejecutado (15/11/2026) | **APROBADO** |
| **HU-014** | Huerto virtual 2D interactivo con parcelas | P-014 | Ejecutado (15/11/2026) | **APROBADO** |
| **HU-015** | Siembra de planta y foto real en parcela | P-013, CP-ESP-01, CP-AG-01 | Ejecutado (15/11/2026) | **APROBADO** |
| **HU-016** | Ficha botánica completa (Pasaporte Vivo) | P-015, CP-ESP-03 | Ejecutado (15/11/2026) | **APROBADO** |
| **HU-017** | Señalética imprimible para huerto físico | CP-AG-04 | Ejecutado (15/11/2026) | **APROBADO** |
| **HU-018** | Bitácora de actividades (siembra y cuidados) | CP-AG-01, CP-AG-02, CP-ESP-04 | Ejecutado (15/11/2026) | **APROBADO** |
| **HU-019** | Persistencia híbrida (Visitante / Servidor) | P-008, P-012 | Ejecutado (15/11/2026) | **APROBADO** |
| **HU-020** | Cosecha parcial y rebrote vegetal | CP-AG-05 | Ejecutado (15/11/2026) | **APROBADO** |
| **HU-021** | Control de poscosecha, secado y empaque | CP-AG-06, CP-AG-07, CP-AG-10 | Ejecutado (15/11/2026) | **APROBADO** |
| **HU-022** | Espejo digital y transición de brote | CP-AG-14, CP-ESP-05 | Ejecutado (15/11/2026) | **APROBADO** |
| **HU-023** | Auditoría y revisión sanitaria MSP | CP-AG-15 | Verificado (15/11/2026) | **BLOQUEADO** (Dep. #45) |

---

## 2. Resumen Estadístico de Cobertura
* **Historias de Usuario Cubiertas:** 23 / 23 (100% trazabilidad).
* **Casos Aprobados:** 22 HU respaldadas por pruebas operativas exitosas en la URL pública.
* **Casos Bloqueados:** 1 HU vinculada a dependencia arquitectónica MSP no completada en este corte.
* **Historias de Usuario Reprobadas:** 0.
