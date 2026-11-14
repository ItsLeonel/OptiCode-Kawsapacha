# Mi Jardín V1 — dirección visual y solución técnica

**Estado:** propuesta y descripción técnica para revisión de Leonel. No se declara aprobada ni implementada.

Este documento separa lo que aparece en el código actual de lo que queda sujeto a revisión. No describe una nueva escena ni autoriza cambios al motor o a los recursos.

## 5.1. Objetivo y dirección artística

Mi Jardín representa visualmente un huerto medicinal vinculado al territorio ecuatoriano mediante una escena ilustrada de aspecto 2.5D y una interfaz educativa. El paisaje aporta contexto; las plantas y características mostradas deben corresponder a datos registrados, no a crecimiento o ubicación inferidos de la ilustración.

**Implementado:** la aplicación combina escenarios, superficies de cultivo y elementos gráficos modulares con una interfaz de React. La ejecución local permitió cargar Mi Jardín en Costa/En tierra y registrar una planta; la captura disponible documenta Costa. No se certifica aquí la aprobación artística de esa escena ni de las demás regiones.

**Pendiente:** cualquier ajuste de dirección artística, equivalencia con referencias externas y aprobación del diseño debe revisarse con Leonel. La propuesta visual de Figma se conserva como propuesta y no se toma como implementación actual.

## 5.2. Arquitectura visual y técnica

| Capa | Responsabilidad respaldada por el código |
|---|---|
| React | `MyGardenPage` monta cabecera, HUD, navegación, mensajes, guía, panel de características, formularios y diálogos. Mantiene controles DOM para seleccionar zonas y activa el registro o la consulta de una planta. |
| Phaser 3 | `PhaserGardenPoc` crea la escena semiisométrica, carga recursos regionales/modulares, pinta el paisaje y recibe entradas de las zonas. `GardenSceneBridge` comunica comandos y eventos tipados con React. |
| Modelo compartido | El adaptador deriva el modelo visual de los datos existentes del huerto, plantas y actividades; la escena no debe inventar plantas ni atribuir al paisaje dimensiones físicas exactas. |
| Accesibilidad | Los botones DOM nombrados ofrecen alternativa a la interacción sobre el canvas. El canvas visual se marca como oculto para tecnologías de asistencia cuando la interfaz accesible está disponible. |

La documentación de implementación ubica formularios y HUD en React y paisaje/escena en Phaser. La cámara del código revisado usa una composición fija: `createGardenGame.ts` indica que comandos heredados de paneo/zoom no producen efecto y el movimiento del puntero solo diferencia clic de arrastre. En la sesión local el zoom fue `0.75` a `1440 × 1000` y `0.203` a `390 × 844`; no se observó paneo ni zoom interactivo. Hay documentos que describen cámara o zoom de otra forma; la capacidad final debe confirmarse antes de presentarla como interacción.

## 5.3. Regiones

La selección territorial mapea provincia a región mediante [garden-region.ts](../../frontend/src/features/real-gardens/garden-region.ts). El jardín carga un paisaje por región y el código define guías regionales. Hay recursos regionales en fondos compartidos, assets del juego y recursos del renderizador.

| Región | Identificación en el modelo | Recursos declarados | Evidencia V1 en esta entrega |
|---|---|---|---|
| Costa | `costa` | Paisaje regional, guía Costa y recursos específicos de terreno costero en el módulo Phaser. | Capturas de Mi Jardín Costa en escritorio y móvil. |
| Sierra | `sierra` | Paisaje y guía regionales; el modelo usa el mismo esquema de seis zonas. | No hay captura de Mi Jardín Sierra en las evidencias suministradas. |
| Amazonía u Oriente | `oriente` | Paisaje y guía regionales. | No hay captura de Mi Jardín Oriente en las evidencias suministradas. |
| Galápagos | `galapagos` | Paisaje y guía regionales. | No hay captura de Mi Jardín Galápagos en las evidencias suministradas. |

La disponibilidad de recursos y las ramas de carga en código no prueban que se hayan revisado visualmente las cuatro regiones. Por ello no se atribuyen aquí motivos gráficos concretos ni se afirma paridad visual para regiones sin captura. Los fondos declarados para el formulario de terreno y para el juego también pertenecen a rutas distintas; no deben confundirse con una misma imagen.

## 5.4. Modalidades de cultivo

Las cuatro modalidades se identifican en el modelo como `ground`, `pots`, `vertical` y `hanging`. Las seis posiciones se conservan al cambiar de modalidad o región; los recursos y anclajes visuales varían.

