# Guía visual V1 — Kawsapacha

**Estado:** referencia retrospectiva de los estilos encontrados en el código, contrastada parcialmente con la aplicación local. Describe el sistema existente; no es una paleta propuesta, una certificación de accesibilidad ni una aprobación oficial del PM.

Esta guía registra estilos y recursos encontrados en el frontend del commit indicado. Las rutas de código son relativas a este documento. Los valores se extrajeron del CSS y de los componentes. La aplicación local se cargó y se recorrió en `1440 × 1000` y `390 × 844`, pero no se verificó su representación en producción. La presencia de un color o estilo en el código no demuestra que se use en todas las pantallas ni que cumpla contraste.

## 4.1. Identidad visual

Kawsapacha combina una interfaz de cultivo educativo con referencias visuales ecuatorianas: vegetación, paisajes regionales, madera, tierra, tejidos ilustrados y personajes guía. En la experiencia de Mi Jardín, el escenario ilustrado funciona como entorno visual; los datos, formularios y acciones se presentan en controles de interfaz separados. La identidad comunica cultivo y comunidad, pero esta descripción no implica validación cultural por especialistas.

La implementación mezcla dos registros: una interfaz de producto con superficies claras, tipografía DM Sans/Outfit y acentos verdes; y una capa de juego con paneles cálidos, madera, tipografía Trebuchet MS/Georgia y controles superpuestos. Ambos registros comparten la marca, pero no forman todavía un sistema visual único y cerrado.

## 4.2. Paleta de colores

Los valores siguientes aparecen en CSS del frontend. Son ejemplos de colores efectivamente declarados, no un inventario exhaustivo de todos los tonos ni una afirmación de contraste validado.

| Color | Uso visible en código | Contexto |
|---|---|---|
| `#173e34` | Texto base de la aplicación. | Tema global, [styles.css](../../frontend/src/styles.css). |
| `#14392f` | Fondo oscuro de navegación lateral. | Shell y sidebar global, [styles.css](../../frontend/src/styles.css). |
| `#255f4b` | Enlaces. | Tema global, [styles.css](../../frontend/src/styles.css). |
| `#f6f5f0` | Fondo neutro global. | `:root`, [styles.css](../../frontend/src/styles.css). |
| `#d3a263` | Contorno de foco visible de botones, campos, selectores y enlaces. | `:focus-visible`, [styles.css](../../frontend/src/styles.css). |
| `#c9df9e` | Acento claro en el distintivo visual de navegación. | Identidad/sidebar, [styles.css](../../frontend/src/styles.css). |
| `#173b2b` | Texto oscuro de la UI de juego. | [game-ui.css](../../frontend/src/shared/ui/game-ui/game-ui.css). |
| `#fff2cf` | Tono claro usado en la UI de juego. | [game-ui.css](../../frontend/src/shared/ui/game-ui/game-ui.css). |
| `#48200f`, `#8e4c21`, `#c68037` | Tonos de madera, paneles y bordes cálidos en la interfaz de juego. | [game-ui.css](../../frontend/src/shared/ui/game-ui/game-ui.css), [game-v3.css](../../frontend/src/shared/ui/game-ui/game-v3.css). |
| `#90d523`, `#ffe685` | Acentos lima y dorado en elementos de juego. | [game-ui.css](../../frontend/src/shared/ui/game-ui/game-ui.css). |
| `#9c61cb`, `#f4bb31`, `#75c943`, `#3abbe8` | Acentos regionales de la UI de juego: Sierra, Costa, Oriente/Amazonía y Galápagos. | Variables `--kg-region` por `data-region`, [game-ui.css](../../frontend/src/shared/ui/game-ui/game-ui.css). |
| `#214c2a` | Fondo verde del layout del jardín V3. | [my-garden-v3.css](../../frontend/src/features/my-garden/my-garden-v3.css). |
| `#d49b45` | Borde cálido de paneles del onboarding de Mi Jardín. | [my-garden-v3.css](../../frontend/src/features/my-garden/my-garden-v3.css). |
| `#fffced`, `#ffe6a7` | Superficie crema/dorada de paneles de onboarding. | [my-garden-v3.css](../../frontend/src/features/my-garden/my-garden-v3.css). |
| `#c8ef69`, `#d7f784` | Acentos verde lima de Mi Jardín. | [my-garden.css](../../frontend/src/features/my-garden/my-garden.css). |
| `#082c1c` | Fondo profundo de la bienvenida y el acceso. | [auth.css](../../frontend/src/features/auth/auth.css). |
| `#c4f225` | Acento lima de autenticación: progreso, etiquetas y focos. | [auth.css](../../frontend/src/features/auth/auth.css). |
| `#e5ff5f` | Variante lima clara de acentos de autenticación. | [auth.css](../../frontend/src/features/auth/auth.css). |
| `#f7d04e` | Amarillo cálido de ornamento/tejido en bienvenida. | [auth.css](../../frontend/src/features/auth/auth.css). |
| `#123a21` | Degradado oscuro sobre fondos regionales en Comunidad. | [community-v3.css](../../frontend/src/features/communities/community-v3.css). |
| `#c9e880`, `#c2d76f` | Acentos lima y bordes de Comunidad. | [communities.css](../../frontend/src/features/communities/communities.css). |
| `#28462c` | Fondo del shell inmersivo de Mi Jardín. | [garden-live.css](../../frontend/src/features/my-garden/phaser-poc/garden-live.css). |
| `#fff6d9` | Texto claro de la UI de juego. | [phaser-poc.css](../../frontend/src/features/my-garden/phaser-poc/phaser-poc.css). |

