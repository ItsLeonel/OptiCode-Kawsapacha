# QA manual — Ciclo agrícola y Espejo Digital V2

**Estado al crear este documento: NO EJECUTADO manualmente.** No inventar capturas, resultado aprobado ni pruebas con móvil real. Ejecutar tras CI verde y backend actualizado.

| ID | Pasos | Resultado esperado | Estado |
|---|---|---|---|
| CP-AG-01 | Crear huerto, registrar manzanilla, abrir Bitácora → Siembra y elegir Semillas | Método visible en detalle; sin crecimiento automático | NO EJECUTADO |
| CP-AG-02 | Documentar Preparación: surcos, abonado o terrazas | Actividad registrada con fecha, autor y foto opcional | NO EJECUTADO |
| CP-AG-03 | Registrar Ritual de siembra y Gratitud desde «Otras» | Dos entradas trazables; sin puntos oficiales por estas acciones | NO EJECUTADO |
| CP-AG-04 | Abrir Pasaporte Vivo → Imprimir señalética | Nombre, nombre científico, familia, fuente de clasificación si existe; no receta médica ni afirmación falsa de instalación | NO EJECUTADO |
| CP-AG-05 | Cosecha parcial de manzanilla; seleccionar parte (flores) | Queda historial de cosecha, sin inventar peso | NO EJECUTADO |
| CP-AG-06 | Poscosecha sin cosecha previa | Formulario bloquea operación y explica dependencia | NO EJECUTADO |
| CP-AG-07 | Registrar limpieza → inicio de secado a la sombra → fin tras 12 días | Etapas en orden, fechas documentadas y aviso orientativo 10–15 días | NO EJECUTADO |
| CP-AG-08 | Intentar fin de secado antes del inicio | Rechazo sin alterar actividades anteriores | NO EJECUTADO |
| CP-AG-09 | Empaquetar sin lote/caducidad o con fecha inválida | Rechazo sin falsificar fecha o caducidad | NO EJECUTADO |
| CP-AG-10 | Guardar lote con etiqueta y almacén; abrir Bitácora | Ciclo completo visible, datos reales conservados en navegador | NO EJECUTADO |
| CP-AG-11 | Anular etapa intermedia y abrir de nuevo poscosecha | Siguiente etapa válida se recalcula; evidencia anulada sigue en historial | NO EJECUTADO |
| CP-AG-12 | Iniciar sesión y repetir flujo; cerrar e iniciar en otra PC | **BLOQUEADO #35/#43**: no afirmar que las nuevas actividades locales se sincronizan | BLOQUEADO |
| CP-AG-13 | Capturar fotos desde teléfono real con HTTPS y verlas en PC | **BLOQUEADO #49** hasta desplegar servidor y probar con dispositivo real | BLOQUEADO |
| CP-AG-14 | Registrar etapa brote con nueva foto y comparar antes/después en Phaser | Brote aparece solo con observación auténtica, sin crecimiento al regar | PENDIENTE QA |
| CP-AG-15 | Acceso comunidad ajena a fotos y revisión MSP | **BLOQUEADO #35/#45** hasta autorización real de servidor | BLOQUEADO |

**Ambientes a registrar:** PR/commit, SO y navegador, pantalla PC o teléfono, API/DB o visitante, evidencia de captura, resultado (APROBADO/FALLIDO/BLOQUEADO). Realizar mínimo recorridos Costa/Sierra/Amazonía/Galápagos y tierra/macetas/vertical/colgante. Repetir tras fusionar #56 y #57.

**Automatización:** `frontend/tests/ciclo-agricola-poscosecha.unit.spec.ts` valida orden/fechas/puntos nulos. CI no sustituye los 15 casos anteriores.
