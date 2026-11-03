# Mi Huerto V2

Implementación en `feature/real-gardens-ux-map-v2`, siguiendo `referencia-mi-huerto-v2.png`. Se conserva el paisaje andino, la barra lateral y las cuatro imágenes de los tipos de huerto. Los paneles usan crema translúcido, verde natural y terracota; ubicación a la izquierda y características a la derecha. En pantallas pequeñas se apilan sin aplicar escalado ni modificar el zoom del navegador.

## Interacción y datos

- `EcuadorMap.tsx`: GeoJSON local existente; selección mediante clic, toque, Enter o Espacio, nombre visible al enfocar o pasar el puntero y selector alternativo sincronizado.
- `TerritorySelect.tsx` y `territory.ts`: búsqueda de cantones/parroquias por nombre o código, sin distinguir tildes; listas dependientes y selección opcional. Al cambiar provincia se limpian cantón, parroquia y marcador; al cambiar cantón se limpian parroquia y marcador; al cambiar parroquia se limpia el marcador. Esto evita conservar una posición anterior como si correspondiera a la nueva localidad.
- Catálogo oficial: INEC DPA 2026, 24 provincias, 222 cantones y 1.315 entradas parroquiales, incluidas cabeceras y parroquias urbanas. Fuente, hash, tratamiento de zonas en estudio e instrucciones de regeneración en `frontend/src/features/real-gardens/data/README.md`.
- `ExactLocationPicker.tsx`: diálogo modal nativo, cancelación y restauración de foco; confirmar el punto para incorporarlo al borrador. Cerrar o cancelar descarta los movimientos realizados dentro del diálogo. Se puede quitar el punto.
- `ExactLocationMap.tsx`: React Leaflet 5 con Leaflet 1.9.4, compatibles con React 19. El mapa detallado y su CSS se cargan al abrirlo. Permite clic/toque, arrastre del marcador, zoom y desplazamiento. Para teclado: flechas y +/− sobre el mapa, y botón «Marcar el centro del mapa».
- `RealGarden.location` contiene los nombres y códigos oficiales y `coordinates: { latitude, longitude } | null`. Las coordenadas se comprueban solo como números finitos en rangos válidos; no se verifica su pertenencia geográfica. Nunca se solicita la ubicación del dispositivo.
- Nombre, tipo, superficie, riego y suelo conservan sus validaciones. «Más características» agrupa riego y suelo y se abre al detectar errores. El suelo corresponde únicamente a «En tierra». Los campos territoriales y la ubicación exacta son opcionales, salvo provincia.
- Borrador y registro viven en memoria en `App.tsx`, se conservan al navegar y desaparecen al recargar. La ficha «Mi huerto registrado» se monta únicamente después de guardar. Editar permite guardar o cancelar. La ficha guardada conserva los últimos datos confirmados mientras se edita el borrador.
- «Conectar con Mi Jardín», Comunidad, fotografía y Pasaporte Vivo mantienen las rutas existentes. No hay cambios de backend ni de las parcelas digitales.

## Cartografía y condiciones

Teselas estándar desde `https://tile.openstreetmap.org/{z}/{x}/{y}.png`, con atribución © OpenStreetMap contributors visible en el mapa y enlace a su licencia. Se utilizan las peticiones y caché normales del navegador, sin precarga masiva, descargas offline, proxy ni modificación del Referer. Solo se solicitan teselas al abrir el mapa. No se envía el nombre, dirección ni marcador a un servicio de geocodificación; el proveedor recibe las peticiones de los sectores visualizados.

Referencias: [política de teselas OSM](https://operations.osmfoundation.org/policies/tiles/), [licencia y atribución](https://www.openstreetmap.org/copyright), [React Leaflet](https://react-leaflet.js.org/).

El mapa detallado requiere conexión y disponibilidad del proveedor. Si falla la descarga de teselas, se muestra un aviso; todavía se puede cancelar u omitir la ubicación. El mapa provincial y los catálogos territoriales son locales. Antes de un despliegue con tráfico elevado corresponde revisar la capacidad y condiciones del proveedor o contratar otro servicio compatible. La selección manual no equivale a una ubicación verificada.

## Comprobación reproducible

Desde `frontend/`, `npm run typecheck`, `npm run build` y `npm run test:e2e` (`npm.cmd` en PowerShell con scripts restringidos).

Las pruebas de Playwright usan Chrome instalado, un servidor local en el puerto 5174 y teselas de prueba interceptadas para evitar carga automatizada sobre los servidores comunitarios de OpenStreetMap. No prueban disponibilidad en vivo ni exactitud del contenido cartográfico. Las capturas se escriben en `frontend/test-results/`, ignorado por Git.

Resultados observados el 3 de noviembre de 2026: `typecheck` y `build` correctos; **14 pruebas de interfaz aprobadas**. Cubren provincias por clic/hover/teclado y selector, integridad del catálogo y filtrado/búsqueda de cantones/parroquias, marcador por clic/arrastre, zoom y desplazamiento por teclado, confirmación/cancelación, creación sin coordenadas, validaciones y campos desplegables, edición/cancelación y borradores al navegar, pérdida de datos al recargar, fallos de GeoJSON/teselas, Comunidad → fotografía → Mi Jardín → Pasaporte Vivo, toque en viewport móvil y seis anchos de 320 a 1.672 px sin desbordamiento horizontal. No se usó escalado CSS ni se redujo el zoom. Vite y Chrome requirieron ejecución fuera del aislamiento por las restricciones de lectura del entorno.

Pendientes de integración: persistencia y validación territorial del servidor, sujetas al futuro contrato de backend; fuera del alcance de este rediseño. No queda pendiente obtener el catálogo oficial DPA 2026: está incorporado con procedencia verificable.