La UI de juego sí declara acentos regionales mediante variables `--kg-region` por `data-region`; el shell general no presenta una paleta regional equivalente y se apoya principalmente en recursos gráficos.

### Diferenciación regional comprobable

En las fuentes revisadas, la UI de juego distingue las regiones con acentos CSS (`--kg-region`) y recursos gráficos seleccionados por región. Los fondos de Comunidad/Mi Jardín compartidos están en `frontend/src/shared/assets/regional-backgrounds/`; los escenarios de bienvenida usan los recursos asociados en `frontend/src/assets/comunidad-v3/fondos/`; la selección de región y sus fondos de registro se declaran en [garden-region.ts](../../frontend/src/features/real-gardens/garden-region.ts).

| Región | Recurso regional referenciado | Alcance de lo comprobado |
|---|---|---|
| Costa | `fondo_comunidad_costa.webp`; `fondo_comunidad_costa_v3.png`; `fondo_costa_kawsapacha.png` | Costa aparece en las capturas de Mi Jardín. |
| Sierra | `fondo_comunidad_sierra.webp`; `fondo_comunidad_sierra_v3.png`; `fondo_sierra_kawsapacha.png` | Recursos declarados; no hay captura V1 correspondiente en el conjunto examinado. |
| Amazonía / Oriente | `fondo_comunidad_oriente.webp`; `fondo_comunidad_oriente_v3.png`; `fondo_oriente_kawsapacha.png` | Recursos declarados; no hay captura V1 correspondiente en el conjunto examinado. |
| Galápagos | `fondo_comunidad_galapagos.webp`; `fondo_comunidad_galapagos_v3.png`; `fondo_galapagos_kawsapacha.png` | Recursos declarados; no hay captura V1 correspondiente en el conjunto examinado. |

La existencia de estos archivos y mapeos no demuestra que cada región se haya revisado visualmente ni autoriza a atribuirle colores o motivos concretos que no se inspeccionaron.

## 4.3. Tipografías

| Familia configurada | Aplicación observada en código |
|---|---|
| DM Sans | Familia base del tema global y texto general. |
| Outfit | Títulos globales (`h1`–`h3`) y énfasis de componentes del diseño general. |
| Trebuchet MS | Títulos, botones y componentes de la experiencia de juego/jardín, con `system-ui` como alternativa. |
| Georgia | Uso puntual decorativo: iconos tipográficos de la navegación global y el énfasis del subtítulo de bienvenida; no es la familia base. |

La importación de DM Sans y Outfit está declarada desde Google Fonts en [styles.css](../../frontend/src/styles.css). El CSS configura familias alternativas del sistema. La aplicación local cargó, pero no se midió la carga efectiva de las fuentes externas ni se comparó su representación con producción.

