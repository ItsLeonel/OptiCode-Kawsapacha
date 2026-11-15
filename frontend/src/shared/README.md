# Elementos compartidos de la web

- `api/transport.ts`: sesión y peticiones HTTP genéricas.
- `api/client.ts`: cliente HTTP y contratos, sin imports desde `features` o `app`.
- `contracts/`: modelos intercambiados entre capacidades.
- `geo/`: geografía compartida.
- `components/EcuadorMap.tsx`: selector geográfico reutilizable.
- `utils/reviewStatus.ts`: utilidades de estados.

El CI bloquea imports inversos desde `shared` hacia `features` y `app`, y dependencias directas del renderizador Phaser hacia transporte/API.

Las rutas antiguas `src/EcuadorMap.tsx`, `src/utils/reviewStatus.ts` y `src/services/api.ts` son fachadas de compatibilidad mientras se comprueban sus consumidores.
