# Historias de usuario — Kawsapacha V1 (Mi Huerto Vivo)

**Proyecto:** Huertos Medicinales Comunitarios — ISWD652 Calidad de Software, 2026B · **Equipo:** OptiCode
**Responsable:** Leonardo Lugmaña (Analista) · **Revisor:** Leonel Morales (PM) · **Issue:** #2 ANA-001
**Versión del documento:** 1.1 — 08/11/2026 (actualizada tras la integración del backend, PR #30 y #31) · **Plantilla:** Historias de Usuario (aula virtual)

> **Fuentes:** definición del proyecto «Huertos Medicinales Comunitarios»; [lineamientos MSP 2017 aplicados](../analisis/lineamientos-msp-aplicados.md); [alcance V1](../analisis/alcance-v1.md); [arquitectura del backend](../arquitectura/backend.md) y [contratos de API](../arquitectura/contratos-api.md) de Ronny; [README del frontend](../../frontend/README.md); [informe de implementación](../mi-jardin-vivo-implementacion.md) y documentos de `docs/diseno/`.
>
> **Estimaciones:** las horas son una **estimación del analista**, pendiente de validar con Leonel (frontend) y Ronny (backend). No son horas registradas.
>
> **Estado V1** (fuera de la plantilla, solo para trazabilidad): 🟢 implementada según código y documentación del equipo (**pendiente de verificación por QA**) · ⚠️ parcial · ❌ no implementada. Ningún estado equivale a «prueba aprobada»; eso lo determina Santiago con evidencias.
>
> **Modo híbrido:** con sesión iniciada, los datos se guardan en el servidor (SQLite); en modo visitante se conservan en el navegador (IndexedDB).

## Actores

| Actor | Descripción |
|---|---|
| Visitante | Persona sin cuenta que explora Kawsapacha; sus registros se guardan solo en su navegador. |
| Participante | Integrante con cuenta que pertenece a una comunidad; registra plantas, actividades y cosechas. |
| Responsable de comunidad | Integrante que crea y actualiza la comunidad, invita integrantes, asigna roles y registra el huerto real. |
| Cuidador | Rol intermedio presente en el modelo de datos con permisos sobre el almacén. Pendiente de confirmar (D-11). |
| Moderador / Administrador MSP | Previsto en la definición (foro, ranking). **Fuera del alcance V1.** |

## Backlog priorizado

| Nro | Título | Módulo | Prioridad | Estimación | Estado V1 |
|---|---|---|---|---:|---|
| HU-001 | Registrar una cuenta | Usuarios | Alta | 15 h | 🟢 |
| HU-002 | Iniciar sesión | Usuarios | Alta | 11 h | 🟢 |
| HU-003 | Cerrar sesión | Usuarios | Media | 5 h | 🟢 |
| HU-004 | Explorar Kawsapacha como visitante | Usuarios | Media | 7 h | 🟢 |
| HU-005 | Registrar una comunidad de siembra | Comunidades | Alta | 13 h | 🟢 |
| HU-006 | Actualizar la comunidad | Comunidades | Alta | 7 h | 🟢 |
| HU-007 | Invitar integrantes y gestionar sus roles | Comunidades | Alta | 14 h | ⚠️ Invitación y roles sí; datos personales del integrante no se guardan en el servidor |
| HU-008 | Registrar el huerto real eligiendo la provincia en el mapa | Huertos reales | Alta | 13 h | 🟢 |
| HU-009 | Detallar la ubicación del huerto | Huertos reales | Media | 13 h | 🟢 |
| HU-010 | Registrar las características del huerto | Huertos reales | Alta | 12 h | ⚠️ Faltan suelos gredoso y pantanoso (MSP) |
| HU-011 | Actualizar el huerto real | Huertos reales | Alta | 6 h | 🟢 |
| HU-012 | Consultar el catálogo de plantas medicinales | Catálogo | Alta | 9 h | 🟢 8 especies con búsqueda |
| HU-013 | Consultar la ficha botánica de una especie | Catálogo | Media | 15 h | ⚠️ Descripción, usos, preparación y contraindicaciones; sin fotos ni fuentes |
| HU-014 | Visualizar mi huerto virtual | Huerto virtual | Alta | 24 h | 🟢 |
| HU-015 | Registrar una planta con fotografía real | Huerto virtual | Alta | 12 h | 🟢 |
| HU-016 | Consultar y actualizar el Pasaporte Vivo | Huerto virtual | Alta | 12 h | 🟢 |
| HU-017 | Registrar actividades de cultivo | Huerto virtual | Media | 13 h | 🟢 |
| HU-018 | Consultar mi progreso (Mi camino verde) | Huerto virtual | Media | 12 h | ⚠️ Cálculo local en el navegador |
| HU-019 | Conservar mis registros | Transversal | Alta | 11 h | 🟢 Servidor con sesión · navegador como visitante |
| HU-020 | Responder invitaciones a una comunidad | Comunidades | Media | 8 h | 🟢 |
| HU-021 | Gestionar el almacén comunitario (bodega) | Comunidades | Baja | 12 h | 🟢 |
| HU-022 | Registrar la cosecha de una planta | Huerto virtual | Media | 10 h | 🟢 |
| HU-023 | Consultar el calendario de siembra de una especie | Catálogo | Baja | 7 h | 🟢 |
| | **Total** | | | **271 h** | |

> HU-020 a HU-023 se añadieron al incorporar el backend integrado (PR #30). Amplían el alcance inicial de cinco módulos con funciones de la definición del proyecto (bodega, calendario lunar, cosecha); el PM debe confirmarlas como parte de la V1 (D-12).

---

## Módulo 1 — Usuarios

| **Nro:** HU-001 | **Título:** Registrar una cuenta | **Prioridad:** Alta<br>**Estimación:** 15 horas |
|---|---|---|

**Historia de usuario:**

**Como** visitante **quiero** crear una cuenta con mi nombre, correo y contraseña, **para** guardar la información de mi comunidad y de mi huerto de forma personal.

**Sabré que he terminado cuando se cumplan todos los criterios de aceptación:**

1. **Registro exitoso:** **Dado** que estoy en la pestaña «Crear cuenta» de la bienvenida, **cuando** ingreso un nombre de al menos 2 caracteres, un correo válido, una contraseña de al menos 8 caracteres con letras y números, la misma contraseña en la confirmación, y envío el formulario, **entonces** el sistema crea la cuenta y muestra un mensaje de confirmación emitido por el servidor.
2. **Datos incompletos o inválidos:** **Dado** que estoy en el formulario de registro, **cuando** envío con campos vacíos o que no cumplen las reglas, **entonces** se muestra un error junto a cada campo afectado, el foco pasa al primer error y no se envía la solicitud.
3. **Contraseñas distintas:** **Dado** que escribí una confirmación diferente de la contraseña, **cuando** envío el formulario, **entonces** se indica que las contraseñas no coinciden y no se crea la cuenta.
4. **Correo ya registrado:** **Dado** que el correo ya pertenece a una cuenta, **cuando** envío el registro, **entonces** el sistema informa que el correo ya está registrado y no crea una cuenta duplicada.
5. **Servicio no disponible:** **Dado** que el servidor no responde, **cuando** envío el formulario, **entonces** se muestra un aviso genérico de error, se evita el envío duplicado y no se afirma que la cuenta fue creada.

**Tareas de implementación:**

1. Diseñar la pantalla de bienvenida y el formulario de registro (2 horas).
2. Codificar el formulario y sus validaciones del lado del cliente (3 horas).
3. Codificar el servicio de registro y la persistencia de cuentas en el backend (5 horas).
4. Integrar el formulario con la API y manejar los errores por campo (3 horas).
5. Probar con datos válidos, inválidos y correo duplicado (2 horas).

> *Estado V1:* 🟢 `POST /api/auth/register` aplica las mismas reglas en el servidor, guarda la contraseña con bcrypt y responde `409 EMAIL_IN_USE` si el correo existe. Casos sugeridos: P-002, P-010.

---

| **Nro:** HU-002 | **Título:** Iniciar sesión | **Prioridad:** Alta<br>**Estimación:** 11 horas |
|---|---|---|

**Historia de usuario:**

**Como** integrante registrado **quiero** iniciar sesión con mi correo y contraseña, **para** acceder a mi comunidad, mi huerto y mis registros.

**Sabré que he terminado cuando se cumplan todos los criterios de aceptación:**

1. **Acceso exitoso:** **Dado** que tengo una cuenta, **cuando** ingreso mi correo y contraseña correctos, **entonces** el sistema inicia la sesión y me lleva a Mi Huerto con mis datos.
2. **Campos vacíos:** **Dado** que estoy en la pestaña «Iniciar sesión», **cuando** envío sin correo o sin contraseña, **entonces** se muestra el error en el campo correspondiente y no se envía la solicitud.
3. **Credenciales incorrectas:** **Dado** que ingreso un correo o una contraseña incorrectos, **cuando** envío, **entonces** se muestra un mensaje genérico de credenciales no válidas, sin indicar cuál de los dos falló, y no se inicia sesión.
4. **Envío duplicado:** **Dado** que la solicitud está en curso, **cuando** intento enviar de nuevo, **entonces** el botón y los campos permanecen deshabilitados hasta recibir la respuesta.

**Tareas de implementación:**

1. Diseñar el formulario de inicio de sesión (1 hora).
2. Codificar el formulario y sus validaciones (2 horas).
3. Codificar la autenticación y el manejo de sesión en el backend (4 horas).
4. Integrar el inicio de sesión con la navegación a Mi Huerto (2 horas).
5. Probar accesos correctos, incorrectos y repetidos (2 horas).

> *Estado V1:* 🟢 `POST /api/auth/login` devuelve un token JWT (vigencia configurable, 7 días por defecto) y el mensaje genérico «Correo o contraseña incorrectos» (`401`). Casos sugeridos: P-002, P-010, P-011.

---

| **Nro:** HU-003 | **Título:** Cerrar sesión | **Prioridad:** Media<br>**Estimación:** 5 horas |
|---|---|---|

**Historia de usuario:**

**Como** integrante con sesión iniciada **quiero** cerrar mi sesión, **para** que otra persona que use el mismo dispositivo no acceda a mis datos.

**Sabré que he terminado cuando se cumplan todos los criterios de aceptación:**

1. **Cierre exitoso:** **Dado** que tengo una sesión iniciada, **cuando** selecciono «Cerrar sesión», **entonces** el sistema termina la sesión y muestra la bienvenida.
2. **Datos conservados:** **Dado** que cerré sesión, **cuando** vuelvo a iniciarla con la misma cuenta, **entonces** veo mi comunidad, mi huerto y mis plantas tal como los dejé.
3. **Acceso tras el cierre:** **Dado** que cerré sesión, **cuando** intento regresar con el botón «Atrás» del navegador, **entonces** no se muestran datos privados de la cuenta.

**Tareas de implementación:**

1. Diseñar la opción de cierre de sesión en la navegación (1 hora).
2. Codificar el cierre de sesión y la limpieza del estado en el frontend (2 horas).
3. Invalidar la sesión en el backend (1 hora).
4. Probar cierre, reingreso y regreso con el navegador (1 hora).

> *Estado V1:* 🟢 El cierre de sesión descarta el token en el frontend. Al ser JWT sin estado, el servidor no invalida el token antes de su vencimiento (tarea 3 queda como mejora). Casos sugeridos: P-010, P-013.

---

| **Nro:** HU-004 | **Título:** Explorar Kawsapacha como visitante | **Prioridad:** Media<br>**Estimación:** 7 horas |
|---|---|---|

**Historia de usuario:**

**Como** visitante **quiero** explorar la aplicación sin registrarme, **para** conocer su propuesta antes de crear una cuenta.

**Sabré que he terminado cuando se cumplan todos los criterios de aceptación:**

1. **Acceso de visitante:** **Dado** que estoy en la bienvenida, **cuando** pulso «Descubrir Kawsapacha», **entonces** se abre Mi Huerto identificado como modo visitante, sin iniciar una sesión.
2. **Regreso a la bienvenida:** **Dado** que estoy explorando como visitante, **cuando** vuelvo a la bienvenida y entro de nuevo, **entonces** se conservan los registros realizados en ese navegador.
3. **Sin datos ficticios:** **Dado** que estoy en modo visitante, **cuando** recorro las pantallas, **entonces** no se presentan usuarios, plantas ni actividades de ejemplo como si fueran datos reales de una cuenta.

**Tareas de implementación:**

1. Diseñar la pantalla de bienvenida y el acceso público (3 horas).
2. Codificar el acceso en modo visitante (2 horas).
3. Identificar visualmente el modo visitante (1 hora).
4. Probar el recorrido de visitante (1 hora).

> *Estado V1:* 🟢 En modo visitante los datos se guardan solo en IndexedDB del navegador. Caso sugerido: P-001.

---

## Módulo 2 — Comunidades

| **Nro:** HU-005 | **Título:** Registrar una comunidad de siembra | **Prioridad:** Alta<br>**Estimación:** 13 horas |
|---|---|---|

**Historia de usuario:**

**Como** responsable de una comunidad de siembra **quiero** registrar mi comunidad indicando su tipo, nombre, responsable y contacto, **para** participar en Kawsapacha con mi huerto.

**Sabré que he terminado cuando se cumplan todos los criterios de aceptación:**

1. **Registro exitoso:** **Dado** que estoy en el formulario de comunidad, **cuando** elijo el tipo (personal, familiar, condominio o barrial), completo nombre, responsable, ubicación y contacto, y guardo, **entonces** la comunidad queda registrada y se muestra su información.
2. **Campos obligatorios vacíos:** **Dado** que dejé vacío un campo obligatorio, **cuando** intento guardar, **entonces** se señala el campo con un mensaje claro y la comunidad no se guarda.
3. **Contacto inválido:** **Dado** que escribí un correo o teléfono de contacto con formato incorrecto, **cuando** intento guardar, **entonces** se indica el error de formato y no se guarda.
4. **Fallo al guardar:** **Dado** que ocurre un error de almacenamiento, **cuando** guardo, **entonces** se muestra un aviso y no se pierde la información registrada previamente.

**Tareas de implementación:**

1. Diseñar el formulario de comunidad (2 horas).
2. Codificar el formulario con tipo, nombre, responsable, ubicación, descripción y contacto (4 horas).
3. Incluir validaciones de campos obligatorios y de formato de contacto (2 horas).
4. Codificar la persistencia local y el servicio de comunidades en el backend (3 horas).
5. Probar el registro con datos válidos e inválidos (2 horas).

> *Estado V1:* 🟢 `POST /api/communities` guarda nombre, responsable, ubicación, descripción y tipo; quien la crea queda como Responsable. Validaciones exactas de contacto por confirmar con Leonel (D-06). Caso sugerido: P-003.

---

| **Nro:** HU-006 | **Título:** Actualizar la comunidad | **Prioridad:** Alta<br>**Estimación:** 7 horas |
|---|---|---|

**Historia de usuario:**

**Como** responsable de comunidad **quiero** editar la información de mi comunidad, **para** mantener actualizados sus datos y su contacto.

**Sabré que he terminado cuando se cumplan todos los criterios de aceptación:**

1. **Edición exitosa:** **Dado** que tengo una comunidad registrada, **cuando** modifico sus datos y guardo, **entonces** se muestran los nuevos datos y se conservan al recargar la página.
2. **Cancelar edición:** **Dado** que estoy editando la comunidad, **cuando** cancelo, **entonces** se descartan los cambios y se mantienen los últimos datos guardados.
3. **Datos inválidos:** **Dado** que borré un campo obligatorio, **cuando** intento guardar, **entonces** se muestra el error y no se reemplazan los datos guardados.
4. **Sin permiso:** **Dado** que soy Participante y no Responsable, **cuando** intento editar la comunidad, **entonces** el sistema rechaza el cambio.

**Tareas de implementación:**

1. Diseñar la vista de edición (1 hora).
2. Codificar la edición y la cancelación (2 horas).
3. Incluir validaciones y control de rol (1 hora).
4. Codificar la actualización en el almacenamiento y en el backend (2 horas).
5. Probar edición, cancelación, recarga y permisos (1 hora).

> *Estado V1:* 🟢 `PUT /api/communities/:id` exige rol Responsable. Casos sugeridos: P-004, P-011.

---

| **Nro:** HU-007 | **Título:** Invitar integrantes y gestionar sus roles | **Prioridad:** Alta<br>**Estimación:** 14 horas |
|---|---|---|

**Historia de usuario:**

**Como** responsable de comunidad **quiero** invitar a otras personas registradas por su correo, asignarles un rol y registrar su información (fecha de nacimiento, género, talentos certificados y nivel de experiencia), **para** organizar quiénes participan en el huerto y qué puede hacer cada uno.

**Sabré que he terminado cuando se cumplan todos los criterios de aceptación:**

1. **Invitación exitosa:** **Dado** que soy Responsable de la comunidad, **cuando** invito a una persona registrada indicando su correo y su rol, **entonces** se crea una invitación pendiente y la persona la recibe en sus notificaciones.
2. **Correo no registrado:** **Dado** que el correo no pertenece a ninguna cuenta, **cuando** envío la invitación, **entonces** se muestra «No existe ningún usuario registrado con el correo ingresado» y no se crea la invitación.
3. **Integrante repetido:** **Dado** que la persona ya es miembro activo, **cuando** la invito, **entonces** se informa que ya pertenece a la comunidad.
4. **Sin permiso:** **Dado** que soy Participante, **cuando** intento invitar, cambiar un rol o quitar a un integrante, **entonces** el sistema rechaza la acción.
5. **Cambiar rol o quitar:** **Dado** que soy Responsable, **cuando** cambio el rol de un integrante o lo quito, **entonces** la lista de integrantes refleja el cambio.
6. **Datos del integrante:** **Dado** que registro la información personal de un integrante, **cuando** guardo, **entonces** se conservan su fecha de nacimiento, género, talentos certificados y nivel (Aprendiz, Oficial o Maestro).

**Tareas de implementación:**

1. Diseñar el panel de integrantes y el formulario de invitación (2 horas).
2. Codificar el servicio de invitaciones y la búsqueda de usuarios por correo (4 horas).
3. Codificar el cambio de rol y la eliminación con control de permisos (3 horas).
4. Codificar el registro de datos personales del integrante (2 horas).
5. Incluir validaciones de correo, duplicados y rol (1 hora).
6. Probar invitaciones, permisos y cambios de rol (2 horas).

> *Estado V1:* ⚠️ Criterios 1–5 implementados (`POST /api/communities/:id/members/invite`, `PATCH …/:userId/role`, `DELETE …/:userId`, solo Responsable). **Criterio 6 parcial:** la interfaz tiene esos campos, pero el modelo `CommunityMember` del servidor no los guarda (D-05). La certificación de talentos y el ascenso de nivel quedan para incrementos posteriores (C-03). Casos sugeridos: P-003, P-011.

---

## Módulo 3 — Huertos reales

| **Nro:** HU-008 | **Título:** Registrar el huerto real eligiendo la provincia en el mapa | **Prioridad:** Alta<br>**Estimación:** 13 horas |
|---|---|---|

**Historia de usuario:**

**Como** responsable de comunidad **quiero** registrar mi huerto real seleccionando su provincia en un mapa interactivo del Ecuador, **para** ubicarlo de forma sencilla y visual.

**Sabré que he terminado cuando se cumplan todos los criterios de aceptación:**

1. **Selección en el mapa:** **Dado** que estoy en el registro del huerto, **cuando** selecciono una provincia en el mapa con clic, toque, Enter o Espacio, **entonces** la provincia queda seleccionada y el fondo cambia a su región (Costa, Sierra, Amazonía o Galápagos).
2. **Selector alternativo:** **Dado** que no puedo o no quiero usar el mapa, **cuando** elijo la provincia en el selector de lista, **entonces** el mapa se sincroniza con esa elección.
3. **Provincia obligatoria:** **Dado** que no seleccioné provincia, **cuando** intento guardar el huerto, **entonces** se muestra un error y el huerto no se guarda.
4. **Fallo del mapa:** **Dado** que el mapa no carga, **cuando** abro el registro, **entonces** puedo seleccionar la provincia con el selector de lista y continuar.

**Tareas de implementación:**

1. Diseñar la pantalla de registro con mapa (3 horas).
2. Codificar el mapa provincial interactivo con GeoJSON (5 horas).
3. Codificar el selector alternativo accesible (2 horas).
4. Incluir la validación de provincia obligatoria (1 hora).
5. Probar el mapa con ratón, toque y teclado (2 horas).

> *Estado V1:* 🟢 Las 24 provincias. Con sesión, el huerto se guarda con `POST /api/gardens` (provincia y código oficial). Caso sugerido: P-005.

---

| **Nro:** HU-009 | **Título:** Detallar la ubicación del huerto | **Prioridad:** Media<br>**Estimación:** 13 horas |
|---|---|---|

**Historia de usuario:**

**Como** responsable de comunidad **quiero** indicar el cantón, la parroquia y, si lo deseo, el punto exacto del huerto, **para** registrar su georreferenciación.

**Sabré que he terminado cuando se cumplan todos los criterios de aceptación:**

1. **Cantón y parroquia:** **Dado** que elegí una provincia, **cuando** busco y selecciono un cantón y luego una parroquia, **entonces** solo se ofrecen los que pertenecen a la selección anterior, según el catálogo oficial INEC DPA 2026.
2. **Cambio de provincia:** **Dado** que ya había elegido cantón, parroquia o punto exacto, **cuando** cambio la provincia, **entonces** se limpian esos datos para no conservar una ubicación incorrecta.
3. **Punto exacto:** **Dado** que abrí el mapa detallado, **cuando** marco un punto y confirmo, **entonces** las coordenadas se agregan al registro; si cancelo, no se guarda ningún cambio.
4. **Mapa detallado no disponible:** **Dado** que no cargan las teselas del mapa detallado, **cuando** lo abro, **entonces** se muestra un aviso y puedo cancelar u omitir la ubicación exacta.

**Tareas de implementación:**

1. Diseñar los campos de ubicación detallada (1 hora).
2. Integrar el catálogo territorial oficial INEC DPA 2026 (3 horas).
3. Codificar los selectores dependientes con búsqueda (3 horas).
4. Codificar el mapa detallado con marcador arrastrable (4 horas).
5. Probar selección, cambios y fallos de carga (2 horas).

> *Estado V1:* 🟢 El servidor guarda cantón, parroquia, códigos INEC, referencia y coordenadas opcionales. La aplicación nunca solicita la ubicación del dispositivo. Caso sugerido: P-005.

---

| **Nro:** HU-010 | **Título:** Registrar las características del huerto | **Prioridad:** Alta<br>**Estimación:** 12 horas |
|---|---|---|

**Historia de usuario:**

**Como** responsable de comunidad **quiero** registrar el nombre, el tipo de huerto, la superficie y sus características (suelo, agua, riego, cerca y abono), **para** que el huerto virtual represente mi huerto real.

**Sabré que he terminado cuando se cumplan todos los criterios de aceptación:**

1. **Registro exitoso:** **Dado** que elegí la provincia, **cuando** completo nombre, modalidad (En tierra, Macetas, Vertical o Colgante), superficie y características, y guardo, **entonces** se muestra la ficha «Mi huerto registrado» con los datos ingresados.
2. **Suelo según modalidad:** **Dado** que elegí una modalidad distinta de «En tierra», **cuando** completo el formulario, **entonces** no se solicita el tipo de suelo.
3. **Datos inválidos:** **Dado** que dejé vacío un campo obligatorio o ingresé una superficie no válida, **cuando** intento guardar, **entonces** se muestran los errores (abriendo «Más características» si el error está ahí) y no se guarda.
4. **Sin datos inventados:** **Dado** que guardé el huerto, **cuando** abro el huerto virtual, **entonces** solo aparecen las instalaciones declaradas (cerca, agua, riego, abono).
5. **Tipos de suelo según MSP:** **Dado** que elegí la modalidad «En tierra», **cuando** selecciono el tipo de suelo, **entonces** puedo elegir entre arcilloso, limoso, arenoso, margoso, gredoso y pantanoso (MSP 2017, Tabla 1).

**Tareas de implementación:**

1. Diseñar el formulario de características (2 horas).
2. Codificar los campos de modalidad, superficie, suelo, agua, riego, cerca y abono (4 horas).
3. Incluir validaciones (2 horas).
4. Codificar la persistencia local y el servicio de huertos en el backend (2 horas).
5. Probar combinaciones válidas e inválidas (2 horas).

> *Estado V1:* ⚠️ Criterios 1–4 implementados y guardados en el servidor con sesión. **Criterio 5 parcial:** el backend admite franco (`loam`), arcilloso, arenoso, limoso, otro y desconocido; faltan gredoso y pantanoso (hallazgo M-01). Caso sugerido: P-006.

---

| **Nro:** HU-011 | **Título:** Actualizar el huerto real | **Prioridad:** Alta<br>**Estimación:** 6 horas |
|---|---|---|

**Historia de usuario:**

**Como** responsable de comunidad **quiero** editar los datos de mi huerto, **para** corregirlos o reflejar cambios en el huerto real.

**Sabré que he terminado cuando se cumplan todos los criterios de aceptación:**

1. **Edición exitosa:** **Dado** que tengo un huerto registrado, **cuando** pulso «Editar mi huerto», modifico datos y guardo, **entonces** la ficha muestra los nuevos datos.
2. **Cancelar edición:** **Dado** que estoy editando, **cuando** cancelo, **entonces** se descartan los cambios y la ficha conserva los últimos datos guardados.
3. **Plantas conservadas:** **Dado** que tengo plantas y actividades registradas, **cuando** cambio la modalidad o las características del huerto, **entonces** se conservan las plantas y las actividades.

**Tareas de implementación:**

1. Diseñar la vista de edición (1 hora).
2. Codificar la edición y la cancelación (2 horas).
3. Incluir validaciones (1 hora).
4. Codificar la actualización en el almacenamiento y en el backend (1 hora).
5. Probar edición, cancelación y conservación de plantas (1 hora).

> *Estado V1:* 🟢 Con sesión, `PUT /api/gardens/:id`. Caso sugerido: P-007.

---

## Módulo 4 — Catálogo de plantas medicinales

| **Nro:** HU-012 | **Título:** Consultar el catálogo de plantas medicinales | **Prioridad:** Alta<br>**Estimación:** 9 horas |
|---|---|---|

**Historia de usuario:**

**Como** integrante de comunidad **quiero** consultar y filtrar las especies medicinales disponibles, **para** elegir qué planta registrar en mi huerto.

**Sabré que he terminado cuando se cumplan todos los criterios de aceptación:**

1. **Listado:** **Dado** que abro «Descubrir plantas», **cuando** se carga el catálogo, **entonces** se muestran las especies con su nombre común y su nombre científico.
2. **Filtro:** **Dado** que estoy en el catálogo, **cuando** escribo parte del nombre de una especie, **entonces** se muestran solo las especies que coinciden.
3. **Sin coincidencias:** **Dado** que escribo un nombre que no existe en el catálogo, **cuando** filtro, **entonces** se muestra un mensaje indicando que no hay resultados.

**Tareas de implementación:**

1. Definir el catálogo inicial de especies con sus fuentes (3 horas).
2. Diseñar la vista del catálogo (2 horas).
3. Codificar el listado y el filtro (3 horas).
4. Probar listado, filtro y búsqueda sin resultados (1 hora).

> *Estado V1:* 🟢 `GET /api/catalog?q=` (público) con **8 especies**: romero, manzanilla, menta, toronjil, hierbabuena, lavanda, orégano y llantén. Siete de ellas figuran entre las sugeridas por el MSP para la Sierra (p. 20). El mensaje del criterio 3 está por confirmar. Caso sugerido: por definir con Santiago.

---

| **Nro:** HU-013 | **Título:** Consultar la ficha botánica de una especie | **Prioridad:** Media<br>**Estimación:** 15 horas |
|---|---|---|

**Historia de usuario:**

**Como** integrante de comunidad **quiero** ver la ficha completa de una planta medicinal, **para** aprender sobre ella antes de cultivarla.

**Sabré que he terminado cuando se cumplan todos los criterios de aceptación:**

1. **Ficha completa:** **Dado** que estoy en el catálogo, **cuando** abro una especie, **entonces** veo su nombre científico, nombre común, otros nombres, familia botánica, altitud, provincias donde se distribuye, ciclo (corto o largo), cualidad (caliente o fría), usos medicinales y fotografías con su fuente.
2. **Aviso de salud:** **Dado** que la ficha muestra usos medicinales, **cuando** la consulto, **entonces** se indica que la información es educativa y no constituye una recomendación médica.
3. **Dato no disponible:** **Dado** que falta un dato de la especie, **cuando** abro la ficha, **entonces** se muestra «No disponible», sin inventar información.

**Tareas de implementación:**

1. Investigar y redactar el contenido de las especies con fuentes verificables (6 horas).
2. Diseñar la ficha botánica (2 horas).
3. Codificar la ficha en el frontend (3 horas).
4. Codificar el servicio de consulta del catálogo en el backend (3 horas).
5. Probar fichas completas e incompletas (1 hora).

> *Estado V1:* ⚠️ **Parcial.** `GET /api/catalog/:id` devuelve nombre común, nombre científico, descripción, propiedades medicinales, preparación y contraindicaciones. **Faltan** otros nombres, familia, altitud, provincias, ciclo, cualidad caliente/fría, fotografías y fuentes. La cualidad y el ciclo de 7 especies pueden tomarse del MSP 2017 (hallazgo M-02). Criterio 2 por verificar en la interfaz. Ver [dudas y decisiones pendientes](../analisis/dudas-y-decisiones-pendientes.md) (D-01).

---

## Módulo 5 — Huerto virtual

| **Nro:** HU-014 | **Título:** Visualizar mi huerto virtual | **Prioridad:** Alta<br>**Estimación:** 24 horas |
|---|---|---|

**Historia de usuario:**

**Como** integrante de comunidad **quiero** ver un huerto virtual que represente la región y el tipo de mi huerto real, **para** seguir de forma visual y motivadora el cultivo de mis plantas.

**Sabré que he terminado cuando se cumplan todos los criterios de aceptación:**

1. **Escenario según el huerto real:** **Dado** que registré mi huerto, **cuando** abro Mi Huerto, **entonces** el escenario corresponde a la región de la provincia y a la modalidad registradas, con seis espacios de siembra.
2. **Navegación:** **Dado** que estoy en el huerto virtual, **cuando** uso ratón, toque o teclado (flechas, Inicio, Fin), **entonces** puedo moverme, hacer zoom y seleccionar cada espacio.
3. **Sin huerto registrado:** **Dado** que aún no registré comunidad o huerto, **cuando** abro Mi Huerto, **entonces** se me ofrece un acceso para completar ese registro.
4. **Motor gráfico no disponible:** **Dado** que el motor gráfico no puede iniciar, **cuando** abro Mi Huerto, **entonces** se muestra una alternativa HTML con los seis espacios.

**Tareas de implementación:**

1. Diseñar los escenarios por región y modalidad (6 horas).
2. Codificar la escena interactiva con Phaser (8 horas).
3. Codificar la alternativa HTML accesible (3 horas).
4. Adaptar el escenario a la región, la modalidad y las instalaciones declaradas (4 horas).
5. Probar escenarios, navegación y accesibilidad (3 horas).

> *Estado V1:* 🟢 4 regiones × 4 modalidades; con sesión, las parcelas se cargan desde `GET /api/gardens/:gardenId/plants`. Caso sugerido: P-014.

---

| **Nro:** HU-015 | **Título:** Registrar una planta con fotografía real | **Prioridad:** Alta<br>**Estimación:** 12 horas |
|---|---|---|

**Historia de usuario:**

**Como** integrante de comunidad **quiero** registrar una planta de mi huerto eligiendo su especie y subiendo una fotografía real, **para** verla en un espacio de mi huerto virtual.

**Sabré que he terminado cuando se cumplan todos los criterios de aceptación:**

1. **Registro exitoso:** **Dado** que seleccioné un espacio vacío, **cuando** elijo la especie, adjunto una foto desde la galería o la cámara y guardo, **entonces** la planta aparece en ese espacio con su fotografía.
2. **Foto no válida:** **Dado** que adjunto un archivo que no es JPG, PNG o WebP, o que pesa más de 3 MB, **cuando** intento guardar, **entonces** se muestra un error y la planta no se registra.
3. **Espacio ocupado o huerto lleno:** **Dado** que el espacio está ocupado o los seis espacios están llenos, **cuando** intento registrar una planta, **entonces** no se sobrescribe ninguna planta y se informa la situación.
4. **Cámara no disponible:** **Dado** que la cámara no está disponible o se denegó el permiso, **cuando** intento tomar una foto, **entonces** se muestra un mensaje y puedo usar la galería.

**Tareas de implementación:**

1. Diseñar el formulario de registro de planta (2 horas).
2. Codificar la elección de especie y la carga de foto desde galería o cámara (4 horas).
3. Incluir validaciones de formato, tamaño y ocupación del espacio (2 horas).
4. Codificar el almacenamiento de la fotografía (2 horas).
5. Probar con fotos válidas, inválidas y espacios ocupados (2 horas).

> *Estado V1:* 🟢 Con sesión, `POST /api/gardens/:gardenId/plants` (multipart) valida tipo y tamaño (`INVALID_FILE_TYPE`, `FILE_TOO_LARGE`), parcela 0–5 (`INVALID_PLOT`) y ocupación (`409 PLOT_OCCUPIED`). La especie la elige el usuario; no se identifica automáticamente desde la foto. Caso sugerido: P-014.

---

| **Nro:** HU-016 | **Título:** Consultar y actualizar el Pasaporte Vivo | **Prioridad:** Alta<br>**Estimación:** 12 horas |
|---|---|---|

**Historia de usuario:**

**Como** integrante de comunidad **quiero** abrir la ficha (Pasaporte Vivo) de cada planta y registrar su estado, altura, observaciones y nuevas fotos, **para** documentar su crecimiento.

**Sabré que he terminado cuando se cumplan todos los criterios de aceptación:**

1. **Consultar ficha:** **Dado** que un espacio tiene una planta, **cuando** lo selecciono, **entonces** se abre su Pasaporte Vivo con especie, nombre científico, foto, fecha y espacio.
2. **Actualizar ficha:** **Dado** que estoy en el Pasaporte Vivo, **cuando** registro estado, altura, observaciones o una nueva foto, **entonces** se guardan sin borrar las evidencias anteriores.
3. **Archivar planta:** **Dado** que soy Responsable de la comunidad y archivo una planta, **cuando** confirmo, **entonces** se libera su espacio sin borrar su ficha ni sus fotos; si soy Participante, la opción no está permitida.
4. **Restaurar en espacio ocupado:** **Dado** que el espacio original de una planta archivada está ocupado, **cuando** intento restaurarla, **entonces** el sistema lo impide e informa el conflicto.
5. **Cerrar la ficha:** **Dado** que tengo el Pasaporte abierto, **cuando** pulso Escape, **entonces** se cierra y el foco vuelve al espacio seleccionado.

**Tareas de implementación:**

1. Diseñar el Pasaporte Vivo (2 horas).
2. Codificar la consulta de la ficha (3 horas).
3. Codificar la edición de estado, altura, observaciones y fotos (3 horas).
4. Codificar el archivo y la restauración con control de ocupación (2 horas).
5. Probar consulta, edición, archivo y restauración (2 horas).

> *Estado V1:* 🟢 Con sesión, `GET /api/plants/:id/passport` y `PATCH /api/plants/:id/archive`. Caso sugerido: P-014.

---

| **Nro:** HU-017 | **Título:** Registrar actividades de cultivo | **Prioridad:** Media<br>**Estimación:** 13 horas |
|---|---|---|

**Historia de usuario:**

**Como** integrante de comunidad **quiero** registrar las actividades que realizo en mi huerto (preparación, limpieza o deshierbe, siembra, riego, abonado, aporque, replante, seguimiento y cosecha), **para** llevar la bitácora de cultivo y avanzar en mi progreso.

**Sabré que he terminado cuando se cumplan todos los criterios de aceptación:**

1. **Registro exitoso:** **Dado** que tengo un huerto registrado, **cuando** registro una actividad con tipo, fecha, responsable, destino, notas y, si lo deseo, una foto, **entonces** la actividad aparece en «Mi historia».
2. **Datos incompletos:** **Dado** que dejé vacío un dato obligatorio, **cuando** intento guardar la actividad, **entonces** se muestra el error y no se registra.
3. **Anular actividad:** **Dado** que registré una actividad por error, **cuando** la anulo, **entonces** se conserva en el historial como anulada, con su evidencia, y se revierten sus efectos.
4. **Conflicto de ocupación:** **Dado** que intento un replante hacia un espacio ocupado, **cuando** guardo, **entonces** el sistema lo rechaza y no desplaza a otra planta.

**Tareas de implementación:**

1. Diseñar el formulario y la lista de actividades (2 horas).
2. Codificar los nueve tipos de actividad y sus datos específicos (5 horas).
3. Incluir validaciones y control de ocupación (2 horas).
4. Codificar la anulación conservando el historial (2 horas).
5. Probar cada tipo de actividad y su anulación (2 horas).

> *Estado V1:* 🟢 Con sesión, riego, abonado y poda se registran en `POST /api/plants/:id/care`, que valida exceso de riego y abono; la cosecha se detalla en HU-022. Los rituales de la definición quedan para incrementos posteriores. Caso sugerido: P-014.

---

| **Nro:** HU-018 | **Título:** Consultar mi progreso (Mi camino verde) | **Prioridad:** Media<br>**Estimación:** 12 horas |
|---|---|---|

**Historia de usuario:**

**Como** integrante de comunidad **quiero** ganar Semillas de vida, niveles e insignias por las actividades que registro, **para** sentirme motivado a cuidar mi huerto.

**Sabré que he terminado cuando se cumplan todos los criterios de aceptación:**

1. **Puntos por actividad:** **Dado** que registro una actividad válida, **cuando** consulto «Mi camino verde», **entonces** veo los puntos correspondientes: preparación 10, limpieza 8, siembra 20, riego 5, abonado 8, aporque 8, replante 10, seguimiento 12 y cosecha 20.
2. **Niveles:** **Dado** que acumulo puntos, **cuando** alcanzo 100 o 300, **entonces** paso a nivel Oficial o Maestro respectivamente (Aprendiz desde 0).
3. **Sin duplicados:** **Dado** que registro otra actividad con el mismo tipo, fecha, destino y responsable, **cuando** se recalcula el progreso, **entonces** esa actividad suma 0 puntos.
4. **Actividad anulada:** **Dado** que anulo una actividad, **cuando** se recalcula el progreso, **entonces** sus puntos dejan de sumar.
5. **Insignias:** **Dado** que registro una siembra con foto, riego en tres fechas, seguimiento fotográfico en tres fechas o una cosecha con foto, **cuando** consulto mi progreso, **entonces** obtengo la insignia correspondiente.

**Tareas de implementación:**

1. Definir las reglas de puntos, niveles e insignias (2 horas).
2. Codificar el cálculo de progreso a partir de los registros (4 horas).
3. Diseñar la vista «Mi camino verde» (2 horas).
4. Codificar la vista de progreso (2 horas).
5. Probar puntos, niveles, duplicados y anulaciones (2 horas).

> *Estado V1:* ⚠️ Puntos, niveles e insignias se calculan **en el navegador** (regla local V1); el servidor no los valida ni los guarda (D-07). El ranking entre comunidades queda fuera de V1. Caso sugerido: P-014.

---

## Transversal

| **Nro:** HU-019 | **Título:** Conservar mis registros | **Prioridad:** Alta<br>**Estimación:** 11 horas |
|---|---|---|

**Historia de usuario:**

**Como** integrante de comunidad **quiero** que mi comunidad, mi huerto, mis plantas y mis actividades se conserven, **para** no perder mi información al cerrar o recargar la aplicación.

**Sabré que he terminado cuando se cumplan todos los criterios de aceptación:**

1. **Recarga de página:** **Dado** que registré comunidad, huerto, plantas y actividades, **cuando** recargo la página en el mismo navegador, **entonces** todos los registros y fotografías se mantienen.
2. **Fallo de escritura:** **Dado** que ocurre un error al guardar, **cuando** se intenta la operación, **entonces** se conserva el registro anterior y se muestra un aviso.
3. **Varias pestañas:** **Dado** que tengo la aplicación abierta en dos pestañas, **cuando** registro un cambio en una, **entonces** la otra muestra los datos actualizados.
4. **Entre dispositivos:** **Dado** que tengo una cuenta, **cuando** inicio sesión desde otro navegador o dispositivo, **entonces** veo mis registros guardados en el servidor.

**Tareas de implementación:**

1. Diseñar el repositorio de datos (2 horas).
2. Codificar el almacenamiento en IndexedDB con transacciones (4 horas).
3. Codificar el manejo de errores de escritura (2 horas).
4. Codificar la sincronización entre pestañas (1 hora).
5. Probar recarga, fallos y varias pestañas (2 horas).

> *Estado V1:* 🟢 Con sesión, los datos y fotos se guardan en SQLite y en `backend/uploads/plants/` (criterio 4). En modo visitante se aplican los criterios 1–3 con IndexedDB. Casos sugeridos: P-008, P-012, P-013.

---

## Funciones añadidas con el backend integrado

| **Nro:** HU-020 | **Título:** Responder invitaciones a una comunidad | **Prioridad:** Media<br>**Estimación:** 8 horas |
|---|---|---|

**Historia de usuario:**

**Como** persona registrada **quiero** ver las invitaciones que recibo y aceptarlas o rechazarlas, **para** unirme solo a las comunidades en las que deseo participar.

**Sabré que he terminado cuando se cumplan todos los criterios de aceptación:**

1. **Notificación:** **Dado** que tengo invitaciones pendientes, **cuando** inicio sesión, **entonces** la campana de notificaciones muestra cuántas son.
2. **Aceptar:** **Dado** que abro una invitación pendiente, **cuando** la acepto, **entonces** paso a ser integrante de la comunidad con el rol indicado y puedo seleccionarla como comunidad activa.
3. **Rechazar:** **Dado** que abro una invitación pendiente, **cuando** la rechazo, **entonces** no me uno a la comunidad y la invitación deja de estar pendiente.
4. **Invitación ya procesada:** **Dado** que la invitación ya fue aceptada o rechazada, **cuando** intento responderla otra vez, **entonces** se informa que ya fue procesada.

**Tareas de implementación:**

1. Diseñar la campana y el modal de notificaciones (2 horas).
2. Codificar la consulta de invitaciones del usuario (1 hora).
3. Codificar aceptar y rechazar en backend y frontend (3 horas).
4. Probar aceptación, rechazo y doble respuesta (2 horas).

> *Estado V1:* 🟢 `GET /api/users/me/invitations`, `POST /api/invitations/:id/accept` y `…/reject` (`ALREADY_PROCESSED`). Caso sugerido: por definir con Santiago.

---

| **Nro:** HU-021 | **Título:** Gestionar el almacén comunitario (bodega) | **Prioridad:** Baja<br>**Estimación:** 12 horas |
|---|---|---|

**Historia de usuario:**

**Como** responsable o cuidador de una comunidad **quiero** registrar las herramientas, insumos y semillas de la bodega con su cantidad y estado, **para** saber con qué recursos cuenta el huerto.

**Sabré que he terminado cuando se cumplan todos los criterios de aceptación:**

1. **Registrar recurso:** **Dado** que tengo rol Responsable o Cuidador, **cuando** registro un recurso con nombre, categoría (herramienta, insumo o semilla), cantidad y unidad, **entonces** aparece en el inventario de la comunidad.
2. **Actualizar estado:** **Dado** que existe un recurso, **cuando** cambio su cantidad o su estado (disponible, en uso, mantenimiento o agotado), **entonces** el inventario refleja el cambio.
3. **Sin permiso:** **Dado** que soy Participante, **cuando** intento registrar, modificar o eliminar un recurso, **entonces** el sistema rechaza la acción.
4. **Eliminar:** **Dado** que soy Responsable, **cuando** elimino un recurso, **entonces** deja de mostrarse en el inventario.

**Tareas de implementación:**

1. Diseñar la vista del almacén (2 horas).
2. Codificar el modelo y los servicios de recursos (4 horas).
3. Codificar el control de permisos por rol (2 horas).
4. Codificar la vista de inventario en el frontend (2 horas).
5. Probar altas, cambios, bajas y permisos (2 horas).

> *Estado V1:* 🟢 `/api/communities/:id/resources` (crear y modificar: Responsable o Cuidador; eliminar: solo Responsable). Corresponde al «espacio de bodega» de la definición y del MSP (p. 24). Caso sugerido: por definir con Santiago.

---

| **Nro:** HU-022 | **Título:** Registrar la cosecha de una planta | **Prioridad:** Media<br>**Estimación:** 10 horas |
|---|---|---|

**Historia de usuario:**

**Como** integrante de comunidad **quiero** registrar la cosecha de una planta lista, indicando la cantidad obtenida, **para** llevar el control de lo producido y sumarlo al almacén comunitario.

**Sabré que he terminado cuando se cumplan todos los criterios de aceptación:**

1. **Cosecha exitosa:** **Dado** que una planta está lista para cosechar, **cuando** registro la cosecha con su cantidad, **entonces** se guarda el registro y la cantidad se suma al almacén de la comunidad.
2. **Rebrote:** **Dado** que coseché una planta medicinal perenne, **cuando** vuelvo al huerto, **entonces** la planta sigue en su parcela en estado de rebrote, sin liberar el espacio.
3. **Historial:** **Dado** que la comunidad tiene cosechas, **cuando** consulto el historial, **entonces** veo especie, cantidad, fecha y quién cosechó.
4. **Planta inexistente:** **Dado** que la planta ya no existe, **cuando** intento cosecharla, **entonces** se informa que no fue encontrada.

**Tareas de implementación:**

1. Diseñar el formulario de cosecha (1 hora).
2. Codificar el registro de cosecha y su vínculo con la comunidad (3 horas).
3. Codificar la suma automática al almacén (2 horas).
4. Codificar el cambio de estado a rebrote (2 horas).
5. Probar cosecha, rebrote e historial (2 horas).

> *Estado V1:* 🟢 `/api/plants/:id/harvest` y consultas por huerto y comunidad. El MSP recomienda cosechar tomando solo las partes necesarias (p. 49), coherente con el rebrote. Caso sugerido: por definir con Santiago.

---

| **Nro:** HU-023 | **Título:** Consultar el calendario de siembra de una especie | **Prioridad:** Baja<br>**Estimación:** 7 horas |
|---|---|---|

**Historia de usuario:**

**Como** integrante de comunidad **quiero** consultar la temporada, la frecuencia de riego y abono, el ciclo de crecimiento y la fase lunar recomendada de cada especie, **para** cuidar mis plantas según los saberes ancestrales.

**Sabré que he terminado cuando se cumplan todos los criterios de aceptación:**

1. **Consulta:** **Dado** que tengo sesión iniciada, **cuando** consulto el calendario de una especie, **entonces** veo su mejor temporada de siembra, frecuencia de riego y abono, ciclo de crecimiento y consejo de fase lunar.
2. **Alerta de exceso:** **Dado** que registro un riego o abono antes de la frecuencia recomendada, **cuando** guardo, **entonces** el sistema advierte del exceso.
3. **Especie inexistente:** **Dado** que la especie no existe, **cuando** consulto su calendario, **entonces** se informa que no fue encontrada.

**Tareas de implementación:**

1. Definir los datos de calendario por especie con fuentes (MSP 2017) (2 horas).
2. Codificar el servicio de calendario (2 horas).
3. Mostrar el calendario en la interfaz (2 horas).
4. Probar consulta y alertas (1 hora).

> *Estado V1:* 🟢 `GET /api/catalog/:id/calendar` y validación `CARE_OVERUSE`. Los consejos lunares deben alinearse con el MSP 2017 (p. 69; hallazgo M-03). Caso sugerido: por definir con Santiago.

---

## Trazabilidad con los casos de prueba propuestos por QA

| Caso (plan de Santiago) | HU relacionadas |
|---|---|
| P-001 Bienvenida y navegación | HU-004 |
| P-002 Validaciones de registro/login | HU-001, HU-002 |
| P-003 Crear comunidad | HU-005, HU-007 |
| P-004 Editar comunidad | HU-006 |
| P-005 Provincia, cantón y parroquia | HU-008, HU-009 |
| P-006 Registrar huerto | HU-010 |
| P-007 Editar huerto | HU-011 |
| P-008 Persistencia local al recargar | HU-019 |
| P-009 Teclado y móvil | Transversal (HU-008, HU-014) |
| P-010 Cuenta, login y logout reales | HU-001, HU-002, HU-003 |
| P-011 Permisos entre cuentas y roles | HU-002, HU-006, HU-007, HU-021 |
| P-012 Persistencia en servidor | HU-005 a HU-011, HU-019 |
| P-013 Flujo integrado completo | HU-001 a HU-019 (recorrido de la demo) |
| P-014 Mi Huerto en modo local | HU-014 a HU-018 |
| P-015 Integración final de Mi Huerto | HU-014 a HU-018, HU-022 |
| *Sin caso todavía (proponer a Santiago)* | HU-012, HU-013, HU-020, HU-021, HU-022, HU-023 |

*La matriz definitiva HU ↔ caso ↔ resultado la completan Santiago y Leonardo en `docs/casos-prueba/matriz-hu-pruebas.md`.*