La coexistencia de DM Sans/Outfit con Trebuchet MS/Georgia produce un cambio de registro entre producto y juego. No se propone una unificación en esta guía; se registra como diferencia observable y como decisión pendiente de revisión.

## 4.4. Iconografía e ilustraciones

- [GardenIcon.tsx](../../frontend/src/features/my-garden/GardenIcon.tsx) dibuja iconos SVG en línea para hoja, jardín, comunidad, libro, mapa, semilla, maceta, vertical, colgante, cámara y galería. Son decorativos (`aria-hidden`) cuando el texto del control aporta su nombre.
- La bienvenida usa [AuthIcon.tsx](../../frontend/src/features/auth/AuthIcon.tsx), [PlantIllustration.tsx](../../frontend/src/features/auth/PlantIllustration.tsx) y recursos de guía, flores y tejido importados en [AuthPage.tsx](../../frontend/src/features/auth/AuthPage.tsx).
- Los paisajes regionales y los personajes guía se referencian en [game-region-assets.ts](../../frontend/src/shared/ui/game-ui/game-region-assets.ts) y [garden-guides.ts](../../frontend/src/features/my-garden/garden-guides.ts). Mi Jardín usa también los recursos regionales compartidos.
- El catálogo muestra un icono por especie mediante el dato configurado; no se afirma que cada icono sea una ilustración botánica validada.
- Las ilustraciones de paisaje, personajes y ornamentos no se auditaron como material cultural ni botánico. La guía visual no certifica su precisión.

## 4.5. Componentes visuales

| Componente | Apariencia y comportamiento respaldados por el código |
|---|---|
| Botones | Hay botones globales verdes, accesos oscuros y dorados en la UI de juego, estados seleccionados y estilos secundarios. El CSS global declara un contorno de foco de 3 px con separación de 3 px. Las acciones rápidas de Mi Jardín miden 54 px de alto con etiquetas de 10 px en móvil; los botones de la escena declaran 44 px. Se midió la caja de las acciones rápidas, no el tamaño táctil efectivo en un dispositivo real. |
| Formularios | Etiquetas y controles nativos `input`, `select` y botones; campos agrupados en paneles. El registro de huerto muestra ubicación, modalidad y características; el registro de planta combina captura/selección de foto con datos de planta. La validación visual y los mensajes de error no se probaron con datos inválidos. |
| Tarjetas | La bienvenida presenta tarjetas educativas; catálogo, comunidad y modalidades usan tarjetas con texto, imágenes o iconos. El contenido exacto depende de cada módulo. |
| Paneles | Se usan superficies crema/verde, bordes y sombras en formularios de jardín, características del terreno, progreso y guía. |
| Diálogos | Registro de planta y Pasaporte Vivo se muestran como superficies superpuestas. `PlantPassport` usa un elemento `<dialog>` y `showModal()`. En `390 × 844`, el diálogo de registro midió `352 × 820` en `x=19`, `y=12`, dentro del viewport. La gestión de foco de cada diálogo no se certificó. |
| Navegación | La navegación global representa Mi Huerto Vivo, Comunidad y Mi camino verde; existen navegación interna y botones para Mi Jardín y Mi terreno. Los botones utilizan estado `aria-current` en las vistas correspondientes. Las rutas hash observadas incluyen `#bienvenida`, `#mi-jardin`, `#mi-jardin/terreno`, `#comunidades`, `#plantas`, `#mis-plantas`, `#bitacora`, `#mi-historia`, `#progreso` y `#usuarios`. |
| HUD | En Mi Jardín se muestran nombre y datos del terreno, modalidad y región, progreso local, controles de terreno/ayuda, guía regional, estado del jardín y accesos de acción. El HUD se compone en React alrededor de la escena. En `390 × 844` la guía mide ~`89.7 × 134.5 px` y termina en y≈`714`, tocando el borde superior de las acciones rápidas; el contador y el progreso ocupan la franja superior. El tercio inferior queda congestionado y el mensaje de guardado se solapa ~`18 px` con las acciones. |

## 4.6. Estados de interfaz

