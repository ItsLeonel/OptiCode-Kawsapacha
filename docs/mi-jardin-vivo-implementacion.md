# Mi Jardín Vivo — informe de implementación

Fecha: 8 de noviembre de 2026. Trabajo local, sin commits, push, publicación, credenciales ni llamadas nuevas a generación de imágenes con costo. Se conservaron los cambios preexistentes del repositorio.

## Estado de las siete fases

| Fase | Estado | Entrega |
| --- | --- | --- |
| 1. Dirección artística | Completada en código | Prado continuo, caminos texturados, suelos y relieves independientes, sombras, profundidad y proporciones uniformes. Fondos originales de Fase 1A conservados. Matriz visual 4 × 4 inspeccionable. |
| 2. Modalidades | Completada | Tierra con combinaciones de surcos/camas/camellones/terrazas; seis macetas; tres bastidores; suspensión 3 + 2 + 1. Seis zonas interactivas vacías inicialmente, cámara, zoom, teclado y toque. |
| 3. Personalización | Completada | Provincia, región, modalidad, superficie, suelo, distribución, cercas, agua, riego y abono usan los modelos existentes. No aparecen instalaciones no declaradas. Cambiar terreno conserva plantas y actividades. |
| 4. Interfaz y guías | Completada | React para navegación, HUD, paneles, formularios y acciones; Phaser para el mundo. Cuatro guías originales regionales, escritorio y móvil. Sin monedas ni contadores ficticios. |
| 5. Espejo Digital | Completada con almacenamiento local | Registro con foto, selección, consulta, edición de ficha/foto/estado/observaciones/altura, evidencias, archivo reversible y Pasaporte Vivo. Sin crecimiento automático ni plantas de ejemplo. |
| 6. Actividades y persistencia | Completada con almacenamiento local | Nueve actividades, datos específicos, evidencia fotográfica, efectos documentados, anulaciones conservando historial y transacciones IndexedDB. Recarga, concurrencia y fallos de escritura comprobables. |
| 7. Integración y gamificación | Parcial para una operación de producción completa | Mi Jardín principal ya usa Phaser con carga diferida y gamificación local funcional, sin doble recompensa. No existen backend funcional, autenticación configurada ni sincronización comunitaria remota en este repositorio. Se conserva el contrato de acceso existente; no se simula una sesión. |

La finalización de código visual no certifica equivalencia artística subjetiva con Dragon City ni una aprobación del propietario del producto. Las capturas permiten revisar esa aproximación. La geometría es ilustrativa, no un plano ni una medida de capacidad del huerto físico.

## Funcionalidad y separación de responsabilidades

`App` conecta los formularios existentes con un repositorio único. Los comandos agrícolas y las proyecciones de plantas viven en `journal/`; Phaser recibe un modelo visual inmutable y no concede recompensas ni escribe registros. El renderizador SVG anterior se conserva en el árbol, pero ya no es la vista principal.

La selección abre el registro React si el espacio está vacío, o el Pasaporte Vivo de su planta. La foto original se conserva como Blob, no como una URL temporal. Una nueva observación no sobrescribe sus evidencias anteriores. Archivar no borra fotos ni historia. Restauración, replante y anulación comprueban que ninguna planta desplace a otra.

Preparación y abonado muestran señales derivadas de registros. Riego reproduce un efecto temporal después de guardar, sin alterar crecimiento, salud ni fotos. Seguimiento refleja solo los datos aportados. Cosecha completa puede liberar un espacio; anularla reconstruye la situación anterior cuando no existe conflicto de ocupación.

La gamificación se recalcula desde eventos válidos, excluye anulaciones, deduplica identificadores/contenidos y limita la recompensa diaria por actividad, destino y responsable. Se conservan nuevas evidencias fotográficas del mismo día sin una segunda recompensa diaria. Niveles Aprendiz/Oficial/Maestro e insignias documentadas; los detalles y umbrales están en el README del frontend y son reglas locales V1.

