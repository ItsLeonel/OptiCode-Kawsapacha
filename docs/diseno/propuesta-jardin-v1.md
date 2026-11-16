# Mi Jardín V1 — dirección visual y solución técnica

> **Nota de vigencia — 15/11/2026:** este documento describe de forma fiel la **revisión local histórica** (Costa/En tierra, cámara fija y capturas de escritorio/móvil) realizada por Dylan. Su frase inicial «no implementada» se refiere a **propuestas de rediseño**, no a que Mi Jardín/Phaser carezca de implementación. Desde entonces se desarrolló el [PR #74](https://github.com/ItsLeonel/OptiCode-Kawsapacha/pull/74), rama `fix/responsive-mobile-garden` (HEAD `6d7750a`, base común `3f3547b`, **sin fusionar**), con cámara responsive y controles móviles.
>
> **Contraste por medición del 15/11/2026 (`main` `5173` vs. rama #74 `5174`):** la rama #74 **sí** añade cámara adaptable con `Acercar jardín`, `Alejar jardín`, `Centrar jardín`, arrastre y pellizco, y un selector de parcela; el encuadre conserva las seis parcelas. A `390 × 844` el botón de menú pasa de `30 × 58` a `48 × 48` px, el widget lunar de `132 × 36` a `132 × 44` px y las acciones rápidas de `316` a `376` px de ancho. En cambio, el **solapamiento del mensaje de guardado descrito como ~`18 px` no se reprodujo** ni en `main` ni en la rama (0 px a `390 × 844`, autenticado y visitante). Se conservan los datos históricos como línea base y **no** se atribuyen a `main` o producción mejoras que solo están en el PR.
>

## 1. Objetivo y dirección artística

Mi Jardín representa visualmente un huerto medicinal vinculado al territorio ecuatoriano mediante una escena ilustrada de aspecto 2.5D y una interfaz educativa. El paisaje aporta contexto; las plantas y características mostradas deben corresponder a datos registrados, no a crecimiento o ubicación inferidos de la ilustración.

**Implementado:** la aplicación combina escenarios, superficies de cultivo y elementos gráficos modulares con una interfaz de React. La ejecución local permitió cargar Mi Jardín en Costa/En tierra y registrar una planta; la captura disponible documenta Costa. No se certifica aquí la aprobación artística de esa escena ni de las demás regiones.

**Pendiente:** cualquier ajuste de dirección artística, equivalencia con referencias externas y aprobación del diseño debe revisarse con Leonel. La propuesta visual de Figma se conserva como propuesta y no se toma como implementación actual.

## 2. Arquitectura visual y técnica

| Capa | Responsabilidad respaldada por el código |
|---|---|
| React | `MyGardenPage` monta cabecera, HUD, navegación, mensajes, guía, panel de características, formularios y diálogos. Mantiene controles DOM para seleccionar zonas y activa el registro o la consulta de una planta. |
| Phaser 3 | `PhaserGardenPoc` crea la escena semiisométrica, carga recursos regionales/modulares, pinta el paisaje y recibe entradas de las zonas. `GardenSceneBridge` comunica comandos y eventos tipados con React. |
| Modelo compartido | El adaptador deriva el modelo visual de los datos existentes del huerto, plantas y actividades; la escena no debe inventar plantas ni atribuir al paisaje dimensiones físicas exactas. |
| Accesibilidad | Los botones DOM nombrados ofrecen alternativa a la interacción sobre el canvas. El canvas visual se marca como oculto para tecnologías de asistencia cuando la interfaz accesible está disponible. |

La documentación de implementación ubica formularios y HUD en React y paisaje/escena en Phaser. La cámara de `main` usa una composición fija: `createGardenGame.ts` indica que comandos heredados de paneo/zoom no producen efecto y el movimiento del puntero solo diferencia clic de arrastre. En la sesión histórica el zoom fue `0.75` a `1440 × 1000` y `0.203` a `390 × 844`; no se observó paneo ni zoom interactivo en `main`. La rama del PR #74 **sí** incorpora cámara adaptable con zoom, paneo, pellizco y selector de parcela (ver la nota de vigencia). La capacidad final debe confirmarse con Leonel antes de presentarla como interacción de `main`.

## 3. Regiones

La selección territorial mapea provincia a región mediante [garden-region.ts](../../frontend/src/features/real-gardens/garden-region.ts). El jardín carga un paisaje por región y el código define guías regionales. Hay recursos regionales en fondos compartidos, assets del juego y recursos del renderizador.

| Región | Identificación en el modelo | Recursos declarados | Evidencia V1 en esta entrega |
|---|---|---|---|
| Costa | `costa` | Paisaje regional, guía Costa y recursos específicos de terreno costero en el módulo Phaser. | Capturas de Mi Jardín Costa en escritorio y móvil. |
| Sierra | `sierra` | Paisaje y guía regionales; el modelo usa el mismo esquema de seis zonas. | No hay captura de Mi Jardín Sierra en las evidencias suministradas. |
| Amazonía u Oriente | `oriente` | Paisaje y guía regionales. | No hay captura de Mi Jardín Oriente en las evidencias suministradas. |
| Galápagos | `galapagos` | Paisaje y guía regionales. | No hay captura de Mi Jardín Galápagos en las evidencias suministradas. |

La disponibilidad de recursos y las ramas de carga en código no prueban que se hayan revisado visualmente las cuatro regiones. Por ello no se atribuyen aquí motivos gráficos concretos ni se afirma paridad visual para regiones sin captura. Los fondos declarados para el formulario de terreno y para el juego también pertenecen a rutas distintas; no deben confundirse con una misma imagen.

## 4. Modalidades de cultivo

Las cuatro modalidades se identifican en el modelo como `ground`, `pots`, `vertical` y `hanging`. Las seis posiciones se conservan al cambiar de modalidad o región; los recursos y anclajes visuales varían.

| Modalidad | Distribución visual implementada | Elementos y representación de parcelas | Acciones / pendientes |
|---|---|---|---|
| En tierra | El perfil de disposición usa posiciones de suelo; para Costa el código define una composición 3 × 2 y carga arte de parcelas costeras o relieve según los datos. | Seis zonas identificables; las características de suelo/distribución se derivan de opciones registradas. La geometría es ilustrativa, no un plano de capacidad. | Seleccionar una zona vacía inicia el registro; una zona ocupada permite abrir Pasaporte Vivo. La captura de Costa solo muestra el escenario, no todas las configuraciones de suelo. |
| Macetas | El perfil usa anclajes de recipientes y geometría de maceta. | Seis espacios estables; se carga el recurso modular de macetas. | Se mantienen las acciones comunes de registro/consulta. La captura móvil no basta para revisar la distribución completa de los seis recipientes. |
| Vertical | El código define tres estructuras y anclajes en dos niveles para las seis zonas. | Reutiliza bastidores/recipientes modulares y conserva los identificadores de zona. | Se mantienen las acciones comunes. No hay captura V1 vertical en el conjunto revisado. |
| Colgante | La geometría distribuye las zonas en grupos visuales 3 + 2 + 1; Costa dispone de anclajes específicos. | Usa recursos de pérgola y recipientes colgantes sin cambiar los seis identificadores. | Se mantienen las acciones comunes. No hay captura V1 colgante en el conjunto revisado. |

Las cuatro modalidades no son cuatro escenas independientes: comparten la misma escena, los seis identificadores y el modelo de datos; cambian el perfil de disposición, los anclajes y los recursos visuales. En todas, el dibujo escenográfico no reemplaza los botones y acciones de React. El código de [layouts.ts](../../frontend/src/features/my-garden/phaser-poc/layouts.ts) y [createGardenGame.ts](../../frontend/src/features/my-garden/phaser-poc/createGardenGame.ts) define perfiles, anclajes y carga de recursos; la comprobación visual disponible no cubre las cuatro modalidades.

## 6. Seis parcelas interactivas

Los identificadores estables son:

- `garden-slot-0`
- `garden-slot-1`
- `garden-slot-2`
- `garden-slot-3`
- `garden-slot-4`
- `garden-slot-5`

El código fija `PLOT_COUNT` en seis y conserva `plot` de `0` a `5` en el modelo visual. Los identificadores enlazan la zona pintada por Phaser con botones DOM accesibles; cambiar de región o modalidad modifica anclajes y recursos, no la identidad de las posiciones.

Una zona vacía comunica a React la intención de registrar una planta; una zona ocupada permite seleccionar la planta y abrir su Pasaporte Vivo. La distribución visual no constituye una medición del huerto físico. No se proponen 16 escenas ni recursos gráficos nuevos para esta entrega.

En la sesión histórica a `390 × 844`, las seis parcelas están dentro del encuadre, pero la zona táctil de `138 × 85` unidades del mundo quedaba en ~`28 × 17 px` y los centros se separaban ~`60.4 × 32.6 px`; las cuatro laterales eran difíciles de distinguir. A `1440 × 1000` la composición es más legible. La rama #74 añade controles de zoom (`Acercar/Alejar/Centrar jardín`), arrastre y pellizco, y un selector de parcela, sin cambiar los seis identificadores; su precisión táctil queda pendiente de validar en dispositivo real. La propuesta de un selector o vista general de parcelas **sí está implementada en la rama #74** (no fusionada), no en `main`.

## 7. Interacciones y elementos de interfaz

### Implementado en código

- El clic en una zona envía un evento al puente Phaser–React; React dirige a registro de planta o a consulta del Pasaporte según exista una planta asociada.
- La escena contiene HUD y accesos a Mi terreno y ayuda; React proporciona formularios, paneles de características, barra de acciones, Bitácora y navegación.
- La interfaz presenta región, modalidad, nombre del huerto y estado/progreso local cuando hay datos. Los avisos de carga y error tienen alternativas de estado y, si falla la escena, se habilita el grupo accesible de botones de zonas.
- Las seis zonas pueden enfocarse y recorrer mediante teclado; el manejo de teclas incluye flechas, Inicio y Fin. La activación se delega a botones HTML.
- El código de `main` diferencia clic de movimiento del puntero y **no** implementa paneo/zoom; la rama #74 sí lo añade (zoom, paneo, pellizco y selector de parcela).
- La sesión local confirmó el registro de una planta y la apertura del Pasaporte desde una parcela; no se probó el recorrido completo de todas las zonas.

## 8. Viabilidad y limitaciones

La separación React/Phaser es viable para conservar formularios y controles semánticos fuera del canvas mientras la escena se ocupa de paisaje y representación visual. Los identificadores estables facilitan conservar asociaciones entre zona y planta al cambiar la composición. El código actual ya define cuatro perfiles de modalidad, regiones, guías y selección de seis zonas; esta documentación no necesita crear escenas ni assets nuevos para describirlos.

Limitaciones registradas:

- La cámara de la escena de `main` es fija; la rama #74 introduce cámara adaptable. Debe acordarse con Leonel cuál es el encuadre esperado.
- En Mi Jardín móvil la guía toca el borde superior de las acciones sin solaparse y el **solapamiento histórico de ~`18 px` del mensaje de guardado no se reprodujo** (0 px a `390 × 844`). Las seis parcelas están en cuadro pero son pequeñas en `main`; la rama #74 añade zoom/paneo/selector. La corrección de legibilidad no está fusionada.
- En Mi terreno móvil, el contenido comienza muy por debajo del primer viewport por la navegación superior y la cabecera de bienvenida; no hay overflow horizontal. La reducción de esa cabecera no está implementada (UX-005).
- **No se probó en dispositivo móvil real:** las mediciones móviles son emulación de viewport (`390 × 844`) en Chromium headless.
- Los fondos y parcelas son ilustrativos; no son un levantamiento físico del terreno ni una representación médica o botánica validada.
- La apariencia de Mi Jardín y el responsive requieren revisión del responsable del producto. No se declara aprobación de Leonel ni cierre de la entrega.

## 9. Implementado, verificado y propuesto

La siguiente tabla separa lo que existe y se comprobó en la sesión local de lo que sigue siendo una recomendación. Ninguna fila de la columna «Propuesta» está implementada.

| Aspecto | Implementado / verificado localmente | Propuesta o recomendación | Estado |
|---|---|---|---|
| Separación React/Phaser | React compone HUD, formularios, guía, avisos y diálogos; Phaser pinta paisaje y parcelas. | Conservar la separación y los controles DOM accesibles. | Implementado. |
| Cámara | En `main`, composición fija (zoom histórico `0.75` escritorio, `0.203` móvil), sin paneo/zoom interactivo. La rama #74 añade zoom/paneo/pellizco y selector de parcela. | Acordar con el PM si se mantiene la cámara fija o se adopta la adaptable del PR #74 antes de fusionar. | `main` fijo; rama #74 adaptable, no fusionada. Decisión pendiente. |
| Seis parcelas | Las seis existen y están en cuadro en ambos; en `main` son pequeñas a `390 × 844`. La rama #74 añade selector y zoom. | Selector o vista general de parcelas; aumentar contraste o tamaño. | `main`: problema de legibilidad. Rama #74: selector/zoom implementado, no fusionado. |
| HUD móvil | La guía toca las acciones rápidas sin solaparse. El solapamiento histórico del aviso (~`18 px`) **no se reprodujo**. La rama #74 amplía menú a `48 × 48` y widget lunar a `132 × 44`. | Colapsar la guía y reducir la congestión del tercio inferior. | Sin solapamiento confirmado; congestión pendiente. |
| Áreas táctiles | Varios controles por debajo de 44 px en `main` y rama #74 (notificaciones, chips, filtros, campana) — UX-105. | Elevar a ≥44 px los controles listados. | Problema confirmado; no corregido en ninguno. |
| Mi terreno móvil | Sin overflow horizontal; contenido muy por debajo del primer viewport por navegación y cabecera — UX-005. | Reducir cabecera/navegación para acercar resumen y acciones. | Problema confirmado; propuesta no implementada. |
| Unión terreno-paisaje | Sin corte dominante confirmado a `1440 × 1000`. | Revisar otros anchos y alturas antes de modificar la escena. | No confirmado; pendiente. |
| Modalidades y regiones | Cuatro perfiles comparten escena y seis IDs; solo se recorrió Costa/En tierra. | Mantener una sola escena con perfiles y recursos por modalidad. | Implementado en código |
| Ruta `#mi-historia` | Renderiza «Mi camino verde» más la Bitácora Viva sin título propio — UX-108. | Definirla como sección propia o redirigirla a `#progreso`/`#bitacora`. | Confirmado; no corregido en ninguno. |
| Modo visitante | Guarda en el navegador; el calendario API devuelve 401 y el Pasaporte usa contenido alternativo. Conviven mensajes de «base de datos» y «solo en este navegador» (P0-001), confirmado también en sesión autenticada. | Hacer explícito si el dato es local o sincronizado; no mezclar ambos mensajes. | Implementado con mensaje contradictorio; no corregido. |
| Figma | Enlace de propuesta visual. | Usarlo como referencia, no como implementación validada. | Propuesta anterior |

## 10. Recomendaciones no implementadas

Las siguientes recomendaciones no forman parte del código revisado y no deben presentarse como cambios realizados. Se registran para revisión y para una futura iteración de UI/UX.

- **Mi Jardín móvil — superposición del mensaje de guardado:** la superposición de ~`18 px` descrita en la revisión histórica **no se reprodujo** en `main` ni en la rama #74 (medición de 0 px a `390 × 844`, autenticado y visitante). La recomendación de reservar una banda libre y respetar `safe-area` sigue siendo prudente, pero **no debe presentarse como corrección de un defecto confirmado**.
- **Parcelas en móvil:** las seis están en cuadro pero son pequeñas. La rama #74 añade zoom, paneo, pellizco y selector de parcela; queda verificar la precisión táctil en dispositivo real antes de fusionar.
- **HUD móvil:** colapsar la guía regional a un icono o panel desplegable, reubicar el contador de plantas y evitar que el tercio inferior concentre demasiados controles. La guía toca las acciones rápidas sin solaparse.
- **Etiquetas y áreas táctiles:** subir las etiquetas de acciones rápidas por encima de 10 px y llevar a ≥44 px los controles identificados en UX-105. La rama #74 ya corrige el menú (`48 × 48`) y el widget lunar (`132 × 44`); el resto sigue pendiente.
- **Mi terreno móvil:** reducir el peso de la cabecera de bienvenida y de la navegación superior para que el resumen y las acciones aparezcan antes del primer viewport (UX-005).
- **Ruta `#mi-historia`:** hoy renderiza «Mi camino verde» más la Bitácora Viva sin identidad propia (UX-108). Decidir con el PM si es sección propia o si se redirige.
- **Mensajes de persistencia:** unificar el mensaje según el destino real del dato y no mezclar «base de datos» con «guardado local» en la misma vista (P0-001, confirmado en sesión autenticada y en visitante).
- **Estado de éxito:** unificar el patrón de confirmación de guardado y hacer explícito si el dato es local o sincronizado.
- **Tipografía:** decidir si se mantiene la separación DM Sans/Outfit para producto y Trebuchet MS/Georgia para juego, o si se unifica con una escala común.
- **Contraste y foco:** realizar una auditoría de contraste de textos, botones y estados sobre fondos ilustrados; conservar el foco visible y probarlo con teclado.
- **Tokens regionales:** si se busca consistencia, definir variables de color por región en CSS en lugar de depender solo de recursos gráficos. No existe esa capa de tokens en el código revisado.