| Estado | Implementación encontrada | Límite de comprobación |
|---|---|---|
| Carga | La escena muestra “Preparando el paisaje de tu región…” con `role="status"`; la app visitante puede mostrar recuperación del jardín guardado. | No se midieron tiempos ni estados reales de red. |
| Error | La carga de escena comunica fallos; si la escena falla, se hace disponible una selección DOM accesible. La recuperación de Bitácora muestra error y acciones para reintentar o volver. | No se indujeron fallos durante una ejecución. |
| Vacío | Mi Jardín presenta un mensaje cuando no hay plantas; el catálogo muestra “No se encontraron especies…” cuando la búsqueda no coincide; Mi camino verde muestra que aún no hay hitos. | El contenido de la captura no acredita persistencia ni estados de servidor. |
| Selección | Se usa `aria-current` en vistas, `aria-pressed` en controles regionales y foco/selección para parcelas. | No se comprobó cada transición visual. |
| Éxito | Hay mensajes de guardado y avisos con `role="status"`; el terreno y el registro de planta usan estados de guardado (`data-state="saved"` en el terreno). | Se ejecutaron guardados locales de terreno y planta en la sesión visitante; la interfaz confirmó el terreno y «1 planta registrada». No se comprobó persistencia en SQLite ni sincronización. |
| Persistencia | En Comunidad visitante conviven «Demostración pública · Datos guardados en la base de datos» y «Guardado local · Solo en este navegador». | Contradicción confirmada en la ejecución local a `1440 × 1000` (P0-001). No se comprobó la base de datos. |
| Interacción | Hay hover/foco contextual de parcelas; React abre registro para una zona vacía y Pasaporte Vivo para una zona ocupada. Los errores y avisos de carga tienen roles ARIA. | Se comprobó el registro de una planta y la apertura del Pasaporte desde una parcela. No se probó la interacción completa con teclado ni en dispositivo táctil. |

## 4.7. Responsividad

Los estilos definen breakpoints por módulo. Entre los encontrados:

- Global: 1200 px, 900 px y 620 px en [styles.css](../../frontend/src/styles.css).
- Bienvenida/autenticación: 1200, 1020, 900, 760, 600 y 390 px en [auth.css](../../frontend/src/features/auth/auth.css), además de ajustes por altura.
- Comunidad: 1600, 1200, 900 y 620 px en [communities.css](../../frontend/src/features/communities/communities.css), con ajustes por altura y `prefers-reduced-motion`.
- Mi Jardín: 1600, 1500, 1200, 900, 620 y 400 px en [my-garden.css](../../frontend/src/features/my-garden/my-garden.css) y [my-garden-v3.css](../../frontend/src/features/my-garden/my-garden-v3.css); la capa inmersiva añade reglas móviles propias en [garden-live.css](../../frontend/src/features/my-garden/phaser-poc/garden-live.css) y [phaser-poc.css](../../frontend/src/features/my-garden/phaser-poc/phaser-poc.css).
- Registro de planta: 760 px en [plant-registration.css](../../frontend/src/features/my-garden/plant-registration.css); Bitácora tiene ajustes a 700 y 600 px en [garden-journal.css](../../frontend/src/features/my-garden/garden-journal.css).

Las reglas adaptan columnas, paneles, navegación y acciones para anchos menores. La ejecución local a `390 × 844` permitió comprobar:

- Bienvenida y Comunidad no presentan desbordamiento horizontal (`scrollWidth = innerWidth = 390`). El supuesto desbordamiento de Comunidad observado en la captura no se reprodujo y no se mantiene como defecto.
- Mi Jardín conserva las seis parcelas dentro del encuadre, pero la cámara fija usa zoom `0.203`: cada zona táctil de `138 × 85` unidades del mundo queda en ~`28 × 17 px`. Las parcelas se concentran en una franja de ~`121 × 33 px`; las cuatro laterales son difíciles de distinguir.
- En Mi Jardín, el mensaje de guardado se superpone ~`18 px` con las acciones rápidas; la guía toca el borde superior de esas acciones sin solaparse.
- En Mi terreno, el contenido comienza en y≈`1152`: la navegación superior mide ~`340 px` y la cabecera de bienvenida ~`680 px`. No hay overflow horizontal, pero el formulario/resumen queda muy por debajo del primer viewport.
- El diálogo de registro de planta cabe en `390 × 844` (`352 × 820`).