## Archivos intervenidos

Rutas relativas al repositorio. Inventario de esta integración; el estado de Git incluye además cambios y recursos que ya estaban presentes.

- Integración: `frontend/src/App.tsx`, `features/my-garden/MyGardenPage.tsx`, `GardenNavigation.tsx`, `garden.ts`, `garden-scene-renderer.ts`, `plant-species.ts`.
- Plantas y vistas: `features/my-garden/PlantRegistrationModal.tsx`, `PlantPassport.tsx`, nuevos `PlantEditor.tsx`, `plant-record.ts`, `useGardenDialog.ts`, `GardenPlants.tsx`, `GardenProgress.tsx`, `GardenHistory.tsx`, `garden-journal.css`.
- Dominio y almacenamiento nuevos: `features/my-garden/journal/{activities,journal,repository,progress,useGardenJournal,useJournalPhoto}.ts`, `ActivityModal.tsx`, `ActivityList.tsx`.
- Renderizador: `features/my-garden/phaser-poc/{assets,model,layouts,createGardenGame,scene-painter}.ts`, nuevo `courtyard.ts`, `PhaserGardenPoc.tsx`, `phaser-poc.css`, nuevo `garden-live.css`. Se reutilizan `bridge.ts`, `adapter.ts`, `paint-materials.ts` y `visual-config.ts`.
- Recursos compartidos: nuevo `features/my-garden/pot-artwork.ts`, `scene-art.ts`, `GardenRegionalScenery.tsx`, `garden-guides.ts` y cuatro copias originales en `phaser-poc/art/guides/`. No se pegaron las pantallas maestras ni se editaron los paisajes originales.
- Formularios existentes: `features/real-gardens/RealGardenPage.tsx` para esperar el guardado persistente. Mensajes de almacenamiento actualizados en `features/communities/CommunitiesPage.tsx`, `CommunityForm.tsx`, `communities.ts`, `GardenOnboarding.tsx` y el renderizador anterior conservado `GardenScene.tsx`.
- Pruebas: `tests/garden-helpers.ts`, `garden-poc-{art,community,living,model,production,store}.spec.ts`, `garden-poc.spec.ts`, `journal.unit.spec.ts`, `progress.unit.spec.ts`; actualización de `my-garden`, `plant-registration`, `real-gardens`, `demo-flow`, `onboarding`, `community-wizard`, `community-v3` y helpers a los formularios actuales. Las comprobaciones de cámara y sus estados de error se conservan. El ciclo de cierre usa un MediaStream controlado del navegador; la captura JPEG sigue comprobando getUserMedia por separado.
- Infraestructura de pruebas: `playwright.config.ts`, `playwright.{garden-poc,unit,production}.config.ts`, `tests/{app-server,garden-poc-server,production-server}.ts`, fixtures exclusivas de prueba; scripts en `frontend/package.json`. No se añadieron dependencias durante la implementación integral.
- Documentación: `frontend/README.md`, `features/my-garden/phaser-poc/README.md`, actualización de procedencia histórica de arte, este informe y `frontend/artifacts/mi-jardin-vivo/`.

Los archivos de `features/` del inventario tienen como prefijo `frontend/src/`.

## Verificación

TypeScript, compilación principal y laboratorio verificados. Las comprobaciones se ejecutan por grupos y se repiten únicamente al corregir un fallo o modificar su código. El catálogo contiene 137 casos únicos en 18 archivos, aprobados entre ejecuciones por grupos y comprobaciones dirigidas; no se afirma una única ejecución completa. [Resultados acumulados](../frontend/artifacts/mi-jardin-vivo/VERIFICACION.md): 17 unitarias, 24 de Phaser, 50 de flujos de aplicación y 46 de Comunidad/matriz principal. Después de los cambios finales pasaron seis regresiones dirigidas y los dos recorridos contra el build.

