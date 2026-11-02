# Frontend de Kawsapacha

## Organización implementada

React 19, TypeScript y Vite 7 con CSS, sin dependencias adicionales. Se aplica una arquitectura por funcionalidades simplificada: autenticación vive en `features/auth` y la experiencia principal en `features/my-garden`. Los formularios existentes de comunidad, huerto real, catálogo y registro de plantas mantienen su organización y comportamiento en `App.tsx`.

```text
frontend/src/
  main.tsx
  App.tsx
  styles.css
  EcuadorMap.tsx
  assets/
    fondo-kawsapacha.png
    jardin-andino-v1.png
    jardin-andino-v2.png
    cama-cultivo-v2.png
  features/
    auth/
      AuthPage.tsx
      AuthForm.tsx
      AuthIcon.tsx
      PlantIllustration.tsx
      auth.ts
      auth.css
    my-garden/
      MyGardenPage.tsx
      GardenNavigation.tsx
      GardenScene.tsx
      GreenChallenges.tsx
      GardenHistory.tsx
      PlantPassport.tsx
      GardenIcon.tsx
      garden.ts
      my-garden.css
```

- `main.tsx`: monta React y carga los estilos globales.
- `App.tsx`: compone las pantallas, gestiona la navegación por estado y conserva los datos temporales de comunidades, huertos y plantas. Inicia en **Bienvenida**, que muestra `AuthPage`. **Descubrir Kawsapacha** abre **Mi jardín** en modo visitante; **Comunidad** abre directamente su formulario. El acceso desde **Volver a bienvenida** conserva los registros de esta visita. El antiguo resumen administrativo se sustituye por el escenario interactivo. Los formularios anteriores permanecen en este archivo; el registro de plantas añade una asignación estable a una de las seis parcelas.
- `EcuadorMap.tsx`: mapa provincial y selector alternativo existentes.
- `AuthPage.tsx`: bienvenida y autenticación, navegación real de la cabecera, acceso público, tarjetas educativas, recorrido Descubre → Siembra → Cultiva y progreso de la planta. Las pestañas permiten flechas, Inicio y Fin. En escritorio usa dos columnas; en tablet vertical y móvil muestra presentación, formulario y tarjetas, en ese orden. El callback existente `onExploreDemo` se reutiliza para el modo visitante: cambia la pantalla sin simular una sesión ni alterar credenciales.
- `AuthForm.tsx`: formulario compartido para registro e inicio de sesión, visibilidad independiente de contraseñas, errores asociados a campos, foco en el primer error, avisos de envío y estado de solicitud. Cambiar de pestaña o salir desmonta el formulario y descarta las credenciales de su estado React. No usa almacenamiento del navegador, registros de consola ni peticiones de red.
- `auth.ts`: tipos, campos de cada modo, validación pura y transformación de datos para la futura integración. El registro requiere nombre de al menos dos caracteres, correo válido, contraseña de al menos ocho caracteres con letra y número, y confirmación coincidente. El acceso solo comprueba correo y contraseña obligatorios; la verificación de credenciales corresponde al servidor.
- `AuthIcon.tsx` y `PlantIllustration.tsx`: iconos y planta SVG reutilizados dentro de autenticación. El encuadre de la semilla se acerca para hacerla reconocible; brote y planta muestran el crecimiento completo. La planta pasa de semilla a brote cuando existe un campo válido y a planta cuando todos son válidos; esto no indica autenticación exitosa. Las tres etapas permanecen visibles, la actual se resalta en lima y una barra más gruesa indica los campos válidos. El bloque ocupa unos 82–84 px de alto sin fijar la altura del formulario.
- `auth.css`: estilos limitados mediante clases `auth-*`, diseño adaptable y alternativa sin animación para `prefers-reduced-motion`. `styles.css` conserva el diseño global existente.

## Mi Jardín V1

