# Contrato de integración pendiente — Ciclo agrícola completo y Espejo Digital V2

**Fecha:** 14/11/2026 · **Fuente:** definición del cliente, páginas 1–2; taller de alcance, diapositivas 7–11.  
**Importante:** este archivo propone el contrato que debe cerrar **Ronny** con el frontend. Las rutas marcadas «propuestas» **no existen actualmente** en Express ni se anuncian como implementadas.

## Módulos ya existentes en `main`
- `CultivatedPlant`, `CareLog`, `HarvestRecord`, `CommunityResource` en Prisma.
- Registro de comunidad/huerto/planta; consultas y cosecha básica; Pasaporte Vivo; Bitácora local IndexedDB.
- Espejo Digital V2 renderiza la **etapa observada**, no infiere crecimiento por calendario.
- El frontend registra: preparación, siembra (material y técnica), riego, abono, deshierbe, aporque, replante, rituales, señalética, observaciones, cosecha (parcial/completa), limpieza, secado, empaque y almacenaje en el diario local.
- El formulario de poscosecha exige **cosecha de origen registrada** y el orden limpieza → secado → empaquetado → almacenaje. Los nuevos pasos no otorgan puntos automáticos.

## Contratos pendientes de acordar con Ronny (#35 y #43)
- Un único recurso **actividad agrícola** con ID inmutable/idempotente, actor derivado de JWT, huerto/comunidad autorizados, tipo, fecha, ubicación, especie/plantId, notas, detalles y fotos protegidas.
- **Etapas** `sown | sprout | seedling | vegetative | flowering | harvested | null`. Cambiar etapa requiere fotografía **nueva**. No se modifica etapa tras riego, abono, luna o tiempo transcurrido.
- **Lotes de poscosecha:** entidad ligada a HarvestRecord real, con ID seguro. No crear lotes desde cadenas arbitrarias ni inventar ingreso al inventario.
- **Eventos de lote**: `cleaning | drying | packaging | storage`. Fechas de secado aportadas por usuarios; fecha de empaque y caducidad declarada, no calculada por servidor sin regla aprobada. Campos de etiqueta: nombres, familia, idioma local, clasificación, parte, cantidad y unidad si fueron realmente medidos, indicaciones y contraindicaciones **aportadas/validadas**.
- **Ledger transaccional de inventario**: registrar ingreso, egreso, corrección y anulación del lote con usuario, fecha, unidad y origen, sin modificar stock por duplicado. Coordinar con `CommunityResource` y `HarvestRecord` existentes.
- **Auditoría e idempotencia**: `clientActivityId`, `sourceHarvestId`, usuario, fechas, cancelación reversible, historial por lote y privacidad de fotografías.
- **Permisos**: validar membresía y pertenencia de planta/huerto/lote en backend; 401/403/404; foto privada no accesible por URL pública. Validación MIME real y límites de archivo.
- **Revisión MSP y premios** (#45): actividad `PENDING | APPROVED | NEEDS_CHANGES | REJECTED`, puntos provisionales y reversibles; el frontend nunca acredita, descuenta o confirma recompensas por su cuenta.

## Operaciones propuestas, NO endpoints existentes
- Guardar/listar/corregir/anular actividades y evidencias (una sola API para la Bitácora).
- Obtener historial por planta/huerto/comunidad y observación actual validada de etapa.
- Crear/listar/consultar lote desde una cosecha persistida, registrar pasos, corregir/anular e inventariar con control transaccional.
- Consultar reglas y saldo de recompensas; obtener revisión/decisión y notificaciones.
- Obtener calendario lunar desde una fuente astronómica documentada; sugerir prácticas culturales, nunca bloquear actividades reales.

## Regla de integración
**Ronny (#35/#43/#45):** DTOs, migraciones aditivas y endpoints autenticados, pruebas de datos y seguridad.  
**Leonel:** conectar `App.tsx`, `journal/`, `PlantPassport.tsx`, Phaser y paneles administrativos a esos DTOs **sin construir otra Bitácora**, sin guardar operaciones oficiales solo en IndexedDB.  
**Santiago (#48/#49):** servicios comunitarios, QA real y despliegue HTTPS; coordinar contratos/roles con Ronny.  
**Leonardo (#15):** trazabilidad cliente → HU → código → caso de prueba → resultado.

No fusionar APIs provisionales ni marcar sincronización, revisión MSP, ranking o despliegue como finalizados sin verificaciones reales.
