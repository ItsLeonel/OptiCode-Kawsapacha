# Capa de composición de la aplicación web

`App.tsx` mantiene la navegación y las operaciones de presentación, mientras que:

- `load-backend-garden.ts` orquesta la lectura de huerto, plantas y bitácora persistidos sin acoplarlos a Phaser.
- `features/communities/useActiveCommunityMembers.ts` encapsula miembros y roles comunitarios.
- `features/medicinal-catalog/useSpeciesCatalog.ts` encapsula el catálogo y respaldo regional.
- `src/App.tsx` conserva la fachada de compatibilidad.

Las llamadas HTTP se realizan mediante `shared/api/client.ts`. La escena Phaser recibe un modelo visual mediante `phaser-poc/adapter.ts` y `bridge.ts`.

La extracción es incremental: aún quedan flujos extensos de registro, edición y bitácora en `App.tsx`. No declararlo completamente descompuesto sin migrarlos y verificar su regresión.
