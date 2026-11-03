# Mi Huerto V3

Referencias: `referencia-mi-huerto-v3.png` para registro y `referencia-huerto-registrado-v1.png` para la ficha guardada. Rama: `feature/real-gardens-ux-map-v2`. Se conservan los avances de V2: mapas, catálogo oficial INEC DPA 2026, cuatro tipos, validaciones y conexión con los módulos existentes.

## Fondos automáticos

Se comprobó la existencia de los cuatro archivos originales de `frontend/src/assets/regiones/`. No se renombraron ni modificaron. `garden-region.ts` relaciona los códigos provinciales oficiales con las regiones naturales; `GardenRegionalBackground.tsx` mantiene capas independientes y cambia su opacidad con una transición de 650 ms. `prefers-reduced-motion: reduce` elimina la transición.

La clasificación se contrastó con el [Boletín Nacional del Censo 2022 del INEC](https://www.censoecuador.gob.ec/public/Boletin_Nacional.htm):

| Región | Provincias | Fondo |
| --- | --- | --- |
| Sierra (10) | Azuay, Bolívar, Cañar, Carchi, Cotopaxi, Chimborazo, Imbabura, Loja, Pichincha, Tungurahua | `fondo_sierra_kawsapacha.png` |
| Costa (7) | El Oro, Esmeraldas, Guayas, Los Ríos, Manabí, Santo Domingo de los Tsáchilas, Santa Elena | `fondo_costa_kawsapacha.png` |
| Amazonía / Oriente (6) | Morona Santiago, Napo, Pastaza, Zamora Chinchipe, Sucumbíos, Orellana | `fondo_oriente_kawsapacha.png` |
| Galápagos (1) | Galápagos | `fondo_galapagos_kawsapacha.png` |

Antes de seleccionar provincia se muestra Sierra como ambientación inicial, sin asignar una provincia al formulario. La región no es un campo editable ni un nuevo dato almacenado. Al editar se usa la provincia del borrador; al cancelar o guardar se usa la del registro confirmado.

## Registro y ficha

Los dos paneles crema se muestran al crear o editar. Tras guardar correctamente se desmontan el formulario y ambos mapas y se presenta únicamente la ficha amplia del huerto, bajo el encabezado y la navegación existentes. La ficha destaca nombre y localidad y usa tarjetas separadas para tipo, superficie, disponibilidad de riego y suelo cuando corresponde. La referencia visual dice «Goteo», pero el modelo existente registra disponibilidad de agua: se muestra el valor realmente elegido, sin inventar un sistema de riego.

`RealGardenSummary.tsx` reutiliza las imágenes ilustrativas de los tipos, compartidas mediante `garden-type-assets.ts`. La imagen se identifica como ilustración. No existe fotografía del huerto en el modelo; las fotos de plantas no se reutilizan como evidencia del huerto. No se añaden galerías, contadores de fotos, altitud ni exposición solar. Dirección, coordenadas y comunidad aparecen solo cuando constan en el registro.

«Editar mi huerto» restaura todos los valores guardados y enfoca el nombre. Guardar vuelve a la ficha; cancelar descarta cambios y devuelve el foco al botón de edición. El borrador se conserva al navegar durante una edición, igual que en V2. El estado sigue siendo temporal en `App.tsx` y se pierde al recargar.

El botón del mapa detallado usa verde lima, texto oscuro, foco visible y mantiene el diálogo, marcador arrastrable, zoom, toque y alternativa de teclado. Se retiraron del formulario los créditos provinciales, la explicación técnica del catálogo y los textos repetitivos. La procedencia y las licencias siguen documentadas en V2 y en los recursos locales. La atribución obligatoria de OpenStreetMap permanece dentro del mapa detallado, sin añadir avisos legales al formulario.

No se modifican backend, parcelas digitales, Comunidad, fotografías de plantas ni Pasaporte Vivo.

## Verificación

Desde `frontend/`: `npm run typecheck`, `npm run build`, `npm run test:e2e` (`npm.cmd` en PowerShell restringido). Playwright usa Chrome instalado. El puerto predeterminado es 5174; `KAWSAPACHA_E2E_PORT` permite usar otro sin detener un servidor existente. Esta comprobación usa 5175 porque el puerto predeterminado estaba ocupado.

Las pruebas preservadas se adaptan a la vista exclusiva de ficha y se amplían para comprobar las 24 provincias, las cuatro regiones durante registro/guardado/edición/cancelación/navegación, ausencia de datos inventados, opciones vacías ocultas, foco, contraste del botón y reducción de movimiento. Las seis dimensiones entre 320 y 1.672 px verifican tanto registro como ficha al 100 % de zoom. Las teselas se interceptan en las pruebas para evitar tráfico automatizado sobre OpenStreetMap; no se verifica disponibilidad en vivo del proveedor.

Resultado observado el 3 de noviembre de 2026: **20 pruebas de interfaz aprobadas**, `typecheck` y compilación de producción correctos. Las capturas de registro, ficha guardada y las cuatro regiones se generan en `frontend/test-results/` (ignorado por Git). La revisión visual corrigió la prioridad del fondo lima del botón y la superposición del adorno sobre el título móvil. El botón cumple un contraste mínimo de 4,5:1 en ambos extremos de su gradiente y mantiene el foco visible al navegar con teclado.
