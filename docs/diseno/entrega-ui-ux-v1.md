# Entrega UI/UX V1 — inventario y evidencias

**Issue:** [UI-002 #32](https://github.com/ItsLeonel/OptiCode-Kawsapacha/issues/32)

**Responsable UI/UX:** Dylan Maldonado (`DylanIMM`) · **Revisor:** Leonel Morales · **Recibe documentación:** Leonardo Lugmaña
**Revisión inicial:** 08/11/2026 · **Commit revisado:** `de1c6c904503604a3e3ad7d8b4aaede0863fd4f1` (`main`)

## Alcance de esta entrega

Se revisó la aplicación que responde en `http://localhost:5173` con la API local en `http://localhost:3000`. La API respondió `status: ok` y `db: connected`. El navegador se usó en modo visitante, en una sesión aislada, con el flujo local de comunidad y terreno y datos ficticios. No se inició sesión, no se crearon cuentas en SQLite ni se incluyeron las credenciales de prueba del README en capturas.

Las capturas se tomaron con Microsoft Edge a 1440 × 1000 px. Las verificaciones móviles de esta revisión usaron 390 × 844 px. Los artefactos acreditan lo observado en ese entorno; no sustituyen la ejecución de QA de Santiago ni la aprobación visual del PM.

## Inventario visual

| Área del issue | Estado observado | Evidencia / código |
|---|---|---|
| Bienvenida y acceso | Pantalla y formulario de registro/login visibles y observados; se capturaron vacíos. El flujo de sesión real no se verificó en esta pasada. El acceso de visitante sí se usó. | [Captura 01](./evidencias-diseno/01-bienvenida-registro.png) · [AuthPage.tsx](../../frontend/src/features/auth/AuthPage.tsx) · [AuthForm.tsx](../../frontend/src/features/auth/AuthForm.tsx) |
| Comunidad | Implementada y observada como visitante con una comunidad ficticia local. Hay vista de comunidad, miembros/roles y tarjetas de contenidos. | [Captura 02](./evidencias-diseno/02-comunidad-v3.png) · [CommunitiesPage.tsx](../../frontend/src/features/communities/CommunitiesPage.tsx) |
| Mi terreno y provincia | Implementada y observada durante el registro, asociada a Guayas y a la comunidad local ficticia. | [Captura 03](./evidencias-diseno/03-terreno-guayas.png) · [RealGardenPage.tsx](../../frontend/src/features/real-gardens/RealGardenPage.tsx) · [EcuadorMap.tsx](../../frontend/src/EcuadorMap.tsx) |
| Catálogo medicinal | Implementado y observado en modo visitante; se presentaron ocho especies. No se capturó en la serie final de evidencias. | [App.tsx](../../frontend/src/App.tsx) · [datos del catálogo](../../frontend/src/features/real-gardens/data/README.md) |
| Mi Jardín — Costa | Escena Phaser iniciada y observada con modalidad «En tierra» y seis zonas vacías. La composición Costa se mantiene en revisión visual; la captura no equivale a aprobación artística. | [Captura 04](./evidencias-diseno/04-jardin-costa.png) · [PhaserGardenPoc.tsx](../../frontend/src/features/my-garden/phaser-poc/PhaserGardenPoc.tsx) |
| Registro de planta y Pasaporte Vivo | Flujo observado con imagen de prueba del repositorio y especie Manzanilla. | [Captura 05](./evidencias-diseno/05-registro-planta.png) · [Captura 06](./evidencias-diseno/06-pasaporte-vivo.png) · [PlantRegistrationModal.tsx](../../frontend/src/features/my-garden/PlantRegistrationModal.tsx) · [PlantPassport.tsx](../../frontend/src/features/my-garden/PlantPassport.tsx) |
| Bitácora de cultivo | Componentes y navegación presentes en el código; su flujo visual no se recorrió en esta captura. Marcar **no comprobada en esta pasada**, no como aprobada. | [GardenHistory.tsx](../../frontend/src/features/my-garden/GardenHistory.tsx) |
| Mi camino verde | Implementada y observada en modo visitante. Sus puntos y estados se presentan como locales. | [App.tsx](../../frontend/src/App.tsx) · [GardenProgress.tsx](../../frontend/src/features/my-garden/GardenProgress.tsx) |

### Evidencias

1. [Bienvenida y registro](./evidencias-diseno/01-bienvenida-registro.png)
2. [Comunidad V3 — datos ficticios](./evidencias-diseno/02-comunidad-v3.png)
3. [Registro del terreno en Guayas](./evidencias-diseno/03-terreno-guayas.png)
4. [Mi Jardín — Costa, seis zonas vacías](./evidencias-diseno/04-jardin-costa.png)
5. [Registro de planta — imagen de prueba](./evidencias-diseno/05-registro-planta.png)
6. [Pasaporte Vivo — registro de demostración](./evidencias-diseno/06-pasaporte-vivo.png)

Las pantallas 02–06 corresponden a una misma sesión aislada en modo visitante. La comunidad se llamó **Comunidad Demo**, el terreno **Huerto Demo** y la persona responsable **Responsable Demo**. La imagen del flujo de planta es un recurso de prueba existente, no una fotografía de un usuario ni una afirmación de cultivo real.

## Revisión UX priorizada

| Prioridad | Hallazgo observado | Evidencia | Acción propuesta / responsable |
|---|---|---|---|
| **P0 — confirmar antes de demo** | En la vista Comunidad, el encabezado indica «Modo visitante · Sin sesión» y el estado indica guardado en el navegador, pero el pie afirma «Datos guardados en la base de datos». Son mensajes contradictorios para el mismo flujo. | Captura 02 | Leonel debe decidir el texto correcto según visitante vs. sesión autenticada. No se modificó lógica ni interfaz en este trabajo. |
| **P1 — revisar con PM** | La Comunidad muestra tarjetas «Foro comunitario», «Aprender juntos» y «Eventos y mingas». El alcance V1 excluye foro y funciones extendidas; confirmar si esas tarjetas son únicamente informativas y si deben permanecer visibles en la demo. | Captura 02 · [alcance V1](../analisis/alcance-v1.md) | Leonel confirma visibilidad y rotulado; no convertir estas tarjetas en alcance nuevo. |
| **P1 — revisar visualmente** | En Costa, el globo de la guía regional se superpone al panel inferior de estado y compite con su texto. La unión del terreno con el paisaje del borde derecho no presenta un corte evidente en la captura de escritorio; ese resultado solo está comprobado en la composición capturada, no en otros tamaños o regiones. | Captura 04 | Revisar con Leonel la separación del globo y el panel. Mantener la unión terreno-paisaje observada y volver a comprobarla en móvil/regiones adicionales antes de darla por validada. No modificar Phaser sin coordinación. |
| **P1 — revisar en móvil** | En la captura de escritorio, los botones principales del HUD inferior son legibles y tienen presencia visual suficiente. El CSS de la escena establece 54 px de altura mínima para acciones rápidas en escritorio y 66 px en la regla móvil; los controles de Phaser tienen mínimo de 44 px. La composición móvil del jardín no se recorrió en esta revisión. | Captura 04 · [estilos Phaser](../../frontend/src/features/my-garden/phaser-poc/phaser-poc.css) | Verificar legibilidad, separación y área táctil en 390 × 844 px. No se propone cambiar el tamaño de los botones antes de esa comprobación. |
| **P1 — confirmar con QA** | En el Pasaporte de la captura, la fecha de registro figura como 9/11/2026 mientras la fecha de siembra elegida es 8/11/2026. La revisión se hizo la noche local del 8/11. Puede relacionarse con zona horaria o con el significado de «Registrada»; no se declara defecto confirmado desde diseño. | Captura 06 | Santiago verifica el caso y la zona horaria; Leonel decide el texto/visualización si se confirma. |
| **P2 — no bloqueante** | La interfaz global usa DM Sans/Outfit y la capa de juego usa Trebuchet MS o fuentes del sistema. La diferencia es perceptible entre pantallas; no se recomienda unificar tipografías a última hora sin aprobación. | [guía visual](./guia-visual-v1.md) | Registrar como decisión visual y diferir una unificación si no bloquea la lectura de la demo. |

## Responsive y accesibilidad básica

En 390 × 844 px, bienvenida, inicio visitante, Comunidad, selector de tipo y paso territorial no excedieron el ancho de la ventana (`document.documentElement.scrollWidth = innerWidth`). El mapa y el paso territorial se visualizaron en móvil. **No se recorrieron Mi Jardín, registro de planta ni Pasaporte en móvil en esta pasada**, por lo que su responsive permanece pendiente de revisión.

La implementación tiene focos visibles, controles semánticos y patrones de movimiento reducido en estilos relevantes. Esto es una revisión visual/estructural, no una auditoría de accesibilidad ni un resultado formal de QA.

## Figma y material para el informe

El archivo de [Figma: Kawsapacha V1 - UI-002 | Diseño y evidencias](https://www.figma.com/design/zlJVwU3qcyiiaRujNz8VwY/Kawsapacha-V1---UI-002-%7C-Dise%C3%B1o-y-evidencias) contiene únicamente las seis capturas auténticas de esta revisión, organizadas en la página «Pantallas observadas - capturas reales». El acceso está configurado como «Anyone can view».

El archivo es un tablero de evidencia, no un conjunto de mockups ni un prototipo interactivo: las imágenes son capturas del producto ejecutándose, no diseños realizados en Figma. No se crearon mockups para esta entrega. Las propuestas se describen por separado en la [guía visual](./guia-visual-v1.md) y la [propuesta del jardín](./propuesta-jardin-v1.md).

El material para consolidación del informe comprende las seis capturas, la guía visual, la propuesta del jardín y los hallazgos pendientes. La fecha, los datos de prueba, el navegador y el commit revisado constan al inicio de este documento.

## Decisiones de diseño documentadas para revisión

1. **Registrar el estilo implementado en lugar de atribuirle un origen no comprobado.** La guía resume colores y patrones encontrados en CSS; no se presenta como el documento que dirigió la implementación ni como un sistema aprobado. Esto evita convertir evidencia retrospectiva en una afirmación histórica.
2. **Mantener la separación React/Phaser y reutilizar las seis zonas existentes.** React conserva HUD, formularios y controles; Phaser representa la escena. La propuesta describe modalidades y adaptación regional sin sumar escenas o recursos que no estén confirmados ni inventar plantas registradas.
3. **Presentar Figma como evidencia, no como mockup.** El archivo contiene capturas reales del frontend y no prototipos ni pantallas rediseñadas. Esta distinción preserva la trazabilidad entre el producto observado y las propuestas pendientes de aprobación.

**UI-002 sigue abierto:** queda confirmar o escalar el hallazgo P0, revisar el jardín en móvil, entregar el paquete a Leonardo y obtener la revisión de Leonel. El tablero Figma se limita a capturas auténticas; no se afirma que exista un prototipo o mockup. Estas evidencias no equivalen a aprobación final ni a pruebas end-to-end.