- `MyGardenPage.tsx`: composición inmersiva, bienvenida, contexto territorial procedente del huerto registrado y accesos reales a Registrar planta, Bitácora, Mi huerto real y Pasaporte Vivo. La demostración pública se identifica expresamente; no se inventa un usuario, clima ni ubicación.
- `GardenNavigation.tsx`: cuatro destinos principales, compartidos por el jardín y las pantallas existentes: **Mi jardín**, **Comunidad**, **Descubrir plantas** y **Mi historia**. Incluye acceso a la bienvenida y explicación de los grados previstos, sin asignar uno.
- `GardenScene.tsx`: seis botones de parcela con un sprite transparente de cama de tierra y madera, sombra de contacto y controles HTML sobre un paisaje independiente. Se operan con clic, Tab, Enter, Espacio, flechas, Inicio y Fin. Una parcela vacía abre el flujo de registro; una ocupada abre su Pasaporte Vivo. Las fotografías corresponden a registros de la visita, sin simular crecimiento.
- `GreenChallenges.tsx`: tres propuestas navegables de Retos verdes, sin marcarlos completados ni asignar Semillas de vida. La validación y las recompensas pertenecen al futuro backend.
- `GardenHistory.tsx`: Bitácora de cultivo con los eventos de registro realmente realizados durante la visita, sus fotos y fechas; acceso a cada Pasaporte Vivo. Mi camino verde explica Aprendiz → Oficial → Maestro como grados previstos sin asignación. No se inventan actividades de riego, evidencias verificadas ni hitos de crecimiento.
- `PlantPassport.tsx`: reutiliza los datos de la ficha existente (nombre, nombre científico, fotografía y fecha) y añade la parcela digital. Se presenta con un diálogo nativo, cierre con Escape, foco contenido y restauración al abrirlo desde una parcela. Se comparte entre jardín, bitácora y registro de plantas.
- `garden.ts`: tipo de registro de planta, cantidad de parcelas y contratos locales de navegación/acciones. `plot` es un índice visual, no una ubicación geográfica ni un contrato de API.
- `GardenIcon.tsx` y `my-garden.css`: iconografía local, composición responsive, capas del escenario, estados de foco y alternativa `prefers-reduced-motion`. No hay motor 3D ni dependencias añadidas.

Si aún no hay comunidad o huerto real, el flujo de registro ofrece un acceso a la configuración que falta. La parcela elegida se conserva al recorrer comunidad, huerto y catálogo. Una nueva planta ocupa esa parcela, o la primera disponible si no se eligió ninguna. No se sobreescriben parcelas ocupadas y se mantiene el límite de seis plantas. El huerto virtual anterior permanece accesible como flujo de registro; el huerto real conserva su mapa y selector de provincias.

Todo se conserva únicamente en memoria durante la visita. Autenticación, persistencia de fotos y registros, actividades de cuidado, autorización, validación de retos, Semillas de vida, grados e insignias requieren contratos y servicios acordados con Ronny. El frontend no establece cantidades, fórmulas ni endpoints. Los recursos visuales y el prompt están documentados en `docs/diseno/mi-jardin-recursos.md`.

## Agregar funcionalidades

Crear `features/<funcionalidad>/` al implementar un módulo real, con su pantalla, componentes y estilos necesarios. Importar la pantalla desde `App.tsx` y conectarla a la navegación. Extraer código compartido solo cuando exista reutilización real; no se han creado carpetas vacías ni capas de servicios, hooks o tipos independientes.

## Integración futura con Ronny

`AuthPage` recibe opcionalmente `onSubmit: AuthSubmitHandler` y lo pasa al formulario. Es un único punto de integración; no presupone rutas, tokens ni mecanismos de sesión. El manejador recibe una unión discriminada:

- Registro: `{ mode: 'register', name, email, password }`.
- Acceso: `{ mode: 'login', email, password }`.

La confirmación de contraseña no se envía. Nombre y correo se recortan; la contraseña se conserva exactamente como se escribió. El manejador debe devolver `Promise<{ message: string }>` con un mensaje de resultado confirmado por el servidor. Durante la solicitud se bloquea el envío duplicado y se deshabilitan los campos. Los errores de transporte muestran un aviso genérico.

Mientras `App.tsx` no proporciona ese manejador, un envío válido informa expresamente que la conexión está pendiente y que no se ha creado una cuenta ni iniciado sesión. No se simulan sesiones, OAuth, usuarios, tokens ni registros exitosos.

Antes de conectar la API deben acordarse contrato, errores por campo, política de contraseñas, tratamiento de datos, mecanismo de sesión y comportamiento posterior a un acceso confirmado. La validación frontend no sustituye la validación y autorización del servidor.

## Recursos visuales

La segunda iteración usa `docs/diseno/referencia-bienvenida.png` como referencia y `assets/fondo-kawsapacha.png` como fondo independiente. Se inspeccionaron ambos antes de modificar la interfaz. El fondo se encontró originalmente en `docs/diseno/fondo-kawsapacha.png` y se copió sin modificar a assets. Ninguna captura de la maqueta se importa en el frontend.

