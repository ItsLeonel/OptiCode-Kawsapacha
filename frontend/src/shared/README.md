# Elementos compartidos de la web

- `components/EcuadorMap.tsx`: selector geográfico reutilizable. Los datos GeoJSON y la licencia MIT se conservan en `src/assets`.
- `utils/reviewStatus.ts`: presentación común de estados de revisión.
- `api/transport.ts`: sesión y peticiones HTTP genéricas sin dependencias de vistas.
- `api/client.ts`: API de aplicación **transicional**; todavía depende de modelos y adaptadores de algunas features. El contrato público no cambia y `src/services/api.ts` lo reexporta por compatibilidad.

Las rutas anteriores `src/EcuadorMap.tsx` y `src/utils/reviewStatus.ts` se mantienen como fachadas hasta que se ajusten todas las referencias y pruebas. No modificar el comportamiento de las pantallas en esta fase.
