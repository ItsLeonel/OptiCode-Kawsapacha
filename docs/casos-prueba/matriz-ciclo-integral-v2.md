# Matriz de QA — Ciclo agrícola, Espejo V2 y bloqueos de la entrega

**Fuente de aceptación:** definición del proyecto original, páginas 1–2, y taller del cliente, diapositivas 7–11.  
**Responsable de ejecución y evidencia:** Santiago. Los casos siguientes son **pendientes de ejecución manual**, salvo verificaciones unitarias que confirme GitHub Actions.

| Caso | Flujo | Resultado esperado | Entorno |
| --- | --- | --- | --- |
| AGR-01 | Preparar terreno con surcos/camadas/camellones/terrazas | Técnica y evidencia quedan en Bitácora, sin alterar etapa de planta | Navegador visitante |
| AGR-02 | Registrar semilla/estaca/esqueje/plántula | Material realmente usado vinculado a actividad de siembra | Navegador visitante |
| AGR-03 | Documentar ritual de siembra y gratitud | Fecha, responsable, observación y foto reales; no se impone ritual | Navegador visitante |
| AGR-04 | Crear señalética | Nombre común y científico; campos opcionales de familia, idioma, usos, clasificación declarada | Navegador visitante |
| AGR-05 | Registrar cosecha parcial y completa | Ninguna cantidad predeterminada, parcial no libera parcela automáticamente | Navegador visitante |
| AGR-06 | Abrir poscosecha sin cosecha previa | No hay lote selectable y no permite registrar un paso | Navegador visitante |
| AGR-07 | Elegir cosecha, saltar directo a empaquetado | Rechazo claro: faltan limpieza y secado | Navegador visitante |
| AGR-08 | Registrar limpieza → secado con fechas reales → empaque → bodega | Historial ordenado, fuente y fotografías recuperables después de recarga local | Navegador visitante |
| AGR-09 | Inicio de secado posterior al fin; fecha futura | Rechazo validado; no alterar diario ni fotos | Navegador visitante |
| AGR-10 | Etiqueta sin nombre científico o fecha de caducidad | Rechazo; no se inventa información medicinal ni vencimiento | Navegador visitante |
| AGR-11 | Lote corregido/anulado y duplicados de eventos | Conservar evidencia anterior; bloquear duplicados y saltos | Navegador visitante |
| AGR-12 | Regar/abonar/deshierbar o cosechar desde Pasaporte | Se abre registro único de Bitácora; ninguna confirmación falsa en modo local | Navegador visitante |
| ESP-01 | Manzanilla: semilla → nueva foto de brote → floración | Ilustración cambia por evidencia nueva, no por tiempo ni riego | Visitante; luego cuenta |
| ESP-02 | Mismo usuario desde teléfono y PC | Fotos/etapas/actividades vuelven desde servidor, sin IndexedDB del dispositivo anterior | **BLOQUEADO por #35/#43** |
| MSP-01 | Aprobar/rechazar evidencia y comunidad | RBAC/ledger y notificaciones reales, reversión idempotente sin borrar evidencia | **BLOQUEADO por #45/#46** |
| COM-01 | Foro moderado, experiencias, eventos, ranking | Contenido real autorizado y ranking con regla acordada; no datos de muestra | **BLOQUEADO por #43/#45/#48** |
| DEP-01 | Acceso desde teléfono en datos móviles mediante HTTPS | Captura y fotografía, permisos, origen único, datos persistentes y respaldo | **BLOQUEADO por #49 y hosting** |

**No llamar «aprobado» a un caso que solo tiene un test automatizado.** Registrar fecha, dispositivo, navegador, versión, evidencia, resultado (Aprobado/Fallido/Bloqueado) y enlace a incidencia.

## Regresión mínima automatizada
- `npm run typecheck`; `npm run build`; `npm run test:unit` desde `frontend/`.
- Suites Playwright regionales y completa del jardín de `.github/workflows/frontend-ci.yml`.
- `docker compose config`, construcción de frontend/proxy y API según `.github/workflows/catalogo-backend-ci.yml`.
- Comprobar que registro de riego no cambia `growthStage` y que la fase de luna no produce fotos o recompensas.
