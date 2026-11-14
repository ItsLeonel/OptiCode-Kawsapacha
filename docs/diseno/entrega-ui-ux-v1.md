# Entrega UI/UX V1 — Kawsapacha

**Issue:** [UI-002 #32](https://github.com/ItsLeonel/OptiCode-Kawsapacha/issues/32)

**Responsable UI/UX:** Dylan Maldonado (`DylanIMM`) · **Revisión para:** Leonel (PM) · **Documentación:** Leonardo Lugmaña

**Estado de la entrega:** documentación preparada para revisión de Leonel. No se declara aprobada, cerrada ni marcada como completada.

## 3.1. Objetivo y alcance

Esta entrega reúne el inventario visual, las referencias disponibles, los hallazgos UX y las decisiones de diseño de Kawsapacha V1. La revisión parte del código del commit indicado, de la documentación técnica disponible y del conjunto de capturas existente en `docs/diseno/evidencias-diseno/`.

El alcance comprende bienvenida, registro e inicio de sesión, Comunidad, Mi terreno y selección de provincia, catálogo de plantas medicinales, Mi Jardín (con Costa como evidencia principal), registro de planta, Pasaporte Vivo, Bitácora y Mi camino verde. No incluye cambios de código, modificación de Phaser, generación de capturas, certificación de pruebas, auditoría de accesibilidad, validación botánica ni verificación funcional del backend más allá del health check local.

La revisión combina inspección de código, lectura de las capturas y una ejecución local en Chromium a `1440 × 1000` y `390 × 844`. La ejecución local cubrió el recorrido visitante, la creación de una comunidad ficticia, el guardado de un terreno, la carga de Mi Jardín, el registro de una planta y la apertura del Pasaporte Vivo. No se ejecutaron registro de cuenta, inicio de sesión real, persistencia en SQLite ni pruebas de producción; una captura o una sesión local tampoco demuestran sincronización multiusuario.

## 3.2. Estado del repositorio y de la aplicación local

### Repositorio

- Rama revisada: `docs/ui-002-evidencias-ux-v1`.
- HEAD revisado: `9d6b88af21ea282014610e574899fd55772e3772`.
- `origin/main` revisado: `dcc3beba10653c8a7720077e293ca8a5f0d4f0be`. `git merge-base --is-ancestor origin/main HEAD` confirma que `origin/main` está contenido en el HEAD revisado.
- `git diff origin/main..HEAD -- frontend backend` no devuelve diferencias: el código de frontend y backend revisado equivale al de `origin/main`.
- El frontend usa React 19, TypeScript, Vite 7 y Phaser 3.90. La navegación principal se resuelve con rutas hash en `App.tsx`.
- La revisión cubrió los componentes, páginas, rutas, estilos y recursos del frontend necesarios para describir las siete áreas del inventario.

El árbol de trabajo contiene cambios previos en documentación y en el conjunto de evidencias que no forman parte de esta edición. Esta revisión solo modifica los tres documentos indicados en la tarea y no altera código, Phaser, recursos, evidencias, planes ni otros documentos.

### Aplicación local en ejecución

Se recibió la URL local `http://localhost:5173/` y se recorrió con Chromium en modo headless. Resultados comprobados:

- La aplicación carga con el título `Kawsapacha | Mi Huerto Vivo` y abre en `#bienvenida`.
- El backend local responde en `http://localhost:3000/api/health` con `{"status":"ok","service":"kawsapacha-backend","db":"connected"}`.
- El flujo visitante permite entrar a Mi Jardín sin sesión; el estado se identifica como «Modo visitante · Sin sesión» y «Guardado en este navegador».
- Se creó una comunidad ficticia (Guayas / Guayaquil / Tarqui), se guardó un terreno de 24 m² con tipo «En tierra», agua «Disponible todo el año» y suelo «Franco», y se cargó Mi Jardín.
- Se registró una planta de prueba con imagen generada y especie Menta; la interfaz confirmó «1 planta registrada» y abrió el Pasaporte Vivo.
- Catálogo, Mis plantas, Bitácora y Mi camino verde cargan por ruta directa en escritorio sin errores de consola ni respuestas 4xx/5xx, salvo las excepciones indicadas abajo.
- El único 404 observado es `/favicon.ico`. No afecta la interfaz.
- En modo visitante, la llamada `GET http://localhost:3000/api/calendar?...` responde 401; el Pasaporte Vivo sigue abriendo con contenido alternativo. Es una frontera de autenticación esperada, no un fallo visual confirmado.
- La correspondencia con una URL pública, con producción o con el estado exacto del commit en otro entorno no se verificó. La sesión local no demuestra persistencia en SQLite ni sincronización entre usuarios.
- No se probaron registro de cuenta, inicio de sesión real, unión a una comunidad existente, publicación comunitaria, recuperación ante fallos ni las demás regiones y modalidades.

### Criterios de lectura del inventario

| Término | Significado en este documento |
|---|---|
| Implementado en repositorio | El componente, ruta, estilo o recurso existe en el código del commit revisado. No implica que el flujo funcione. |
| Visible en la aplicación local | Se observó en una sesión real de `http://localhost:5173/`. No equivale a producción. |
| Verificado funcionalmente | Se ejecutó la interacción y se comprobó su resultado en la sesión local. |
| No comprobado o inaccesible | No hay URL pública, sesión, captura o reproducción suficiente para afirmarlo. |

## 3.3. Inventario visual de pantallas

| Área | Implementación en repositorio | Verificación en aplicación local | Evidencia disponible | Observaciones |
|---|---|---|---|---|
| Bienvenida, registro e inicio de sesión | Implementada. `AuthPage` y `AuthForm` incluyen pestañas de registro y acceso, formulario, validación visual, progreso de campos y acceso de visitante. | Verificada localmente: carga en `1440 × 1000` y `390 × 844`; sin desbordamiento horizontal. El acceso visitante funciona. No se probó registro de cuenta ni inicio de sesión real. | Capturas de escritorio y móvil. | La captura muestra el formulario de registro; no demuestra una cuenta creada, un inicio de sesión ni persistencia. Código: [AuthPage.tsx](../../frontend/src/features/auth/AuthPage.tsx), [AuthForm.tsx](../../frontend/src/features/auth/AuthForm.tsx). |
| Comunidad | Implementada. La página presenta comunidad, miembros y roles, accesos a huertos, experiencias y espacios comunitarios; también admite vista de visitante. | Verificada localmente: carga, creación de una comunidad personal con datos ficticios y vista de comunidad; sin desbordamiento horizontal a `390 px`. Se confirmó la contradicción de mensajes de persistencia (P0-001). No se probó unirse a una comunidad existente, publicar ni sincronizar. | Capturas de escritorio y móvil. | La captura corresponde a una vista de visitante/demo con información de ejemplo. La creación local funcionó; no prueba persistencia ni sincronización comunitaria. Código: [CommunitiesPage.tsx](../../frontend/src/features/communities/CommunitiesPage.tsx). |
| Mi terreno y selección de provincia | Implementada. El formulario incluye selector territorial, tipo de cultivo, superficie, características y guardado. La provincia se mapea a región en `garden-region.ts`. | Verificada localmente: ubicación heredada, tipo «En tierra», agua, suelo, guardado y resumen. En `390 px` el contenido comienza en y≈`1152` por la cabecera y la navegación. No se probaron otras regiones ni modalidades. | Escritorio: Guayas. Móvil: Manabí. | Las dos capturas muestran provincias distintas y no son una comparación de la misma sesión o configuración. La sesión local usó Guayas/Guayaquil/Tarqui. Código: [RealGardenPage.tsx](../../frontend/src/features/real-gardens/RealGardenPage.tsx), [garden-region.ts](../../frontend/src/features/real-gardens/garden-region.ts). |
| Catálogo de plantas medicinales | Implementada. `App.tsx` construye la búsqueda, las tarjetas y la acción de registrar una especie. El catálogo local se combina con la respuesta de la API cuando está disponible. | Verificada localmente: carga por ruta directa en escritorio sin errores de consola. No se probaron búsqueda, filtros, registro desde tarjeta ni la API con datos reales. | Sin captura. | La disponibilidad de la API y el contenido final del catálogo no se comprobaron más allá de la carga de la vista. Código: [App.tsx](../../frontend/src/App.tsx), [plant-species.ts](../../frontend/src/features/my-garden/plant-species.ts). |
| Mi Jardín | Implementada. React compone HUD, guía, paneles, acciones y diálogos; Phaser pinta el paisaje y las seis zonas. El código contempla Costa, Sierra, Amazonía y Galápagos, y las modalidades En tierra, Macetas, Vertical y Colgante. | Verificada localmente en Costa/En tierra: canvas, seis slots y cámara fija en `1440 × 1000` y `390 × 844`. En móvil las seis parcelas están dentro del encuadre, pero son pequeñas; el estado de guardado se solapa con las acciones rápidas. | Capturas de Costa en escritorio y móvil. | Se ven el paisaje de Costa, el HUD, la guía regional y las acciones de React. La unión del terreno con el paisaje derecho no se confirmó como defecto en `1440 × 1000`. Código: [MyGardenPage.tsx](../../frontend/src/features/my-garden/MyGardenPage.tsx), [PhaserGardenPoc.tsx](../../frontend/src/features/my-garden/phaser-poc/PhaserGardenPoc.tsx), [createGardenGame.ts](../../frontend/src/features/my-garden/phaser-poc/createGardenGame.ts). |
| Registro de planta, Pasaporte Vivo y Bitácora | Implementadas. El registro combina cámara o galería con datos de la planta; el Pasaporte usa un diálogo nativo; la Bitácora presenta actividades, filtros, fichas y estados vacíos. | Registro y Pasaporte verificados localmente con una imagen generada y especie Menta: se guardó «1 planta registrada» y se abrió el Pasaporte. La Bitácora carga por ruta directa en escritorio. No se probó persistencia, crecimiento ni cuidados. | Registro y Pasaporte: escritorio y móvil. Bitácora: sin captura. | Las capturas son estados visuales. La sesión local confirma el flujo inmediato, no la persistencia entre recargas ni la sincronización. Código: [PlantRegistrationModal.tsx](../../frontend/src/features/my-garden/PlantRegistrationModal.tsx), [PlantPassport.tsx](../../frontend/src/features/my-garden/PlantPassport.tsx), [GardenHistory.tsx](../../frontend/src/features/my-garden/GardenHistory.tsx). |
| Mi camino verde | Implementada. La vista deriva hitos, semillas de vida, nivel, insignias y retos de las actividades documentadas; el código indica que son reconocimientos locales. | Verificada localmente: carga por ruta directa en escritorio sin errores. No se comprobó el cálculo con actividades reales ni los estados posteriores al registro. | Sin captura. | No se comprobó el cálculo con datos reales ni la presentación de estados vacíos más allá de la carga inicial. Código: [GardenProgress.tsx](../../frontend/src/features/my-garden/GardenProgress.tsx), [GreenChallenges.tsx](../../frontend/src/features/my-garden/GreenChallenges.tsx), [App.tsx](../../frontend/src/App.tsx). |

## 3.4. Evidencias visuales

Las imágenes del conjunto de evidencias se enlazan desde sus rutas relativas en `docs/diseno/evidencias-diseno/`. Esta revisión no las modifica, reemplaza, mueve ni genera capturas nuevas.

| Pantalla | Escritorio | Móvil |
|---|---|---|
| Bienvenida y registro | [01-bienvenida-registro-desktop.png](evidencias-diseno/01-bienvenida-registro-desktop.png) | [01-bienvenida-registro-mobile.png](evidencias-diseno/01-bienvenida-registro-mobile.png) |
| Comunidad | [02-comunidad-desktop.png](evidencias-diseno/02-comunidad-desktop.png) | [02-comunidad-mobile.png](evidencias-diseno/02-comunidad-mobile.png) |
| Mi terreno — Guayas / Manabí | [03-terreno-guayas-desktop.png](evidencias-diseno/03-terreno-guayas-desktop.png) | [03-terreno-manabi-mobile.png](evidencias-diseno/03-terreno-manabi-mobile.png) |
| Mi Jardín — Costa | [04-jardin-costa-desktop.png](evidencias-diseno/04-jardin-costa-desktop.png) | [04-jardin-costa-mobile.png](evidencias-diseno/04-jardin-costa-mobile.png) |
| Registro de planta | [05-registro-planta-desktop.png](evidencias-diseno/05-registro-planta-desktop.png) | [05-registro-planta-mobile.png](evidencias-diseno/05-registro-planta-mobile.png) |
| Pasaporte Vivo | [06-pasaporte-vivo-desktop.png](evidencias-diseno/06-pasaporte-vivo-desktop.png) | [06-pasaporte-vivo-mobile.png](evidencias-diseno/06-pasaporte-vivo-mobile.png) |

Se comprobó la existencia de los doce archivos. Sus dimensiones declaradas son: escritorio `1440 × 1000` (Comunidad `1440 × 1043`, Mi terreno `1440 × 1257`); móvil `524 × 1651` (Bienvenida), `479 × 3163` (Comunidad), `456 × 3468` (Mi terreno), `337 × 825` (Mi Jardín), `350 × 967` (Registro) y `442 × 967` (Pasaporte). Las capturas móviles son imágenes de página completa o recortes, no necesariamente un viewport de `390 × 844`; por eso no se usan como certificación de responsive.

La verificación local se hizo con viewports de `1440 × 1000` y `390 × 844`. No se añadieron capturas nuevas al repositorio; las medidas de esta sesión se registran en el texto de los hallazgos.

No hay captura del catálogo, la Bitácora, Mi camino verde, las regiones Sierra, Amazonía o Galápagos, ni las modalidades Macetas, Vertical o Colgante.

## 3.5. Diseño propuesto en Figma

**Propuesta de diseño visual en Figma:** [diseño propuesto Kawsapacha](https://www.figma.com/design/w5Ky7101rMa2XW6cWX5nYi/dise%C3%B1o-propuesto-kawsapacha?node-id=0-1&t=qNBA6nsNjoBFpH1m-1).

El enlace se registra como referencia de una propuesta visual. No se presenta como prototipo interactivo validado, implementación idéntica a la aplicación ni archivo cuyo acceso de otras personas se haya comprobado. No se verificó la interactividad del archivo ni que la implementación coincida exactamente con él.

## 3.6. Hallazgos de experiencia de usuario

Los hallazgos combinan la lectura de código y capturas con la ejecución local. Cuando una observación de la captura no se reprodujo en la sesión local, se indica expresamente y no se mantiene como defecto confirmado. Ningún hallazgo se declara corregido en esta entrega.

### P0 — Bloqueos para la demostración

Se confirmó un P0 de comunicación sobre persistencia. No se identificaron fallos P0 de carga o de flujo principal en la ejecución local: la aplicación carga, el recorrido visitante llega a Mi Jardín, se crea una comunidad y un terreno ficticios, y se registra una planta.

| Identificador | Pantalla o módulo | Evidencia | Archivo o componente relacionado | Problema observado | Corrección propuesta | Estado de verificación |
|---|---|---|---|---|---|---|
| P0-001 | Comunidad — modo visitante | [02-comunidad-desktop.png](evidencias-diseno/02-comunidad-desktop.png) y sesión local a `1440 × 1000` | [CommunitiesPage.tsx](../../frontend/src/features/communities/CommunitiesPage.tsx), [community-v3.css](../../frontend/src/features/communities/community-v3.css), [community-page-v3.css](../../frontend/src/features/communities/community-page-v3.css) | La interfaz muestra a la vez «Demostración pública · Datos guardados en la base de datos» y «Guardado local · Solo en este navegador», junto con «Modo visitante · Sin sesión». Los mensajes se contradicen sobre dónde se guardan los datos y pueden inducir a error en la demo. | Unificar el mensaje según el modo: en visitante, indicar guardado local y no sincronizado; reservar «base de datos» para una sesión autenticada. | Confirmado en la ejecución local a `1440 × 1000`. No corregido. |

### P1 — Legibilidad, responsive, navegación o interacción

| Identificador | Pantalla o módulo | Evidencia | Archivo o componente relacionado | Problema observado | Corrección propuesta | Estado de verificación |
|---|---|---|---|---|---|---|
| UX-001 | Mi Jardín — Costa móvil | [04-jardin-costa-mobile.png](evidencias-diseno/04-jardin-costa-mobile.png) y medición local a `390 × 844` | [App.tsx](../../frontend/src/App.tsx), [garden-journal.css](../../frontend/src/features/my-garden/garden-journal.css), [garden-live.css](../../frontend/src/features/my-garden/phaser-poc/garden-live.css) | Confirmado: el mensaje «Guardado local · Solo en este navegador» ocupa y≈`686–732` y las acciones rápidas y≈`714–836`; se superponen ~`18 px` en vertical y comparten franja horizontal. El estado usa `position: fixed` y las acciones ocupan dos filas de 54 px desde el borde inferior. | Reubicar el estado en una banda libre, preferentemente sobre el HUD superior o con separación calculada respecto de la barra de acciones; conservar `safe-area`; probar `390 × 844`, `360 × 640` y orientación horizontal. | Confirmado en la ejecución local a `390 × 844`. No corregido. |
| UX-002 | Mi Jardín — Costa móvil | [04-jardin-costa-mobile.png](evidencias-diseno/04-jardin-costa-mobile.png) y medición local a `390 × 844` | [createGardenGame.ts](../../frontend/src/features/my-garden/phaser-poc/createGardenGame.ts), [layouts.ts](../../frontend/src/features/my-garden/phaser-poc/layouts.ts), [phaser-poc.css](../../frontend/src/features/my-garden/phaser-poc/phaser-poc.css) | Las seis parcelas están dentro del encuadre, pero la cámara fija usa zoom `0.203` y cada zona táctil de `138 × 85` unidades del mundo queda en ~`28 × 17 px` de pantalla. Los centros se separan ~`60.4 px` en horizontal y ~`32.6 px` en vertical; la franja completa mide ~`121 × 33 px`. Las cuatro laterales son difíciles de distinguir y la captura solo muestra con claridad las dos centrales. | Aumentar contraste o tamaño de las parcelas, reducir la ocupación del HUD sobre la escena y ofrecer un selector o vista general de parcelas. Cualquier paneo, zoom o cambio de encuadre debe coordinarse antes de modificar Phaser. | Confirmado en la ejecución local: las seis existen y están en cuadro; su legibilidad táctil es insuficiente. No corregido. |
| UX-003 | Mi Jardín — Costa escritorio | [04-jardin-costa-desktop.png](evidencias-diseno/04-jardin-costa-desktop.png) y sesión local a `1440 × 1000` | [createGardenGame.ts](../../frontend/src/features/my-garden/phaser-poc/createGardenGame.ts), [scene-painter.ts](../../frontend/src/features/my-garden/phaser-poc/scene-painter.ts), [courtyard.ts](../../frontend/src/features/my-garden/phaser-poc/courtyard.ts), [coastal-terrain.ts](../../frontend/src/features/my-garden/phaser-poc/coastal-terrain.ts) | No se confirmó un corte vertical dominante en el borde derecho a `1440 × 1000`; un análisis de gradiente horizontal no mostró una costura persistente en esa zona. El código ajusta el ancho del terreno y comenta que así evita que el césped termine abruptamente en ventanas bajas. La observación original puede depender de otra resolución. | Revisar la unión en varios anchos y alturas; si aparece un corte, extender la superficie o mezclar el borde con el paisaje. No modificar Phaser sin coordinación. | No confirmado como defecto en `1440 × 1000`. Pendiente de revisar en otros tamaños. |
| UX-004 | Mi Jardín — Costa móvil y escritorio | Capturas de Costa y medición local | [MyGardenPage.tsx](../../frontend/src/features/my-garden/MyGardenPage.tsx), [garden-live.css](../../frontend/src/features/my-garden/phaser-poc/garden-live.css), [phaser-poc.css](../../frontend/src/features/my-garden/phaser-poc/phaser-poc.css) | En móvil la guía regional mide ~`89.7 × 134.5 px`, termina en y≈`714` y toca el borde superior de las acciones rápidas sin solaparse; el contador ocupa y≈`198–250`, el progreso y≈`146–183` y el mundo y≈`96–140`. Las etiquetas de las acciones rápidas bajan a 10 px y el CSS reduce la guía, por lo que parte de su texto puede quedar oculto. En escritorio la guía mide `176 × 264 px`, termina en y≈`904` y deja ~`10 px` antes de las acciones en y≈`914`. | Revisar la jerarquía del HUD: reducir o colapsar la guía en móvil, reubicar el contador, mantener etiquetas legibles y asegurar áreas táctiles de al menos 44 px. Validar con teclado y con puntero táctil. | Confirmado en la ejecución local: no hay solapamiento con la guía, pero el tercio inferior queda muy congestionado. No corregido. |
| UX-005 | Mi terreno — móvil | [03-terreno-manabi-mobile.png](evidencias-diseno/03-terreno-manabi-mobile.png) y medición local a `390 × 844` | [RealGardenPage.tsx](../../frontend/src/features/real-gardens/RealGardenPage.tsx), [real-gardens.css](../../frontend/src/features/real-gardens/real-gardens.css), [GardenNavigation.tsx](../../frontend/src/features/my-garden/GardenNavigation.tsx) | A `390 × 844` no hay desbordamiento horizontal: `scrollWidth = innerWidth = 390` y los paneles ocupan `366 px`. Sin embargo, el contenido de Mi terreno comienza en y≈`1152`: la navegación superior mide ~`340 px` y la cabecera de bienvenida ~`680 px`, por lo que el formulario/resumen queda muy por debajo del primer viewport. La captura móvil de `456 px` sugiere una columna más estrecha, pero ese ancho no se reprodujo. | Revisar el colapso de la navegación y el peso de la cabecera en móvil para que el resumen y las acciones aparezcan antes; comprobar el ancho exacto de la captura y el apilamiento de paneles. | Confirmado en la ejecución local: sin overflow horizontal, pero con desplazamiento vertical excesivo antes del contenido. No corregido. |

La observación anterior sobre un posible desbordamiento en Comunidad móvil no se mantiene como hallazgo: a `390 × 844` se midió `scrollWidth = innerWidth = 390`, sin overflow horizontal. La franja clara de la captura no se reprodujo; puede ser un artefacto de composición o corresponder a otro ancho. Si vuelve a aparecer, debe reproducirse en el ancho exacto de la captura antes de abrir un defecto.

### P2 — Mejoras estéticas no bloqueantes

| Identificador | Pantalla o módulo | Evidencia | Problema o mejora | Corrección propuesta | Estado de verificación |
|---|---|---|---|---|---|
| UX-101 | Global | Código de estilos | La interfaz general usa DM Sans y Outfit, mientras la capa de juego usa Trebuchet MS y Georgia. La diferencia es perceptible entre pantallas. | Evaluar una unificación tipográfica solo con aprobación del PM; no es un cambio urgente para la demo. | Revisión de CSS. No evaluado visualmente en la sesión local. |
| UX-102 | Mi Jardín | Capturas de Costa y medición local | La jerarquía del HUD, la guía y el contador puede refinarse para dar más protagonismo a las parcelas. | Ajustar espaciado, contraste y agrupación de controles después de resolver los hallazgos P1 de móvil. | Propuesta no implementada. |
| UX-103 | Comunidad | [02-comunidad-desktop.png](evidencias-diseno/02-comunidad-desktop.png) y sesión local | Se muestran las tarjetas «Foro comunitario», «Aprender juntos» y «Eventos y mingas». El alcance V1 excluye foro y funciones extendidas; no se determinó si las tarjetas son informativas o accesos. | Confirmar con Leonel si deben permanecer en la demo y si son solo informativas; no convertirlas en alcance nuevo sin decisión. | Presencia confirmada; alcance no confirmado. |
| UX-104 | Pasaporte Vivo | [06-pasaporte-vivo-desktop.png](evidencias-diseno/06-pasaporte-vivo-desktop.png) | En la captura, «Registrada» figura como 9/11/2026 y la siembra como 8/11/2026. Puede deberse a zona horaria o al significado de cada fecha. | Confirmar con QA y PM antes de cambiar textos o lógica. | Observación de captura; no reproducida en la sesión local. |

## 3.7. Decisiones de diseño

### Decisiones respaldadas por la implementación

- React compone formularios, navegación, paneles, diálogos, HUD y mensajes; Phaser se integra mediante un puente de eventos y se ocupa del paisaje y de la representación de las parcelas.
- La provincia determina la región visual mediante `garden-region.ts`. El código contempla Costa, Sierra, Amazonía/Oriente y Galápagos con paisajes y guías diferenciados.
- Mi Jardín conserva seis identificadores estables, `garden-slot-0` a `garden-slot-5`, y reutiliza el modelo de seis espacios en las cuatro modalidades de cultivo.
- La interfaz distingue visitante y sesión autenticada. El modo visitante guarda en el navegador y no se presenta como una cuenta ni como sincronización multiusuario.
- La cámara actual de la escena es fija. Los comandos heredados de paneo y zoom no producen efecto en el código revisado; el movimiento del puntero solo diferencia clic de arrastre.
- La ejecución local confirmó el recorrido visitante, la creación de una comunidad ficticia, el guardado local del terreno, la carga de Mi Jardín, el registro de una planta y la apertura del Pasaporte Vivo.
- La dirección visual combina paisajes regionales, madera, tierra, tejidos y personajes guía con controles de interfaz separados.

### Decisiones pendientes de revisión o aprobación

- Leonel debe revisar la dirección artística final de Mi Jardín, la transición del terreno con el paisaje de Costa, la guía regional, la jerarquía del HUD y las correcciones responsive propuestas.
- Debe acordarse si la composición fija de la cámara es la esperada. Algunos documentos de implementación aún mencionan cámara o zoom; esta documentación describe el código actual y deja la discrepancia pendiente de confirmar.
- La unificación tipográfica entre la interfaz general y la capa de juego queda como recomendación, no como decisión tomada.

## 3.8. Limitaciones y aspectos pendientes

- No se ejecutaron registro de cuenta, inicio de sesión real, persistencia en SQLite, sincronización multiusuario, unión a una comunidad existente, publicación comunitaria ni recuperación ante fallos.
- En modo visitante, la API de calendario devuelve 401; el Pasaporte usa contenido alternativo. Es una frontera de autenticación esperada, no una certificación de que el calendario autenticado funcione.
- Las evidencias cubren Costa y no permiten certificar Sierra, Amazonía/Oriente, Galápagos, ni las modalidades Macetas, Vertical y Colgante.
- No hay captura del catálogo, la Bitácora ni Mi camino verde; solo se comprobó su carga por ruta directa en escritorio.
- La verificación responsive se limitó a `1440 × 1000` y `390 × 844`; no se probaron dispositivos reales, otros anchos ni orientación horizontal. Las capturas móviles no equivalen a un viewport estándar.
- No se modificaron código, Phaser, recursos, evidencias, planes ni otros documentos. No se generaron capturas nuevas ni se hicieron commits.

## 3.9. Resumen del estado de preparación para la demo

La documentación queda preparada para revisión de Leonel. No se declara aprobación del PM ni cierre del issue.

- **P0 confirmado:** en Comunidad visitante se muestran a la vez «Datos guardados en la base de datos» y «Guardado local · Solo en este navegador» (P0-001). Los flujos de carga, recorrido visitante, comunidad, terreno, Mi Jardín, registro de planta y Pasaporte funcionaron.
- **Riesgos P1 para la demo:** superposición del mensaje de guardado en Mi Jardín móvil (~18 px); seis parcelas presentes pero con zonas táctiles de ~28 × 17 px y cuatro laterales difíciles de distinguir; HUD móvil congestionado; Mi terreno móvil con contenido que empieza en y≈1152 por la cabecera y la navegación.
- **No confirmado:** corte del terreno con el paisaje derecho a `1440 × 1000`; no se mantiene el supuesto desbordamiento de Comunidad móvil a `390 px`.
- **P2 / alcance:** confirmar con Leonel si las tarjetas «Foro comunitario», «Aprender juntos» y «Eventos y mingas» deben permanecer en la demo y si son informativas; confirmar la diferencia de fechas de la captura 06 (registro 9/11 y siembra 8/11).
- **Pendiente para cerrar la verificación:** disponer de una URL pública, probar registro/login y persistencia, recorrer las demás regiones y modalidades, revisar otros anchos y confirmar el acceso a Figma.
- **Estado:** preparada para revisión; no aprobada.