La captura móvil de Mi Jardín mide 337 × 825 px, no un viewport estándar. Las capturas de otras pantallas son más altas que un viewport típico y parecen composiciones de página completa. La verificación local se limitó a `1440 × 1000` y `390 × 844`; no se probaron dispositivos reales, otros anchos ni orientación horizontal.

## 4.8. Accesibilidad visual básica

- Hay estilos `:focus-visible` globales, etiquetas y nombres accesibles en controles, estados con `role="status"`/`role="alert"` y texto alternativo oculto para operar las parcelas sin depender del canvas.
- La bienvenida implementa pestañas con roles ARIA y navegación por flechas, Inicio y Fin; el formulario expone progreso como `progressbar`.
- Las seis parcelas tienen botones DOM con nombres descriptivos. El código maneja Tab, flechas, Inicio y Fin; Enter activa el botón nativo.
- Los adornos SVG y algunas imágenes se marcan como decorativos, separados de los nombres de los controles.
- Hay reglas `prefers-reduced-motion` en estilos de varios módulos.
- No se ha medido contraste de todos los estados, no se verificó el tamaño táctil mínimo en un dispositivo real, ni se hizo una auditoría con lector de pantalla o navegación completa por teclado. La presencia de atributos ARIA no sustituye esas pruebas.
- La etiqueta de 10 px de las acciones rápidas móviles y la reducción de la guía regional son riesgos de legibilidad. El diálogo de registro cabe en el viewport móvil, pero no se certificó su gestión de foco. No se declaran fallos de accesibilidad confirmados porque no se midieron en dispositivo ni con tecnologías de asistencia.

## 4.9. Recomendaciones no implementadas

Las siguientes recomendaciones no forman parte del código revisado y no deben presentarse como cambios realizados. Se registran para revisión de Leonel y para una futura iteración de UI/UX.

- **Mi Jardín móvil:** reubicar el mensaje de guardado para que no se superponga con la barra de acciones; reservar una banda superior o inferior libre y respetar `safe-area`. El solapamiento de ~`18 px` está confirmado a `390 × 844`.
- **Parcelas en móvil:** las seis están en cuadro, pero sus zonas táctiles miden ~`28 × 17 px` y las cuatro laterales son difíciles de distinguir. Ofrecer una vista general o un selector de parcela y aumentar contraste o tamaño. No introducir paneo o zoom sin coordinar con Phaser.
- **HUD móvil:** colapsar la guía regional a un icono o panel desplegable, reubicar el contador de plantas y evitar que el tercio inferior concentre demasiados controles. La guía toca las acciones rápidas y el estado de guardado se les superpone.
- **Etiquetas táctiles:** subir las etiquetas de acciones rápidas por encima de 10 px y revisar el tamaño táctil de todos los controles; no se midió el cumplimiento de 44 px en un dispositivo real.
- **Mi terreno móvil:** reducir el peso de la cabecera de bienvenida y de la navegación superior para que el resumen y las acciones aparezcan antes del actual y≈`1152`.
- **Mensajes de persistencia:** en Comunidad visitante, retirar «Datos guardados en la base de datos» o cambiarlo por «Guardado local»; no mezclar ambos mensajes en la misma vista. La contradicción está confirmada (P0-001).
- **Estado de éxito:** unificar el patrón de confirmación de guardado y hacer explícito si el dato es local o sincronizado. Se verificó el guardado local inmediato; no la persistencia.
- **Tipografía:** decidir si se mantiene la separación DM Sans/Outfit para producto y Trebuchet MS/Georgia para juego, o si se unifica con una escala común.
- **Contraste y foco:** realizar una auditoría de contraste de textos, botones y estados sobre fondos ilustrados; conservar el foco visible y probarlo con teclado.
- **Tokens regionales:** si se busca consistencia, definir variables de color por región en CSS en lugar de depender solo de recursos gráficos. No existe esa capa de tokens en el código revisado.

Estas recomendaciones no modifican la paleta, los componentes ni los recursos existentes. Cualquier implementación requiere aprobación y una revisión posterior de las capturas. No se añadieron capturas nuevas al repositorio.
