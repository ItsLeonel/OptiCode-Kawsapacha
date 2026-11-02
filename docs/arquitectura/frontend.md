# Frontend de Kawsapacha

## Organización implementada

React 19, TypeScript y Vite 7 con CSS, sin dependencias adicionales. Se aplica una arquitectura por funcionalidades simplificada: el módulo nuevo de autenticación vive en `features/auth`. El resto del prototipo conserva su organización y comportamiento actuales.

```text
frontend/src/
  main.tsx
  App.tsx
  styles.css
  EcuadorMap.tsx
  assets/
    fondo-kawsapacha.png
  features/
    auth/
      AuthPage.tsx
      AuthForm.tsx
      AuthIcon.tsx
      PlantIllustration.tsx
      auth.ts
      auth.css
```

- `main.tsx`: monta React y carga los estilos globales.
- `App.tsx`: compone las pantallas, gestiona la navegación por estado y conserva los datos temporales de comunidades, huertos y plantas. Inicia en **Bienvenida**, que muestra `AuthPage`. **Descubrir Kawsapacha**, debajo del párrafo de presentación, abre el resumen de los módulos existentes en modo visitante; **Comunidad** abre directamente comunidades con el mismo acceso público. El encabezado y el aviso de los módulos identifican **Modo visitante · Sin sesión**. **Usuarios** o la identidad de la barra lateral permiten regresar a la bienvenida conservando los datos del prototipo. Las pantallas anteriores siguen en este archivo; su extracción queda fuera de este cambio.
- `EcuadorMap.tsx`: mapa provincial y selector alternativo existentes.
- `AuthPage.tsx`: bienvenida y autenticación, navegación real de la cabecera, acceso público, tarjetas educativas, recorrido Descubre → Siembra → Cultiva y progreso de la planta. Las pestañas permiten flechas, Inicio y Fin. En escritorio usa dos columnas; en tablet vertical y móvil muestra presentación, formulario y tarjetas, en ese orden. El callback existente `onExploreDemo` se reutiliza para el modo visitante: cambia la pantalla sin simular una sesión ni alterar credenciales.
- `AuthForm.tsx`: formulario compartido para registro e inicio de sesión, visibilidad independiente de contraseñas, errores asociados a campos, foco en el primer error, avisos de envío y estado de solicitud. Cambiar de pestaña o salir desmonta el formulario y descarta las credenciales de su estado React. No usa almacenamiento del navegador, registros de consola ni peticiones de red.
- `auth.ts`: tipos, campos de cada modo, validación pura y transformación de datos para la futura integración. El registro requiere nombre de al menos dos caracteres, correo válido, contraseña de al menos ocho caracteres con letra y número, y confirmación coincidente. El acceso solo comprueba correo y contraseña obligatorios; la verificación de credenciales corresponde al servidor.
- `AuthIcon.tsx` y `PlantIllustration.tsx`: iconos y planta SVG reutilizados dentro de autenticación. El encuadre de la semilla se acerca para hacerla reconocible; brote y planta muestran el crecimiento completo. La planta pasa de semilla a brote cuando existe un campo válido y a planta cuando todos son válidos; esto no indica autenticación exitosa. Las tres etapas permanecen visibles, la actual se resalta en lima y una barra más gruesa indica los campos válidos. El bloque ocupa unos 82–84 px de alto sin fijar la altura del formulario.
- `auth.css`: estilos limitados mediante clases `auth-*`, diseño adaptable y alternativa sin animación para `prefers-reduced-motion`. `styles.css` conserva el diseño global existente.

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
