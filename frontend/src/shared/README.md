# Elementos compartidos de la web

- `api/transport.ts`: sesión y peticiones HTTP genéricas.
- `api/client.ts`: cliente HTTP y contratos, sin imports desde funcionalidades o `app`.
- `contracts/community.ts`, `contracts/real-garden.ts`, `contracts/garden-features.ts`: tipos y opciones que usan varias capacidades.
- `geo/region.ts`, `geo/territory.ts`, `geo/community-territory.ts`: catálogo territorial y validación común.
- `components/GardenIcon.tsx`, `components/TerritorySelect.tsx`, `components/RealGardenField.tsx`, `components/EcuadorMap.tsx`: presentación reutilizable; mantienen las clases CSS anteriores.
- `catalog/regional-species.json`: copia byte a byte de la referencia regional utilizada en el espejo botánico.
- `assets/community-sections/`: ilustraciones compartidas con MSP, idénticas a las originales de comunidades; las rutas originales se conservan para no romper consumidores existentes.
- `utils/reviewStatus.ts`: utilidades de estados.

El CI bloquea imports inversos desde `shared` hacia `features` y `app`, **imports directos entre funcionalidades**, y dependencias del renderizador Phaser hacia transporte HTTP. Las rutas antiguas `src/App.tsx`, `src/EcuadorMap.tsx`, `src/utils/reviewStatus.ts`, `src/services/api.ts` y las fachadas locales de modelos/iconos se mantienen mientras tengan consumidores.
