# Arquitectura del Ciclo de Planta y Espejo Documental del Huerto (V1)

**Hito:** V1 - Entrega y Demostración (10/11/2026)  
**Módulos / Issues Relacionados:** #12 (Mi Jardín), #13 (Integración Backend/Frontend), #14 (QA), #34 (Acceso Móvil)  
**Responsable:** @Rodni15 (backend/API/persistencia/reglas)  
**Visualización y Phaser:** @ItsLeonel (React/Phaser)  
**QA y Pruebas:** @TonyTiago  
**Documentación:** @kened-leonardo  

---

## 1. Principio Fundamental: Espejo Documental Fidedigno

El propósito de Kawsapacha en su versión V1 es actuar como un **espejo documental del huerto real**. Esto significa que la aplicación refleja con total fidelidad lo que el agricultor urbano ha documentado en su terreno físico, bajo los siguientes principios inquebrantables:

1. **Evidencia aportada por el usuario:** La existencia de una planta, su fotografía, su especie y sus labores culturales (siembra, riego, abono, deshierbe, cosecha) son registros provistos directamente por la persona responsable.
2. **Sin crecimiento biológico ficticio:** El motor visual (Phaser) y la interfaz de usuario **no deben inventar crecimiento biológico** (no hacer crecer tallos o cambiar sprites mágicamente por pulsar un botón de «Regar»).
3. **Fotografía real como protagonista:** En las parcelas de Mi Huerto Vivo (`plotIndex: 0..5`), la planta se representa visualmente mediante la **fotografía real capturada por el usuario** enmarcada en la parcela correspondiente.
4. **Distinción entre estimación y evidencia:** Cualquier cálculo de días para cosecha o alerta de sobrecuidado emitido por el backend (`care.service.ts`) se cataloga como una **estimación orientativa agroecológica**, nunca como una certeza biológica verificada automáticamente.

---

## 2. Contrato de Datos entre Backend, Frontend y Phaser

### 2.1 Modelo de Datos en Base de Datos (SQLite / Prisma)

```prisma
model CultivatedPlant {
  id              String           @id @default(uuid())
  realGardenId    String
  speciesId       String
  plotIndex       Int              // Parcela asignada: estrictamente 0..5
  customName      String?
  photoUrl        String           // Ruta pública (/uploads/plants/plant-xxx.jpg)
  photoPath       String           // Ruta física en disco
  photoMime       String
  photoSize       Int
  plantingDate    DateTime         @default(now())
  lifecycleStatus LifecycleStatus  @default(GROWING) // GROWING, HARVESTED, REGROWING
  lastHarvestDate DateTime?
  registeredById  String
  notes           String?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  realGarden      RealGarden       @relation(fields: [realGardenId], references: [id], onDelete: Cascade)
  species         MedicinalCatalog @relation(fields: [speciesId], references: [id])
  careLogs        CareLog[]

  @@unique([realGardenId, plotIndex]) // Garantiza que no existan dos plantas activas en la misma parcela
}
```

### 2.2 Mapeo al Modelo Visual de Phaser (`model.ts` / `GardenPlant`)

El frontend traduce la entidad de la base de datos al tipo de consumo de la escena Phaser:

| Campo Prisma (`CultivatedPlant`) | Tipo Frontend (`GardenPlant`) | Rol en Phaser (`scene-painter.ts`) |
|---|---|---|
| `id` | `plant.id` (string) | Identificador único de textura en caché de Phaser (`photoTextureKey`). |
| `plotIndex` | `plant.plot` (0..5) | Índice de parcela física. Mapea a coordenadas de ancla `slot.anchor.x, y`. |
| `species.name` | `plant.name` (string) | Etiqueta en tooltip y ficha del Pasaporte Vivo. |
| `species.scientificName` | `plant.latin` (string) | Nombre botánico en cursiva en el Pasaporte Vivo. |
| `photoUrl` | `plant.photo` (URL) | Textura de imagen que se renderiza dentro del círculo de la parcela. |
| `plantingDate` | `plant.plantedOn` (YYYY-MM-DD) | Punto de partida cronológico para recomendaciones de cuidado. |

### 2.3 Renderizado en Phaser (`scene-painter.ts`)
Phaser no utiliza sprites pre-renderizados que simulen crecimiento falso. Su función `groundSlot` / `slot`:
1. Verifica si la parcela tiene planta asociada (`slot.plant`).
2. Si está vacía, dibuja un brillo tenue que indica que el espacio está disponible para siembra.
3. Si está ocupada, carga la fotografía real desde la textura `photoTextureKey(plant.id, plant.photo)` y la coloca en el centro del espacio de cultivo con su marco circular andino.

---

## 3. Endpoints de la API y Reglas de Negocio