| Modalidad | Distribución visual implementada | Elementos y representación de parcelas | Acciones / pendientes |
|---|---|---|---|
| En tierra | El perfil de disposición usa posiciones de suelo; para Costa el código define una composición 3 × 2 y carga arte de parcelas costeras o relieve según los datos. | Seis zonas identificables; las características de suelo/distribución se derivan de opciones registradas. La geometría es ilustrativa, no un plano de capacidad. | Seleccionar una zona vacía inicia el registro; una zona ocupada permite abrir Pasaporte Vivo. La captura de Costa solo muestra el escenario, no todas las configuraciones de suelo. |
| Macetas | El perfil usa anclajes de recipientes y geometría de maceta. | Seis espacios estables; se carga el recurso modular de macetas. | Se mantienen las acciones comunes de registro/consulta. La captura móvil no basta para revisar la distribución completa de los seis recipientes. |
| Vertical | El código define tres estructuras y anclajes en dos niveles para las seis zonas. | Reutiliza bastidores/recipientes modulares y conserva los identificadores de zona. | Se mantienen las acciones comunes. No hay captura V1 vertical en el conjunto revisado. |
| Colgante | La geometría distribuye las zonas en grupos visuales 3 + 2 + 1; Costa dispone de anclajes específicos. | Usa recursos de pérgola y recipientes colgantes sin cambiar los seis identificadores. | Se mantienen las acciones comunes. No hay captura V1 colgante en el conjunto revisado. |

Las cuatro modalidades no son cuatro escenas independientes: comparten la misma escena, los seis identificadores y el modelo de datos; cambian el perfil de disposición, los anclajes y los recursos visuales. En todas, el dibujo escenográfico no reemplaza los botones y acciones de React. El código de [layouts.ts](../../frontend/src/features/my-garden/phaser-poc/layouts.ts) y [createGardenGame.ts](../../frontend/src/features/my-garden/phaser-poc/createGardenGame.ts) define perfiles, anclajes y carga de recursos; la comprobación visual disponible no cubre las cuatro modalidades.

## 5.5. Seis parcelas interactivas

Los identificadores estables son:

- `garden-slot-0`
- `garden-slot-1`
- `garden-slot-2`
- `garden-slot-3`
- `garden-slot-4`
- `garden-slot-5`

El código fija `PLOT_COUNT` en seis y conserva `plot` de `0` a `5` en el modelo visual. Los identificadores enlazan la zona pintada por Phaser con botones DOM accesibles; cambiar de región o modalidad modifica anclajes y recursos, no la identidad de las posiciones.

Una zona vacía comunica a React la intención de registrar una planta; una zona ocupada permite seleccionar la planta y abrir su Pasaporte Vivo. La distribución visual no constituye una medición del huerto físico. No se proponen 16 escenas ni recursos gráficos nuevos para esta entrega.

En la sesión local a `390 × 844`, las seis parcelas están dentro del encuadre, pero la zona táctil de `138 × 85` unidades del mundo queda en ~`28 × 17 px` y los centros se separan ~`60.4 × 32.6 px`. Las cuatro laterales son difíciles de distinguir. A `1440 × 1000` la composición es más legible. La propuesta de un selector o vista general de parcelas no está implementada.

## 5.6. Interacciones y elementos de interfaz

### Implementado en código

- El clic en una zona envía un evento al puente Phaser–React; React dirige a registro de planta o a consulta del Pasaporte según exista una planta asociada.
- La escena contiene HUD y accesos a Mi terreno y ayuda; React proporciona formularios, paneles de características, barra de acciones, Bitácora y navegación.
- La interfaz presenta región, modalidad, nombre del huerto y estado/progreso local cuando hay datos. Los avisos de carga y error tienen alternativas de estado y, si falla la escena, se habilita el grupo accesible de botones de zonas.
- Las seis zonas pueden enfocarse y recorrer mediante teclado; el manejo de teclas incluye flechas, Inicio y Fin. La activación se delega a botones HTML.
- El código diferencia clic de movimiento del puntero; la composición actual no implementa paneo/zoom aunque referencias de documentación anterior lo mencionan.
- La sesión local confirmó el registro de una planta y la apertura del Pasaporte desde una parcela; no se probó el recorrido completo de todas las zonas.

### Pendiente de comprobación o coordinación

- Se verificó el registro y el Pasaporte; no se verificaron la sincronización de foco entre canvas, botones y diálogos, el comportamiento táctil ni el cierre/restauración de foco en todos los flujos.
- No se ha demostrado con estas capturas el comportamiento de cada guía regional, modalidad y estado de parcela.
- Las acciones que dependen de autenticación, APIs o persistencia remota requieren probarse con los servicios disponibles; el estado visitante/local no demuestra sincronización. La API de calendario devuelve 401 en visitante y el Pasaporte usa contenido alternativo.
- La posición y separación del HUD, guía regional, avisos y barra de acciones en móvil se midió a `390 × 844`: el mensaje de guardado se superpone ~`18 px` con las acciones y la guía toca su borde superior. Falta revisar otros anchos, dispositivos y orientación horizontal.

