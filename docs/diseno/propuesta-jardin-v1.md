# Propuesta visual de Mi Jardín V1

**Estado:** propuesta de documentación basada en la implementación observada; requiere revisión visual de Leonel. No introduce pantallas, recursos ni funcionalidades nuevas como requisito de UI-002.

## Dirección de arte

La escena observada usa un paisaje Costa, una superficie de cultivo continua, caminos/guías visuales y seis zonas de cultivo en una composición semiisométrica. El HUD, la guía regional, la navegación y los formularios se renderizan en React; el escenario interactivo se carga con Phaser. La combinación busca una lectura de huerto real representado en una escena de juego, sin hacer de la ilustración un plano físico ni una medición de capacidad.

La [captura Costa](./evidencias-diseno/04-jardin-costa.png) muestra la modalidad **En tierra**, seis zonas vacías y contexto territorial de Guayas. Es evidencia de la versión capturada, no aprobación del aspecto artístico.

## Reparto de responsabilidades visuales existente

| Capa | Responsabilidad observada |
|---|---|
| React | HUD y controles; navegación; acciones de planta/actividad; paneles de ayuda y terreno; formularios y diálogos; controles HTML accesibles que corresponden a las zonas. |
| Phaser | Paisaje y escena; composición de piezas; respuesta visual a selección y cámara; representación de los espacios a partir del modelo de terreno y registros. |
| Modelo del jardín | Región, tipo de terreno y características; seis posiciones estables (`garden-slot-0` a `garden-slot-5`); plantas y actividades documentadas. La posición es una ubicación visual, no una coordenada geográfica. |

La escena no debe crear plantas, estados de crecimiento, infraestructura o recompensas que no estén respaldados por registros y por la configuración del huerto. En las capturas de esta revisión las seis zonas están vacías, como corresponde al flujo de prueba.

## Regiones y modalidades

Las regiones que debe documentar la propuesta son Costa, Sierra, Amazonía/Oriente y Galápagos. Los estilos/recursos de referencia existen en el repositorio, pero en esta revisión solo se capturó en ejecución la escena **Costa**. No afirmar que las otras tres escenas están visualmente aprobadas o que fueron comprobadas en este recorrido.

| Modalidad | Estado que debe reflejar la documentación |
|---|---|
| En tierra | Perfil marcado como implementado en `layouts.ts`; capturado en Costa con seis espacios vacíos sobre el paisaje. |
| Macetas | Perfil marcado como implementado en `layouts.ts` con soporte de recipientes apoyados. Su escena en ejecución no se comprobó en esta revisión. |
| Vertical | Perfil marcado como implementado en `layouts.ts` con soporte de bastidor anclado. Su escena en ejecución no se comprobó en esta revisión. |
| Colgante | Perfil marcado como implementado en `layouts.ts` con soporte de pérgola. Su escena en ejecución no se comprobó en esta revisión. |

Los perfiles existentes indican soporte de código para las cuatro modalidades, pero en esta revisión solo se inspeccionó visualmente «En tierra» en Costa. Las cuatro regiones cuentan con referencias/assets en el repositorio, pero no se verificaron sus escenas en ejecución aquí. Las modalidades y regiones se componen a partir de los modelos y recursos existentes. **No se requiere generar 16 escenas finales** ni una colección nueva de recursos para UI-002.

## Interacciones y estados a representar

- **Zona vacía:** indica que se puede iniciar el registro de una planta; no muestra vegetación como si ya existiera.
- **Zona ocupada:** identifica la planta registrada y conduce a su Pasaporte Vivo.
- **Registro:** React presenta las entradas de foto, especie, posición y fecha disponible; señalar claramente si una imagen es una foto real del usuario o un recurso de prueba.
- **Pasaporte/Bitácora:** reflejan los registros disponibles; no confundir estados estimados con evidencia de cultivo.
- **Carga/error de escena:** no se capturó un estado funcional de carga o error dentro del producto. La falla local inicial se debió a la ausencia de Phaser en `node_modules` y no representa un estado de diseño. Un patrón visual para esos estados queda pendiente de especificación y aprobación; no se atribuye una alternativa de recuperación no verificada a la implementación actual.
- **Móvil:** validar HUD, escena, controles táctiles y modales en el dispositivo/viewport objetivo antes de declararlos revisados. La prueba inicial de 390 px cubrió bienvenida y comunidad, no el jardín.

## Observaciones para revisión del PM

1. En Costa, el globo de la guía regional se superpone al panel de estado inferior y compite con su lectura. Se propone revisar posición/tamaño del globo y separación del HUD antes de la demo (P1).
2. En la captura de escritorio no se aprecia un corte evidente entre el terreno y el paisaje del borde derecho; esa continuidad requiere validación adicional en móvil y otras regiones.
3. Las seis zonas se muestran vacías y tienen representación HTML/teclado; no se inspeccionó en esta pasada una parcela ocupada.
4. Los botones inferiores son legibles en la captura de escritorio; el jardín en móvil no se comprobó. Esta propuesta no declara las capturas actuales como diseño final.

## Reutilización y límites

Reutilizar [recursos regionales y visuales](./mi-jardin-recursos.md), [modelos y layouts Phaser](../../frontend/src/features/my-garden/phaser-poc/layouts.ts), [renderizador](../../frontend/src/features/my-garden/phaser-poc/PhaserGardenPoc.tsx) y [componentes React](../../frontend/src/features/my-garden/MyGardenPage.tsx). No sobrescribir código de Phaser ni añadir ilustraciones/escenas durante el cierre documental sin coordinación con Leonel.

No incluye implementar funcionalidades, modificar autenticación/roles/BD, reescribir pantallas, producir nuevos assets ni ejecutar pruebas formales. Santiago es responsable de la QA; Leonel aprueba decisiones visuales y cambios de frontend.
