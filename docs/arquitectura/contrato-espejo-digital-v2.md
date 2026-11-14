# Contrato de integración — Espejo Digital V2 y ciclo agrícola (propuesta a Ronny)

**Estado 14/11/2026: PENDIENTE DE ACUERDO.** Los tipos de este documento son una **propuesta de contrato**, NO endpoints disponibles. Responsable de API, migración y seguridad: @Rodni15 (#35, #43, #45). React/Phaser: @ItsLeonel. QA: @TonyTiago.

## Autoridad de los datos
- **Visitante:** Bitácora y fotos en IndexedDB del mismo navegador, claramente identificado como **local**.
- **Cuenta autenticada:** fuente de verdad obligatoria en API/SQLite; nunca usar el saldo o la etapa de IndexedDB como dato sincronizado/validado.
- **Evidencia** guardada con usuario autenticado, jardín, planta/espacio, fecha observada, foto, acción, idempotencia, autoría y estado de revisión. No confundir `registrada` con `aprobada por MSP`.
- **Etapa visual** = última observación real vigente con foto. Solo `sown | sprout | seedling | vegetative | flowering | harvested` cuando el usuario la declaró. Si no existe: `null`. Ningún cálculo lunar, plazo estimado, riego o clic cambia la etapa.
- **Poscosecha:** después de un evento de cosecha existente, conservar relación `sourceHarvestId` (o equivalente persistente) para `cleaning → drying-start → drying-end → packaging → storage`. Edición/anulación auditable no elimina el historial. No inventar gramos, etiquetas ni caducidad.
- **Recompensas:** el cliente acordó puntos provisionales otorgados por servidor al crear evidencia elegible; el MSP podrá confirmar/revertir en #45. En la nueva actividad local (ritual, señalética, poscosecha) el frontend asigna **0 puntos** hasta reglas oficiales. Nunca duplicar por reintentos.

## Campos mínimos a pactar
```ts
type GrowthStage = 'sown' | 'sprout' | 'seedling' | 'vegetative' | 'flowering' | 'harvested';
type ReviewState = 'PENDING' | 'APPROVED' | 'NEEDS_CHANGES' | 'REJECTED';

// SOLO propuesta: nombres finales, URLs y DTO se pactan en #35/#43.
interface AgriculturalEvidence {
  id: string;
  clientActivityId: string;        // idempotencia, único por autor/operación
  realGardenId: string;            // huerto persistente y autorización
  cultivatedPlantId?: string;      // si la acción corresponde a una planta
  plotIndex?: number;              // posición documentada en el momento
  type: string;                    // catálogo de actividades versionado
  occurredOn: string;              // fecha declarada (yyyy-mm-dd)
  actorId: string;                 // siempre JWT, nunca campo arbitrario
  photoIds: string[];              // URLs protegidas y autorizadas
  notes: string;
  growthStage?: GrowthStage | null;
  relatedHarvestId?: string;       // lote de poscosecha
  reviewState: ReviewState;
  createdAt: string;
  voidedAt?: string | null;
}
```

## Integración de módulos existentes
- `App.tsx` → guardar/consultar API autenticada y mostrar estados local/servidor sin confusiones.
- `journal/activities.ts` → validar entradas. `journal/postharvest-cycle.ts` → validar transiciones documentales; backend **revalida**, no confía en React.
- `MyGardenPage`, `scene-painter.ts`, `plant-illustration.ts` → dibujar solo la etapa vigente documentada; animaciones transitorias solo ante éxito confirmado.
- `PlantPassport` y `GardenHistory` → consultar historial de fotos y versiones; no perder evidencias al rectificar.
- `BotanicalSignage.tsx` → señalética impresa educativa; **imprimir no prueba instalación**; clasificación marcada como pendiente si no hay respaldo MSP.
- `CommunityWarehouse` → considerar existencias físicas y salida/entrada de lotes reales, sin inventar sumas automáticas.

## Aceptación obligatoria (no ejecutada hasta integrar)
1. Cuenta A registra siembra de manzanilla con imagen y etapa `sown` → API devuelve ID, foto e historial.
2. Carga riego/abonado/deshierbe con evidencias → actividad registrada, **sin crecimiento**.
3. A sube **otra** imagen de brotación y declara `sprout` → API actualiza etapa; Phaser la representa.
4. A registra cosecha, limpieza, secado a la sombra, empaquetado y bodega → cada etapa enlazada, sin datos inventados.
5. A vuelve a entrar desde otro dispositivo → idénticos ID, fotos, etapas y actividades; no depende de IndexedDB anterior.
6. Cuenta B intenta acceder o modificar evidencia privada de A → 403/404 según contrato.
7. Se anula una etapa → se reconstruye historial conservando evidencia; no duplicar puntos ni actividad.
8. MSP rechaza evidencia en #45 → operación auditable y reversión idempotente de recompensas.

**Bloqueos:** sin acuerdo de DTO y endpoints no se implementa una integración ficticia; seguridad de `/uploads` antes de publicar datos reales.