- `npm.cmd run test:unit`: reglas agrícolas, conflictos de ocupación, formatos, conservación de evidencias, idempotencia, recompensas, niveles y combinaciones de características.
- `npm.cmd run test:garden-poc`: 24 casos de arte 4 × 4, modalidad, datos, cámara, zoom, arrastre/toque/teclado, recursos ausentes, remonte, fotos, Pasaporte, nueve actividades, persistencia y entrada principal.
- `npm.cmd run test:e2e`: flujos de Comunidad, Mi terreno, catálogo, registro de plantas, cámara/galería, navegación, autenticación mediante adaptador y responsive.
- `npm.cmd run test:production`: escritorio y móvil contra el build principal servido con `vite preview`; no solo compilación.

Se corrigieron el aviso de guardado que interceptaba clics, la apertura prematura de edición al recuperar Mi terreno y el cálculo de límites de entrada de Phaser después de mover la página. Las pruebas antiguas del SVG y de pérdida de datos al recargar se actualizaron al comportamiento solicitado: Phaser y persistencia. Se mantuvieron las comprobaciones relevantes de mapas, validaciones, cámara, navegación y fotografías.

[Evidencias visuales](../frontend/artifacts/mi-jardin-vivo/README.md): 16 combinaciones regionales/modales, infraestructura declarada y capturas de la entrada principal con foto y progreso. Son registros de prueba aislados; nunca se insertan en el perfil del usuario.

## Límites reales y bloqueo externo

- Sin backend funcional ni adaptador real configurado, no es posible verificar registro/inicio de sesión contra un servidor, permisos por cuenta, publicación ni sincronización multiusuario. Los formularios y el contrato se conservan. Los adaptadores de prueba no se incluyen en producción.
- IndexedDB conserva un huerto y una comunidad por origen/perfil. No aísla personas que compartan perfil; cambiar puerto/host cambia el almacenamiento. Borrado del sitio, modo privado, cuotas o desalojo pueden perder datos; no hay respaldo remoto. Los borradores sin confirmar solo duran la visita.
- Los reconocimientos corresponden a declaraciones locales; no validan físicamente las acciones ni impiden manipular el almacenamiento con herramientas del navegador. El agregado comunitario se identifica como local, sin atribuirle datos de otras personas.
- Se verifican Chrome, toque emulado y cámara simulada. El dispositivo falso de Chrome se desconectó intermitentemente en las ejecuciones amplias; captura y error pasaron aislados. La prueba de los cinco cierres usa CanvasCapture para no depender de esa desconexión externa. Quedan pendientes hardware físico, otros navegadores y rendimiento en móviles reales. Las ilustraciones originales son grandes; Vite avisa del tamaño de Phaser, cargado de forma asíncrona.
- No se implementaron bodega, foro completo, ranking avanzado ni otros módulos futuros.

## Ejecución y rutas

```powershell
cd frontend
npm.cmd run dev -- --configLoader runner --host 127.0.0.1
npm.cmd run typecheck
npm.cmd run build -- --configLoader runner
npm.cmd run build:garden-poc
npm.cmd run test:unit
npm.cmd run test:garden-poc
npm.cmd run test:e2e
npm.cmd run test:production
```

Entrada normal: URL indicada por Vite, generalmente `http://127.0.0.1:5173/`. Jardín `/#mi-jardin`, terreno `/#mi-jardin/terreno`, plantas `/#mis-plantas`, historial `/#mi-historia`, progreso `/#progreso`. Laboratorio: `npm.cmd run dev:garden-poc`, `http://127.0.0.1:5176/garden-lab.html`.

Build principal: `frontend/dist/index.html`; laboratorio: `frontend/dist/garden-poc/garden-lab.html`. Pruebas: `frontend/test-results/{application,secondary,garden-poc,unit,production}/`. Playwright administra sus propios servidores y no cierra el servidor de desarrollo existente del usuario.