### 3.1 Registro de Planta
- **Ruta:** `POST /api/plants`
- **Autenticación:** Requerida (`Bearer <token>`).
- **Formato:** `multipart/form-data`
  - `picture`: Archivo binario (JPG/PNG/WebP, máx. 3 MB).
  - `realGardenId`: UUID del huerto real donde se cultiva.
  - `speciesId`: UUID de la especie del catálogo botánico.
  - `plotIndex`: Número entero entre `0` y `5`.
  - `customName`: Nombre personalizado (opcional).
  - `notes`: Notas de siembra (opcional).
- **Validaciones estrictas del servidor:**
  1. `plotIndex` fuera del rango $0..5 \implies$ Error `400 INVALID_PLOT`.
  2. Si la parcela ya tiene una planta con `lifecycleStatus = 'GROWING'` $\implies$ Error `409 PLOT_OCCUPIED` ("Esa parcela ya está ocupada. Elige otra.").
  3. Si la parcela tenía una planta cosechada (`HARVESTED`), se libera automáticamente la parcela para la nueva siembra.
  4. La fotografía se valida en peso ($\le 3\text{ MB}$) y MIME permitido. Se almacena en `backend/uploads/plants/`.

### 3.2 Listado de Plantas por Huerto
- **Ruta:** `GET /api/plants/garden/:gardenId`
- **Respuesta:**
  ```json
  {
    "ok": true,
    "data": [
      {
        "id": "uuid-planta",
        "plotIndex": 2,
        "customName": "Mi Menta",
        "photoUrl": "/uploads/plants/plant-1731102834.jpg",
        "plantingDate": "2026-11-08T19:30:00.000Z",
        "lifecycleStatus": "GROWING",
        "species": {
          "name": "Menta",
          "scientificName": "Mentha spicata",
          "category": "Digestiva"
        }
      }
    ]
  }
  ```

### 3.3 Pasaporte Vivo y Consulta de Cuidados
- **Ruta:** `GET /api/care/plant/:plantId`
- **Respuesta:**
  - `plant`: Datos de la planta y especie.
  - `careLogs`: Lista histórica de riegos, abonos y podas documentados por los integrantes de la comunidad.
  - `growth`: Estimación agroecológica (`healthStatus`, `stage`, `percentage`, `daysUntilHarvest`, `overWatered`, `overFertilized`, `overPruned`).
  - **Aviso de diseño:** En la UI del Pasaporte Vivo se incluye la leyenda:
    > *"Estimación orientativa agroecológica según bitácora y fecha de siembra. La evidencia documental válida del huerto real corresponde a las fotografías y registros aportados por el usuario."*

---

## 4. Persistencia e Idempotencia (Móvil $\longleftrightarrow$ PC)

Para garantizar una demo consistente y sin pérdida de información:

1. **Sesión Autenticada:** Cuando el usuario inicia sesión (con token JWT), todas las operaciones de plantas y cuidados van directo a la base de datos SQLite en la PC. **No se almacenan únicamente en IndexedDB local**.
2. **Modo Visitante:** Si se utiliza Kawsapacha sin iniciar sesión, los datos se conservan exclusivamente en el navegador local y la interfaz lo indica con la etiqueta *"Modo visitante · Sin sincronización"*.
3. **Flujo de Prueba Sincronizado:**
   - Celular registra planta en Parcela 2 con foto real $\rightarrow$ Petición HTTP $\rightarrow$ SQLite almacena la tupla `(realGardenId, plotIndex: 2, photoUrl)`.
   - Navegador de la PC con la misma cuenta recarga la página $\rightarrow$ `GET /api/plants/garden/:gardenId` $\rightarrow$ La Parcela 2 aparece instantáneamente ocupada con la misma foto y los datos del Pasaporte Vivo.

---

## 5. Criterios de Aceptación para QA (@TonyTiago)

| Código Caso | Escenario | Resultado Esperado |
|---|---|---|
| **CP-ESP-01** | Registro de planta con foto y parcela válida (0 a 5) desde celular. | Planta guardada en BD, foto en `/uploads/plants`, visible en móvil. |
| **CP-ESP-02** | Intento de registrar en parcela ya ocupada sin cosechar previamente. | Rechazo con código `409 PLOT_OCCUPIED` y mensaje amigable en UI. |
| **CP-ESP-03** | Consulta de la misma planta desde el navegador de la PC. | Foto visible en la misma parcela, Pasaporte Vivo muestra especie y fecha correcta. |
| **CP-ESP-04** | Registro de actividad de riego en la planta desde la PC o celular. | Se añade al historial de `careLogs`; el Pasaporte Vivo actualiza el indicador de último riego. |
| **CP-ESP-05** | Validación de ausencia de sprites ficticios. | La parcela muestra la foto real provista; ningún botón de acción genera animaciones de tallos o crecimientos falsos. |
| **CP-ESP-06** | Cosecha completa de la planta. | La parcela queda liberada para una nueva siembra; la ficha pasa a histórico/archivada sin perder sus fotos ni evidencias. |
