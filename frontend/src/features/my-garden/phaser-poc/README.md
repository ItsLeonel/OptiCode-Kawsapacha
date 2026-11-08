# Renderizador modular de Mi Jardín Vivo

El laboratorio `garden-lab.html` y Mi Jardín principal comparten este renderizador Phaser y los formularios React. Consulta el [README del frontend](../../../../README.md) para ejecutar, persistencia, reglas agrícolas, recompensas y límites.

## Capas y responsabilidades

`adapter.ts` y `model.ts` copian `RealGarden`, plantas y actividades documentadas. Conservan `plot` 0–5 y `garden-slot-0`–`garden-slot-5` al cambiar región, modalidad, superficie o infraestructura. No inventan crecimiento.

`layouts.ts` define anclajes de recipientes, tres bastidores independientes y tres grupos de suspensión (3 + 2 + 1). `courtyard.ts` construye el prado y caminos continuos con materiales repetidos a escala de mundo y bordes orgánicos. `scene-painter.ts` compone piezas con escala uniforme, profundidad compartida y sombras de contacto. `paint-materials.ts` aplica el suelo declarado y ofrece geometría de respaldo. No se utiliza una pantalla maestra como textura.

`createGardenGame.ts` administra Phaser, carga por modalidad/región, cámara acotada, arrastre, zoom, selección, bloqueo durante los modales y liberación de recursos. `bridge.ts` transporta comandos y eventos tipados por instancia, sin lógica agrícola ni recompensas. `PhaserGardenPoc.tsx` ofrece HUD React, guía regional original, consulta de características y equivalencia accesible.

Los efectos temporales solo se reproducen después de guardar una actividad nueva; no son evidencia ni se repiten al recargar. `activitySource: local-records` identifica el origen de los registros en la aplicación. Sin fuente, el adaptador conserva `not-connected`.

## Recursos

Los cuatro paisajes de Fase 1A se conservan con su proporción. Guías originales copiadas desde `referencias/jardin-v1-referencias/03-personajes-regionales/` a `art/guides/`. Los recursos modulares existentes se reutilizan sin modificar su alfa. [Procedencia y prompts históricos](art/fase-1-direccion-artistica.md); no se generaron imágenes con costo durante la implementación integral.

Las características no declaradas no crean infraestructura. Lluvia no implica tanque; compost es material suelto. Las combinaciones se distribuyen esquemáticamente, conservando los espacios estables. El terreno no acredita un levantamiento físico exacto.

## Pruebas

`npm.cmd run test:garden-poc` verifica cámara, zoom, toque, teclado, 16 combinaciones visuales, datos registrados, retirada de infraestructura, recursos ausentes, formularios, Pasaporte, fotos, actividades, persistencia, conflictos e integración principal. El adaptador visual de `tests/fixtures/garden-art.html` existe solo en pruebas, fuera de los builds.

`npm.cmd run build:garden-poc` genera `dist/garden-poc/`. `npm.cmd run build -- --configLoader runner` genera la entrada principal. Phaser ya forma parte de esa entrada mediante carga diferida. Las capturas y resultados se documentan en `frontend/artifacts/mi-jardin-vivo/` y `docs/mi-jardin-vivo-implementacion.md`.
