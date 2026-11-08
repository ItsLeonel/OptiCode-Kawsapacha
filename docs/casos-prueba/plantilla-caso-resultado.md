# Plantilla de apoyo para casos y resultados de prueba — Kawsapacha V1

> **Santiago:** esta plantilla ayuda a registrar evidencia. Para la entrega académica, usar los encabezados y campos requeridos por la **plantilla oficial del profesor**; complementar sin sustituirla. **No incluir resultados inventados.** Ver [plan V1](README.md).

## 1. Ficha de caso de prueba (duplicar una por cada P-XXX)

**ID:** P-___  
**HU / criterio de aceptación vinculado:** HU-___ (confirmar con Leonardo)  
**Módulo:** ___  
**Prioridad:** Alta / Media / Baja  
**Tipo:** Funcional / Validación negativa / Integración / Persistencia / Accesibilidad básica  
**Dependencia:** Frontend local / Backend integrado (Ronny) / Jardín final (Leonel)  
**Objetivo:** ___  
**Precondiciones:** ___  
**Datos de prueba:** usar datos ficticios, no credenciales reales.

| Paso | Acción verificable | Resultado esperado |
|---|---|---|
| 1 | ___ | ___ |
| 2 | ___ | ___ |
| 3 | ___ | ___ |

### Ejecución (llenar solo cuando se pruebe)

**Fecha y hora:** ___  
**Responsable:** Santiago Guamán  
**Entorno:** SO ___ / navegador ___ / URL y puerto ___  
**Rama + SHA del commit:** ___  
**Resultado observado:** ___  
**Estado:** NO EJECUTADO / APROBADO / FALLIDO / BLOQUEADO  
**Evidencia (ruta o enlace):** ___  
**Defecto GitHub Issue (si aplica):** ___  
**Dependencia / causa del bloqueo:** ___  
**Reejecución tras corrección:** fecha ___ / resultado ___ / evidencia ___

## 2. Matriz de ejecución consolidada

| ID | HU | Módulo | Dependencia | Estado | SHA probado | Evidencia | Defecto |
|---|---|---|---|---|---|---|---|
| P-001 | Por definir | Bienvenida | Frontend local | NO EJECUTADO | Pendiente | Pendiente | — |
| P-002 | Por definir | Validaciones de acceso | Frontend local | NO EJECUTADO | Pendiente | Pendiente | — |
| P-010 | Por definir | Autenticación real | Backend integrado | BLOQUEADO hasta integración | Pendiente | Pendiente | — |
| P-015 | Por definir | Mi Jardín final | Diseño e integración final | BLOQUEADO hasta versión estable | Pendiente | Pendiente | — |

*Estos son ejemplos de **planificación**, no resultados de pruebas realizadas. Al empezar una ejecución, Santiago debe reemplazar el contenido con hechos observados.*

## 3. Registro de defectos

| Defecto | Caso | Severidad | Reproducción (resumen) | Esperado | Observado | Responsable de corregir | Estado | Re-test |
|---|---|---|---|---|---|---|---|---|
| (crear Issue) | P-___ | Crítica/Alta/Media/Baja | ___ | ___ | ___ | Ronny (backend) / Leonel (frontend) | Abierto | Pendiente |

**Cada defecto reproducible:** adjuntar pasos, datos ficticios, captura, navegador, versión/commit, esperado y observado. No abrir bugs por funciones expresamente **fuera de alcance** sin consultar al PM; indicar la limitación de producto.

## 4. Evidencias y seguridad

Nombrar capturas como `P-003-comunidad-creacion-2026-11-08.png`, `P-012-huerto-sqlite-2026-11-09.png`, etc. Guardarlas en `docs/casos-prueba/evidencias/` o enlazarlas a un recurso estable. Si se usa la pantalla de base de datos o red/API, ocultar contraseñas, tokens, correos personales, ubicaciones exactas y otros datos sensibles.

**Criterio de éxito:** marcar APROBADO solo si resultado observado = resultado esperado, con ejecución y evidencia. Si el servidor aún no está disponible, usar BLOQUEADO, no FALLIDO ni APROBADO. Si todavía no se intenta ejecutar, usar NO EJECUTADO.

## 5. Resumen que Santiago pasa a Leonardo y Leonel

- Commit exacto del producto probado y entorno: ___
- Casos diseñados: ___
- Casos ejecutados: ___
- APROBADOS: ___
- FALLIDOS: ___
- BLOQUEADOS: ___
- NO EJECUTADOS: ___
- Defectos críticos abiertos: ___ (enlaces)
- Limitaciones de backend, Mi Jardín o pruebas: ___
- Recomendación para demo basada en evidencia: ___

**No hay cifras precargadas:** completar únicamente después de ejecutar pruebas.
