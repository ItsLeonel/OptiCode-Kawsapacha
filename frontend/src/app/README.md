# Capa de composición web — Kawsapacha

`App.tsx` conserva el estado de navegación y la composición de pantallas. Los casos de uso y operaciones trasladados son:

- `app/load-backend-garden.ts`: lectura de huerto, plantas y bitácora persistidos.
- `app/setup-actions.ts`: registro/edición de comunidad y huerto (puente entre dos features).
- `features/my-garden/plant-actions.ts`: registro, actualización, archivo/restauración, cosecha y eliminación de plantas, en sesiones y modo visitante.
- `features/my-garden/journal/activity-actions.ts`: registro, consulta para navegación y anulación de actividades; conserva IndexedDB en visitante.
- `features/communities/useActiveCommunityMembers.ts`: membresía y rol comunitario.
- `features/medicinal-catalog/useSpeciesCatalog.ts`: catálogo y respaldo regional.
- `features/my-garden/plant-registration-draft.ts`: contrato de registro independiente del componente modal.
- `src/App.tsx`: fachada histórica de entrada.

El componente de composición redujo tamaño de 1.412 líneas antes de la migración a aproximadamente 831 líneas tras los últimos cortes. Las funciones globales de sesión, navegación y efectos de sincronización siguen en el ensamblaje; ello no convierte a `App.tsx` en lógica de dominio.

`shared/api/client.ts` maneja HTTP y contratos. Phaser recibe datos por `phaser-poc/adapter.ts`, `model.ts` y `bridge.ts`; no se conecta al cliente HTTP.

La ejecución del CI, pruebas Playwright y validación con datos persistidos son criterios de calidad separados de esta descripción estructural.