## 5.7. Viabilidad y limitaciones

La separación React/Phaser es viable para conservar formularios y controles semánticos fuera del canvas mientras la escena se ocupa de paisaje y representación visual. Los identificadores estables facilitan conservar asociaciones entre zona y planta al cambiar la composición. El código actual ya define cuatro perfiles de modalidad, regiones, guías y selección de seis zonas; esta documentación no necesita crear escenas ni assets nuevos para describirlos.

Limitaciones registradas:

- La cámara de la escena revisada es fija; textos y documentos que indiquen paneo o zoom requieren reconciliación con Leonel.
- Las evidencias actuales cubren Costa y no permiten certificar Sierra, Amazonía/Oriente ni Galápagos, ni las cuatro modalidades en conjunto. La sesión local solo recorrió Costa/En tierra.
- En Mi Jardín móvil se confirmó un solapamiento de ~`18 px` entre el mensaje de guardado y las acciones rápidas; la guía toca el borde superior de las acciones. Las seis parcelas están en cuadro, pero son pequeñas. La corrección no está implementada.
- En Mi terreno móvil, el contenido comienza en y≈`1152` por la navegación superior (~`340 px`) y la cabecera de bienvenida (~`680 px`); no hay overflow horizontal. La reducción de esa cabecera no está implementada.
- No se verificó un corte del terreno con el paisaje derecho a `1440 × 1000`; la observación original queda pendiente de reproducción en otros tamaños.
- Solo se revisó la aplicación local; no hay URL pública ni se comprobó persistencia en SQLite, autenticación real o sincronización.
- Los fondos y parcelas son ilustrativos; no son un levantamiento físico del terreno ni una representación médica o botánica validada.
- La apariencia de Mi Jardín y el responsive requieren revisión del responsable del producto. No se declara aprobación de Leonel ni cierre de la entrega.

## 5.8. Implementado, verificado y propuesto

La siguiente tabla separa lo que existe y se comprobó en la sesión local de lo que sigue siendo una recomendación. Ninguna fila de la columna «Propuesta» está implementada.

| Aspecto | Implementado / verificado localmente | Propuesta o recomendación | Estado |
|---|---|---|---|
| Separación React/Phaser | React compone HUD, formularios, guía, avisos y diálogos; Phaser pinta paisaje y parcelas. | Conservar la separación y los controles DOM accesibles. | Implementado. |
| Cámara | Composición fija; zoom `0.75` en escritorio y `0.203` en móvil; sin paneo/zoom interactivo observado. | Mantener la cámara fija o acordar otro encuadre antes de modificar Phaser. | Implementado; decisión pendiente. |
| Seis parcelas | Las seis existen y están en cuadro; a `390 × 844` las zonas táctiles quedan en ~`28 × 17 px` y las laterales son difíciles de distinguir. | Selector o vista general de parcelas; aumentar contraste o tamaño. | Implementado con problema de legibilidad móvil; propuesta no implementada. |
| HUD móvil | Guía ~`89.7 × 134.5 px`; toca las acciones rápidas; mensaje de guardado superpuesto ~`18 px`. | Colapsar la guía, reubicar el aviso y reducir la congestión del tercio inferior. | Problema confirmado; propuesta no implementada. |
| Mi terreno móvil | Sin overflow horizontal; contenido desde y≈`1152` por navegación (~`340 px`) y cabecera (~`680 px`). | Reducir cabecera/navegación para acercar resumen y acciones. | Problema confirmado; propuesta no implementada. |
| Unión terreno-paisaje | Sin corte dominante confirmado a `1440 × 1000`. | Revisar otros anchos y alturas antes de modificar la escena. | No confirmado; pendiente. |
| Modalidades | Cuatro perfiles comparten escena y seis IDs; solo se recorrió Costa/En tierra. | Mantener una sola escena con perfiles y recursos por modalidad; no crear cuatro escenas independientes. | Implementado en código; no verificado visualmente en las cuatro. |
| Modo visitante | Guarda en el navegador; el calendario API devuelve 401 y el Pasaporte usa contenido alternativo. En Comunidad visitante se contradicen «base de datos» y «solo en este navegador» (P0-001). | Mantener explícito que el guardado es local y no sincronizado; retirar la referencia a base de datos en visitante. | Implementado con mensaje contradictorio; persistencia no verificada. |
| Figma | Enlace de propuesta visual. | Usarlo como referencia, no como implementación validada. | Acceso e interactividad no verificados. |