El paisaje incorpora los territorios y detalles culturales ecuatorianos; no se le superponen la antigua maceta ni el textil artificial. El SVG paisajístico provisional fue retirado. Una capa verde de contorno orgánico acompaña el título **Saberes ancestrales que siguen cultivando vida**; el panel mantiene su transparencia, pestañas y controles reales. Se amplían tipografía, campos, ayudas y botones. La planta animada permanece como indicador compacto del progreso del formulario.

El refinamiento posterior mantiene ese fondo y los formularios. Amplía la marca y su hoja y da menor peso a los enlaces. La cabecera ocupa aproximadamente 95–98 px en los escritorios comprobados. En móvil la navegación permanece visible en una segunda fila. El párrafo presenta el legado de nuestros saberes y precede al botón **Descubrir Kawsapacha**, acompañado de **Explora sin registrarte**. Se retira el acceso duplicado de la cabecera. El crecimiento conserva transiciones ligadas a la validación y la alternativa `prefers-reduced-motion`.

La cabecera, el bloque izquierdo y el formulario usan gradientes verde oscuro con mayor transparencia, desenfoque de fondo de 10 px y saturación suave. La opacidad se aplica al fondo, no a los textos ni controles. `--auth-glass-story` mantiene el mismo tratamiento del bloque izquierdo en escritorio y móvil; los campos usan una superficie más oscura para conservar legibilidad. **Vida** aumenta de tamaño, mantiene el verde lima y pasa a un bloque en línea junto a **que siguen cultivando**; en móvil se envuelve naturalmente cerca de esa línea, sin alinearse al extremo derecho del panel.

El fondo usa `background-size: cover`, conserva su proporción y tiene posiciones específicas para escritorio, tablet y móvil. En pantallas verticales se prioriza el centro del paisaje; el recorte lateral es inevitable con `cover`. El fondo se funde con un color verde al extenderse el contenido, sin estirarse con toda la altura del formulario. Los overlays garantizan superficies oscuras para el texto. Frente a la maqueta se conservan el cuarto campo de confirmación, etiquetas visibles, avisos de integración y el recorrido inferior de la primera iteración. La navegación **Tu camino** sustituye **Recursos** y apunta a ese recorrido; no se incluyen enlaces sin contenido ni OAuth pendiente de implementar.

### Distribución al 100 % de zoom

`auth.css` organiza cabecera, contenido y recorrido en tres filas Grid con `min-height: 100dvh`. La altura de la página sigue siendo natural: no se fija `height` ni se aplica escalado o zoom al contenido. Para mostrar más paisaje sin reducir los textos del formulario, se limita la cabecera a 1360 px, el bloque central a 1280 px y el panel a 580 px. El relleno vertical y los tamaños tipográficos se acotan según el espacio disponible. El contorno verde acompaña su contenido sin invadir la cabecera ni el pie.

Los campos mantienen 54 px de altura y texto de 16 px; los botones principales, al menos 50 px. Cuando el viewport tiene al menos 1100 px de ancho y hasta 950 px de alto, el formulario distribuye los campos en dos columnas para reducir su altura. En esa disposición se ajustan los espacios de iconos y campos para mostrar completos los placeholders, manteniendo el control de visibilidad de contraseña con al menos 44 px de ancho. En las demás dimensiones conserva la disposición vertical. Los errores y los avisos pueden ampliar la página y provocar desplazamiento vertical natural. El recorrido inferior ocupa 89 px en los escritorios comprobados y se apila en móvil. El fondo de escritorio se limita a `100dvh` para que una capa decorativa no añada scroll innecesario.

## Verificación

Desde `frontend/`: `npm run typecheck` y `npm run build` (en PowerShell restringido, usar `npm.cmd`). No hay script de pruebas automatizadas ni framework de pruebas instalado. La revisión manual debe cubrir bienvenida inicial, acceso visitante sin sesión, regreso a la bienvenida, conservación de módulos anteriores, errores de ambos modos, coincidencia y visibilidad de contraseñas, progreso, pestañas por teclado, envío pendiente, anchos de 320 px a escritorio al 100 % de zoom y reducción de movimiento.

En las iteraciones previas pasaron tipos, compilación y las comprobaciones de validación descritas. Durante la optimización al 100 %, el acceso interactivo siguió sin estar disponible, pero se completó la revisión visual mediante Chrome local headless, con perfil temporal, viewports exactos, escala de página 1, factor de píxel 1 y fuentes cargadas. Se inspeccionaron capturas de las cuatro resoluciones, incluida la página completa en los tamaños que requieren scroll.

