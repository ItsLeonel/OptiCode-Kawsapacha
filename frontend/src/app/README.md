# Capa de composición de la aplicación web

`App.tsx` mantiene el comportamiento y navegación actuales del usuario y las cuatro secciones existentes. En nuevas refactorizaciones se irán extrayendo coordinación de estado y flujos a hooks/casos de uso de `features` sin alterar la UI. La raíz `src/App.tsx` es una fachada de compatibilidad. Las peticiones HTTP compartidas viven en `../shared/api/client.ts` y la ruta histórica `../services/api.ts` reexporta su contrato.
