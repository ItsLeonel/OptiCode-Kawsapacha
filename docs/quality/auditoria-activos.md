# Auditoría conservadora de activos del repositorio

## Objetivo

Identificar imágenes antiguas y archivos sobrantes sin destruir recursos utilizados en el jardín Phaser o en documentación académica.

## Hallazgos verificados

- Los recursos `frontend/src/features/my-garden/phaser-poc/art/costa-v1/*-reference-v1.png` se usan en el código del renderizador costero `coastal-terrain.ts`; **no eliminarlos**.
- Las capturas `docs/diseno/referencia-*.png` cuentan con referencias desde documentación técnica, README de recursos o informes; se preservan como evidencia histórica y de trazabilidad, no forman parte del bundle de la aplicación.
- Los directorios `backend/prisma/migrations` y `backend/uploads` deben conservarse intactos.
- El archivo de pruebas vacío `backend/tests/demo-live-flow.ts` fue retirado anteriormente de esta rama.
- No se borraron imágenes funcionales ni documentos por coincidencias en sus nombres.

## Procedimiento reproducible

Ejecutar desde la raíz: `node tools/audit-assets.cjs`. El script lee los archivos rastreados por Git y busca referencias literales desde código, estilos y documentación.

**Limitación:** una ausencia de referencias literales **no prueba** que una imagen sea inutilizada, especialmente cuando Phaser genera rutas dinámicas o Vite descubre recursos mediante patrones. Los candidatos requieren inspección manual antes de cualquier eliminación. Se conserva el comportamiento actual como condición de aceptación.