| Viewport | Altura inicial del documento | Resultado |
| --- | ---: | --- |
| 1920 × 1080 | 1080 px | Composición completa sin scroll vertical ni horizontal. |
| 1440 × 900 | 900 px | Composición completa sin scroll vertical ni horizontal. |
| 1366 × 768 | 768 px | Composición completa sin scroll vertical ni horizontal. |
| 390 × 844 | 1825 px | Una columna con scroll vertical natural. Sin desbordamiento horizontal ni controles cortados. |

En los cuatro tamaños también se comprobó el envío vacío (cuatro errores, panel expandible sin solapar el pie), el cambio a inicio de sesión (dos campos), el acceso identificado como visitante sin sesión y que el ancho de cada placeholder cabe en su campo. La lógica de validación se mantiene intacta. Se repiten `typecheck` y `build`; la compilación requiere ejecución fuera del sandbox porque esbuild no puede leer directorios superiores. Las herramientas temporales de captura y medición se retiran del proyecto; no se incorporan dependencias ni un framework de pruebas.

### Verificación de Mi Jardín V1

Se inspeccionaron capturas reales con Chrome headless, perfil temporal, viewport exacto y escala 1. El escenario inicial cabe sin scroll vertical ni horizontal en 1920 × 1080, 1440 × 900 y 1366 × 768. En 390 × 844 el documento ocupa aproximadamente 1697 px de altura, con scroll vertical natural y sin desbordamiento horizontal. La bienvenida y autenticación se mantienen intactas.

Se completó un recorrido de prueba con teclado y clic: flechas entre parcelas, Enter en la parcela 6, creación de comunidad, selección de Pichincha en el mapa, registro de huerto, filtro del catálogo, carga de fotografía, asignación a la parcela elegida y apertura del Pasaporte Vivo. Se comprobó Escape y restauración del foco a la parcela, acceso desde la bitácora, conservación del huerto real, ocupación de las seis parcelas sin sobrescribir registros, bloqueo al alcanzar la capacidad y conservación de datos al regresar a la bienvenida y reingresar.

Los datos introducidos por QA solo existieron en ese navegador temporal y no se precargan en el producto. Se utilizó una imagen local para comprobar el mecanismo de carga; la prueba no valida identidad botánica ni crecimiento. Se retiró el guion de comprobación del proyecto. No hay un framework de pruebas instalado ni recompensas calculadas en el frontend.

### Refinamiento visual de Mi Jardín V2

Se mantiene el módulo y sus contratos. Solo cambia la presentación de `MyGardenPage.tsx`, las capas decorativas de `GardenScene.tsx` y `my-garden.css`, con dos recursos gráficos independientes. El paisaje tiene iluminación más cálida; las parcelas utilizan camas de tierra con madera, sin las antiguas transformaciones de tablón. Se refina la barra lateral con motivos textiles, acentos lima, el panel de Retos verdes y los cuatro accesos inferiores. No se modifican `App.tsx`, autenticación, comunidades ni backend durante este refinamiento.

Chrome local headless, con perfil temporal, fuentes y recursos cargados, viewport exacto, escala 1 y factor de píxel 1:

| Viewport | Altura del documento | Resultado V2 |
| --- | ---: | --- |
| 1920 × 1080 | 1080 px | Composición completa, sin scroll. |
| 1440 × 900 | 900 px | Composición completa, sin scroll. |
| 1366 × 768 | 768 px | Composición completa, sin scroll. |
| 390 × 844 | 1703 px | Dos columnas de parcelas y scroll vertical natural. |

Sin desbordamiento horizontal en las cuatro resoluciones. Se revisaron capturas y se repitió el flujo de comunidad, provincia, huerto, catálogo, fotografía y registro en la parcela elegida; apertura/cierre del Pasaporte Vivo con restauración del foco, bitácora, seis plazas, bloqueo de capacidad y conservación al volver a bienvenida. La escena inicia sin fotos; cada foto aparece únicamente tras un registro temporal. Se verificó `prefers-reduced-motion`. Los registros QA no se incorporan a la aplicación. La documentación de recursos conserva los prompts finales y las diferencias intencionales frente a la referencia.

Verificación final desde `frontend/`: `npm.cmd run typecheck` y `npm.cmd run build` completados sin errores. No existe script `test`; el recorrido de Chrome fue una comprobación temporal y su guion se retiró del repositorio.
