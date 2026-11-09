# Diseño UI/UX — Plan de Dylan para la V1 (entrega 10/11/2026)

**Responsable:** Dylan Maldonado (`DylanIMM`) · **Issue:** [#3 UI-001](https://github.com/ItsLeonel/OptiCode-Kawsapacha/issues/3) · **Revisor:** Leonel (PM) · **Documentación:** Leonardo Lugmaña.

## 1. Objetivo y límites

Entregar **diseño y evidencia verificables** de la V1 de Kawsapacha para el informe `Proyecto-Version1-OptiCode.pdf` y la demostración presencial del **martes 10 de noviembre de 2026**.

La consigna académica exige, entre otros entregables, **arquitectura y diseño del producto, herramientas/tecnologías, código, casos de prueba con resultados y producto operativo**. **Dylan responde por la parte de diseño visual y UX** (no por el código, la base de datos ni la ejecución formal de pruebas). Debe aportar enlaces, pantallas, recursos y decisiones a **Leonardo**, que consolida el informe.

**Fuentes de trabajo:** definición del proyecto; lineamientos MSP realmente aportados en clase y aclaraciones del cliente; historias de usuario de Leonardo; [alcance de la V1](../analisis/alcance-v1.md); [implementación del jardín](../mi-jardin-vivo-implementacion.md); y el frontend actual en `main`. No atribuir a MSP recomendaciones botánicas, médicas ni criterios visuales inventados.

## 2. Estado del repositorio al 08/11/2026

- `main` contiene bienvenida/autenticación visual, Comunidad V3, formulario de huerto real, mapa territorial, catálogo y Mi Jardín con Phaser y componentes React. **No rediseñar ni reimplementar pantallas existentes sin acordarlo con Leonel.**
- La identidad ecuatoriana debe conservar la diferenciación regional **Costa, Sierra, Amazonía y Galápagos**.
- **Comunidad V3 y el estilo actual sirven como punto de partida**, no como aprobación final atribuible a Dylan. Verificar con el PM pantallas y ajustes pendientes.
- **Mi Jardín todavía está en revisión artística**: no declararlo aprobado o terminado en Figma. La experiencia busca un mundo de cultivo atractivo, continuo, tipo videojuego de agricultura 2.5D, con seis espacios de siembra, suelo creíble e interacción, adaptado a los **cuatro tipos**: en tierra, macetas, vertical y colgante. React mantiene controles; Phaser representa el escenario.
- La rama `design/3-ui-001-interfaz-uiux-y-huerto-virtual-v1` es histórica y **no está actualizada con el `main` actual**. No abrir PR desde ella sin sincronizar; no sobrescribir componentes actuales.
- El Issue #3 sigue abierto; no se verificó un PR de Dylan con diseños finales. **No se presupone que no haya trabajo externo en Figma**: si existe, enlazarlo.

## 3. Paso a paso: qué puede hacer Dylan ahora (08/11)

- [ ] **Paso 1. Revisar el flujo disponible**, ejecutando el `main` actual y comparándolo con la definición del proyecto y las HU de Leonardo. Recorrer bienvenida → comunidad → registro de huerto → entrada a jardín → planta/Pasaporte cuando aplique. Enumerar problemas reales de UX; no confundir funciones pendientes de backend con errores de diseño.
- [ ] **Paso 2. Publicar enlace Figma y acceso**, si el proyecto ya existe. Compartir enlace de archivo y prototipo de solo lectura. Si no hay Figma, crear un archivo de diseño básico con las pantallas representativas, manteniendo el estilo vigente.
- [ ] **Paso 3. Consolidar guía visual breve:** colores con valores, tipografía y escalas, iconografía, tarjetas, botones, campos, estados de foco/error/carga/vacío, espaciado y comportamiento responsive. Evitar reconstruir una design system extensa desde cero.
- [ ] **Paso 4. Documentar las pantallas existentes** con capturas **reales del producto actual** y mockups/Figma **claramente separados**. Cubrir: bienvenida/acceso, comunidad V3, registro/ficha de huerto real, navegación principal, catálogo y jardín. Etiquetar qué está *implementado*, *propuesto* o *pendiente*.
- [ ] **Paso 5. Revisar escritorio y móvil:** textos legibles, contraste razonable, navegación, jerarquía de acciones y errores de diseño. Registrar ajustes sugeridos con prioridad P0 (bloquea demo), P1 (importante), P2 (estético). Enviar a Leonel para implementación; Santiago ejecuta las pruebas formales.
- [ ] **Paso 6. Abrir propuesta del jardín** con 1 dirección artística principal y, si es necesario, una alternativa. Definir un escenario *interactivo e implementable*, evitando imágenes que simulen botones, plantas o parcelas no registradas. Especificar cómo conviven las cuatro modalidades y cuatro regiones con el mismo lenguaje visual.
- [ ] **Paso 7. Entregar a Leonardo** enlace a Figma, guía visual, capturas de pantallas reales, referencias visuales aprobadas e indicaciones de cómo citar el diseño y sus herramientas.

## 4. Qué depende del trabajo de Ronny

Ronny integra **hasta autenticación, comunidades y huertos reales**. Dylan **puede terminar la guía y los prototipos sin esperar** a ese backend.

- [ ] Cuando se integre Ronny, revisar los estados UX de **sesión real**, errores de credenciales, validación del servidor, permisos, carga y fallos de red.
- [ ] Comprobar visualmente que comunidad y huerto registrados conservan el diseño y que el usuario distingue **demo/visitante** de **sesión real**.
- [ ] Si integración aún no existe antes del 10/11, documentar los estados como **diseñados pero no implementados/verificados**, sin afirmar que se probaron.

**No pedir a Ronny integración del backend de plantas/Mi Jardín dentro de este corte de trabajo.**

## 5. Qué depende de la versión definitiva de Mi Jardín

- [ ] **Ahora:** aportar referencias y propuesta 2.5D, guía de assets y disposición de terreno continuo, caminos, huertos, casas/infraestructura coherentes con la región, seis espacios, cámara/zoom y HUD. Distinguir elementos funcionales de escenografía.
- [ ] Mostrar al menos ejemplos conceptuales de **tierra, macetas, vertical y colgante**; especificar adaptación por Costa/Sierra/Amazonía/Galápagos sin obligar a crear 16 imágenes finales.
- [ ] **Cuando Leonel apruebe el jardín:** ajustar capturas reales y prototipo a la versión final; entregar especificación de interacciones principales y estados (sin plantas, espacio ocupado, seleccionada, error, móvil).
- [ ] Si el jardín aún cambia el 10/11, incluir la propuesta conceptual y captura de lo implementado, señalando la diferencia. **No etiquetar mockups como producto ejecutándose.**

## 6. Entregables de Dylan para GitHub y el informe

Publicar en `docs/diseno/` o mediante PR:

| Archivo / recurso | Contenido esperado | Responsable |
|---|---|---|
| `PLAN-DYLAN-V1-10NOV.md` | Este plan y sus dependencias | PM (ya creado) |
| `entrega-ui-ux-v1.md` | Enlaces Figma/prototipo, inventario de pantallas, estado implementado/propuesto, decisiones y limitaciones | Dylan |
| `guia-visual-v1.md` | Paleta, tipografías, iconografía, componentes, estados y responsividad | Dylan |
| `propuesta-jardin-v1.md` | Dirección artística, cuatro modalidades, regiones, seis zonas, elementos/acciones y viabilidad Phaser | Dylan + revisión Leonel |
| `evidencias-diseno/` | Capturas reales de pantallas implementadas, diseños Figma exportados y comparativa claramente etiquetada | Dylan |
| Enlace Figma/prototipo | Acceso de lectura que funcione para Leonel y Leonardo | Dylan |

Los nombres anteriores son **propuesta de archivos por crear**, no entregables existentes. Acompañar cada recurso con fecha, responsable, procedencia/licencia cuando corresponda y aprobación de Leonel. No subir 20 copias de un mismo PNG, ZIPs antiguos ni imágenes enormes si basta con un enlace fiable. No compartir secretos, fotos privadas, datos de usuarios reales ni referencias de geolocalización sensible.

## 7. Entrega por fechas y criterios de cierre

**Domingo 08/11:** enlaces Figma y primer inventario, guía visual corta, propuesta principal de jardín y observaciones UX del producto disponible.

**Lunes 09/11:** resolver con Leonel ajustes visuales **críticos** de comunidad/huerto y actualizar capturas; revisar interfaces tras la conexión de backend si Ronny ya entregó; preparar presentación visual e insumos de Leonardo.

**Martes 10/11 (antes de clase):** última verificación visual sobre el commit de demo, entregar enlaces/capturas definitivos y documentar qué no está implementado o aprobado.

### Cierre de UI-001

- [ ] Enlace Figma/prototipo legible y accesible desde GitHub.
- [ ] Pantallas relevantes de V1 inventariadas con estatus real.
- [ ] Guía visual y recursos suficientes para explicar el diseño del producto.
- [ ] Propuesta implementable para Mi Jardín, diferenciada de la versión ya implementada.
- [ ] Evidencias y descripción entregadas a Leonardo.
- [ ] Revisión/aceptación del PM documentada; si hay pendientes, anotarlos en vez de declarar completado.

> Santiago es responsable de las **pruebas con resultados**; Dylan proporciona especificaciones y material visual. El PDF final lo consolida Leonardo y lo entrega Leonel. Cualquier modificación del alcance se acuerda con PM.