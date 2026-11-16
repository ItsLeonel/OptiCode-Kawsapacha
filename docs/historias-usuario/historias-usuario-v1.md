# Historias de usuario — Kawsapacha V1 (Mi Huerto Vivo)

**Proyecto:** Huertos Medicinales Comunitarios — ISWD652 Calidad de Software, 2026B · **Equipo:** OptiCode
**Responsable:** Leonardo Lugmaña (Analista) · **Revisor:** Leonel Morales (PM) · **Issue:** #2 ANA-001
**Versión del documento:** 2.0 — 15/11/2026 · **Plantilla:** Historias de Usuario (aula virtual)

> **Fuentes:** definición del proyecto «Huertos Medicinales Comunitarios»; [lineamientos MSP 2017 aplicados](../analisis/lineamientos-msp-aplicados.md); [alcance V1](../analisis/alcance-v1.md); [flujo MSP no bloqueante](../analisis/flujo-msp-v1-no-bloqueante.md); [arquitectura implementada](../architecture/README.md) y [contratos de API](../arquitectura/contratos-api.md); [README del frontend](../../frontend/README.md); código del backend (`backend/src/modules/`, `backend/prisma/schema.prisma`).
>
> **Estimaciones:** las horas son una **estimación del analista**, pendiente de validar con Leonel (frontend) y Ronny (backend). No son horas registradas.
>
> **Estado** (fuera de la plantilla, solo para trazabilidad): 🟢 implementada según el código (**pendiente de verificación por QA**) · ⚠️ parcial · ❌ no implementada. Ningún estado equivale a «prueba aprobada»; eso lo determina Santiago con evidencias.
>
> **Modo híbrido:** con sesión iniciada, los datos se guardan en el servidor (SQLite); en modo visitante se conservan en el navegador (IndexedDB).

## Actores

| Actor | Descripción |
|---|---|
| Visitante | Persona sin cuenta que explora Kawsapacha; sus registros se guardan solo en su navegador. |
| Participante | Integrante con cuenta (rol global `USUARIO`) que pertenece a una comunidad; registra plantas, actividades y cosechas. |
| Cuidador | Integrante de la comunidad con permiso para registrar y modificar los recursos de la bodega y registrar cosechas. Alcance exacto por confirmar (D-11). |
| Responsable de comunidad | Integrante que crea y actualiza la comunidad, invita integrantes, asigna roles, registra el huerto real y archiva plantas. |
| Funcionario MSP | Cuenta institucional (`ADMIN_MSP`) que revisa comunidades y actividades sin bloquearlas, y publica eventos y recursos educativos. |
| Administrador técnico | Cuenta (`ADMIN_TECNICO`) que crea las cuentas MSP, activa o desactiva usuarios y consulta la auditoría. |

Los roles Participante, Cuidador y Responsable son roles **dentro de cada comunidad**; una misma persona puede tener roles distintos en comunidades distintas.

## Backlog priorizado

| Nro | Título | Módulo | Prioridad | Estimación | Estado |
|---|---|---|---|---:|---|
| HU-001 | Registrar una cuenta | Usuarios | Alta | 15 h | 🟢 |
| HU-002 | Iniciar sesión | Usuarios | Alta | 11 h | 🟢 |
| HU-003 | Cerrar sesión | Usuarios | Media | 5 h | 🟢 |
| HU-004 | Explorar Kawsapacha como visitante | Usuarios | Media | 7 h | 🟢 |
| HU-005 | Registrar una comunidad de siembra | Comunidades | Alta | 13 h | 🟢 |
| HU-006 | Actualizar la comunidad | Comunidades | Alta | 7 h | 🟢 |
| HU-007 | Invitar integrantes y gestionar sus roles | Comunidades | Alta | 14 h | ⚠️ Datos personales del integrante no se guardan en el servidor |
| HU-020 | Responder invitaciones a una comunidad | Comunidades | Media | 8 h | 🟢 |
| HU-021 | Gestionar el almacén comunitario (bodega) | Comunidades | Baja | 12 h | 🟢 |
| HU-008 | Registrar el huerto real eligiendo la provincia en el mapa | Huertos reales | Alta | 13 h | 🟢 |
| HU-009 | Detallar la ubicación del huerto | Huertos reales | Media | 13 h | 🟢 |
| HU-010 | Registrar las características del huerto | Huertos reales | Alta | 12 h | 🟢 |
| HU-011 | Actualizar el huerto real | Huertos reales | Alta | 6 h | 🟢 |
| HU-012 | Consultar el catálogo de plantas medicinales | Catálogo | Alta | 9 h | 🟢 30 especies por región |
| HU-013 | Consultar la ficha botánica de una especie | Catálogo | Media | 15 h | ⚠️ Cualidad caliente/fría por documentar; 13 de 30 con foto |
| HU-023 | Consultar el calendario de siembra y la fase lunar | Catálogo | Baja | 7 h | 🟢 |
| HU-014 | Visualizar mi huerto virtual | Mi Huerto | Alta | 24 h | 🟢 |
| HU-015 | Registrar una planta con fotografía real | Mi Huerto | Alta | 12 h | 🟢 |
| HU-016 | Consultar y actualizar el Pasaporte Vivo | Mi Huerto | Alta | 12 h | 🟢 |
| HU-027 | Reflejar en el Espejo Digital la etapa real de mi planta | Mi Huerto | Alta | 14 h | 🟢 |
| HU-017 | Registrar actividades de cultivo | Ciclo agrícola | Media | 13 h | 🟢 |
| HU-022 | Registrar la cosecha de una planta | Ciclo agrícola | Media | 10 h | 🟢 |
| HU-024 | Registrar la poscosecha | Ciclo agrícola | Media | 12 h | 🟢 |
| HU-025 | Registrar los rituales de siembra y de gratitud | Ciclo agrícola | Baja | 6 h | 🟢 |
| HU-026 | Imprimir la señalética botánica de una planta | Ciclo agrícola | Media | 8 h | 🟢 |
| HU-018 | Consultar mi progreso (Mi Camino Verde) | Mi Camino Verde | Media | 12 h | 🟢 |
| HU-028 | Consultar mis notificaciones | Notificaciones | Media | 6 h | 🟢 |
| HU-029 | Revisar comunidades y actividades sin bloquear a las comunidades | Administración | Alta | 16 h | 🟢 |
| HU-030 | Publicar eventos y recursos educativos del MSP | Administración | Baja | 10 h | 🟢 |
| HU-031 | Administrar las cuentas institucionales | Administración | Media | 12 h | 🟢 |
| HU-019 | Conservar mis registros | Transversal | Alta | 11 h | 🟢 Servidor con sesión · navegador como visitante |
| | **Total** | | | **345 h** | |

El backlog se ordena por módulo. Los números identifican cada historia de forma estable y no indican orden de desarrollo.

**Fuera del alcance de esta versión:** ranking nacional o provincial entre comunidades y entrega de premios, foro con moderación, certificación de talentos, retos y misiones definidos por el cliente, videos y exportación de reportes. Se planifican para la versión 2 ([alcance V1](../analisis/alcance-v1.md)).

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

> *Estado:* 🟢 `POST /api/auth/register` aplica las mismas reglas en el servidor, guarda la contraseña con bcrypt y responde `409 EMAIL_IN_USE` si el correo existe. Casos sugeridos: P-002, P-010.

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

> *Estado:* 🟢 `POST /api/auth/login` devuelve un token JWT (vigencia configurable, 7 días por defecto) y el mensaje genérico «Correo o contraseña incorrectos» (`401`). Casos sugeridos: P-002, P-010, P-011.

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

> *Estado:* 🟢 El cierre de sesión descarta el token en el frontend. Al ser JWT sin estado, el servidor no invalida el token antes de su vencimiento (tarea 3 queda como mejora). Casos sugeridos: P-010, P-013.

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

> *Estado:* 🟢 En modo visitante los datos se guardan solo en IndexedDB del navegador. Caso sugerido: P-001.

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

> *Estado:* 🟢 `POST /api/communities` guarda nombre, responsable, ubicación, descripción, tipo y foto opcional; quien la crea queda como Responsable. La comunidad nace pendiente de revisión del MSP y funciona desde el primer momento (HU-029). Validaciones exactas de contacto por confirmar con Leonel (D-06). Caso sugerido: P-003.

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

> *Estado:* 🟢 `PUT /api/communities/:id` exige rol Responsable. Casos sugeridos: P-004, P-011.

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

> *Estado:* ⚠️ Criterios 1–5 implementados (`POST /api/communities/:id/members/invite`, `PATCH …/:userId/role`, `DELETE …/:userId`, solo Responsable). **Criterio 6 parcial:** el modelo `CommunityMember` del servidor no guarda fecha de nacimiento, género ni talentos (D-05). La certificación de talentos y el ascenso de nivel quedan para una versión posterior (C-03). Casos sugeridos: P-003, P-011.

---

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

> *Estado:* 🟢 `GET /api/users/me/invitations`, `POST /api/invitations/:id/accept` y `…/reject` (`ALREADY_PROCESSED`). Caso sugerido: por definir con Santiago.

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

> *Estado:* 🟢 `/api/communities/:id/resources` (crear y modificar: Responsable o Cuidador; eliminar: solo Responsable). Corresponde al «espacio de bodega» de la definición y del MSP (p. 24). Caso sugerido: por definir con Santiago.

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

> *Estado:* 🟢 Las 24 provincias. Con sesión, el huerto se guarda con `POST /api/gardens` (provincia y código oficial). Caso sugerido: P-005.

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

> *Estado:* 🟢 El servidor guarda cantón, parroquia, códigos INEC, referencia y coordenadas opcionales. La aplicación nunca solicita la ubicación del dispositivo. Caso sugerido: P-005.

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

> *Estado:* 🟢 Criterios 1–5 implementados y guardados en el servidor con sesión. El selector de suelo ofrece arcilloso, limoso, arenoso, margoso, gredoso y pantanoso (MSP 2017, Tabla 1), además de franco, otro y «por determinar». Caso sugerido: P-006.

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

> *Estado:* 🟢 Con sesión, `PUT /api/gardens/:id`. Caso sugerido: P-007.

---

## Módulo 4 — Catálogo de plantas medicinales y calendario

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

> *Estado:* 🟢 `GET /api/catalog?q=` (público) con **30 especies** organizadas por región (Sierra, Costa, Amazonía y Galápagos), entre ellas las siete sugeridas por el MSP para la Sierra (p. 20). El mensaje del criterio 3 está por confirmar. Caso sugerido: por definir con Santiago.

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

> *Estado:* ⚠️ **Parcial.** `GET /api/catalog/:id` devuelve nombre común y científico, otros nombres, familia, altitud, provincias, regiones, ciclo, usos, cuidados, contraindicaciones y la fuente de cada ficha. **Pendiente:** la cualidad caliente/fría figura como «Por documentar» en las 30 fichas (la señalética sí usa el Anexo 5 del MSP para siete especies, HU-026), y 13 de las 30 especies tienen fotografía con crédito. Criterio 2 por verificar en la interfaz. Ver [dudas y decisiones](../analisis/dudas-y-decisiones-pendientes.md) (D-01).

---

| **Nro:** HU-023 | **Título:** Consultar el calendario de siembra y la fase lunar | **Prioridad:** Baja<br>**Estimación:** 7 horas |
|---|---|---|

**Historia de usuario:**

**Como** integrante de comunidad **quiero** consultar la temporada, la frecuencia de riego y abono, el ciclo de crecimiento y la fase lunar recomendada de cada especie, **para** cuidar mis plantas según los saberes ancestrales.

**Sabré que he terminado cuando se cumplan todos los criterios de aceptación:**

1. **Consulta de la especie:** **Dado** que abro la ficha de una especie, **cuando** consulto su calendario, **entonces** veo su mejor temporada de siembra, frecuencia de riego y abono, ciclo de crecimiento y consejo de fase lunar.
2. **Fase lunar del día:** **Dado** que abro el calendario lunar, **cuando** elijo un día o un mes, **entonces** veo la fase lunar y las labores aconsejadas, como orientación y no como una actividad realizada.
3. **Alerta de exceso:** **Dado** que registro un riego o abono antes de la frecuencia recomendada, **cuando** guardo, **entonces** el sistema advierte del exceso.
4. **Especie inexistente:** **Dado** que la especie no existe, **cuando** consulto su calendario, **entonces** se informa que no fue encontrada.

**Tareas de implementación:**

1. Definir los datos de calendario por especie con fuentes (MSP 2017) (2 horas).
2. Codificar el servicio de calendario (2 horas).
3. Mostrar el calendario en la interfaz (2 horas).
4. Probar consulta y alertas (1 hora).

> *Estado:* 🟢 Los datos de calendario forman parte de la ficha (`GET /api/catalog/:id`) y la fase lunar se consulta en `GET /api/lunar-calendar?date=` o `?month=`; el exceso de cuidados responde `CARE_OVERUSE`. Los consejos lunares deben alinearse con el MSP 2017 (p. 69; hallazgo M-03). Caso sugerido: por definir con Santiago.

---

## Módulo 5 — Mi Huerto (huerto virtual)

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

> *Estado:* 🟢 Cuatro regiones (Costa, Sierra, Amazonía y Galápagos) por cuatro modalidades (en tierra, macetas, vertical y colgante); con sesión, las parcelas se cargan desde `GET /api/gardens/:gardenId/plants`. Mi Huerto agrupa el terreno, el catálogo, las plantas y la Bitácora. Caso sugerido: P-014.

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

> *Estado:* 🟢 Con sesión, `POST /api/gardens/:gardenId/plants` (multipart) valida tipo y tamaño (`INVALID_FILE_TYPE`, `FILE_TOO_LARGE`), parcela 0–5 (`INVALID_PLOT`) y ocupación (`409 PLOT_OCCUPIED`). La especie la elige el usuario; no se identifica automáticamente desde la foto. Caso sugerido: P-014.

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

> *Estado:* 🟢 Con sesión, `GET /api/plants/:id/passport`, `PATCH /api/plants/:id` y `PATCH /api/plants/:id/archive`. El archivo lo autoriza el servidor al Responsable o a quien creó la comunidad o el huerto. Caso sugerido: P-014.

---

| **Nro:** HU-027 | **Título:** Reflejar en el Espejo Digital la etapa real de mi planta | **Prioridad:** Alta<br>**Estimación:** 14 horas |
|---|---|---|

**Historia de usuario:**

**Como** integrante de comunidad **quiero** que mi planta virtual muestre la etapa que observé en mi planta real, junto con su fotografía, **para** que el huerto virtual sea un espejo fiel de mi huerto.

**Sabré que he terminado cuando se cumplan todos los criterios de aceptación:**

1. **Etapa observada:** **Dado** que registro un seguimiento con foto e indico la etapa que observo (por ejemplo, brote), **cuando** vuelvo a Mi Huerto, **entonces** la planta virtual se muestra en esa etapa.
2. **Sin crecimiento ficticio:** **Dado** que solo registro riegos o pasan los días, **cuando** abro Mi Huerto, **entonces** la etapa de la planta no cambia por sí sola.
3. **Antes y después:** **Dado** que la planta tiene fotos de varias etapas, **cuando** abro su Pasaporte Vivo, **entonces** puedo comparar su evolución con las fotos registradas.
4. **Sin etapa documentada:** **Dado** que aún no registro ninguna observación, **cuando** veo la planta, **entonces** se indica que su etapa no está documentada.

**Tareas de implementación:**

1. Definir las etapas visuales y su correspondencia con las observaciones (3 horas).
2. Diseñar las ilustraciones de cada etapa (3 horas).
3. Codificar el cambio de etapa a partir de la observación registrada (4 horas).
4. Codificar la comparación de fotos en el Pasaporte Vivo (2 horas).
5. Probar que solo las observaciones cambian la etapa (2 horas).

> *Estado:* 🟢 El campo `observedState` de la planta guarda la etapa declarada por la persona; el sistema no identifica la especie ni la etapa automáticamente a partir de la foto. Corresponde al «espejo virtual que refleja la realidad» de la definición (p. 2). Caso del plan manual: CP-AG-14.

---

## Módulo 6 — Ciclo agrícola y Bitácora

| **Nro:** HU-017 | **Título:** Registrar actividades de cultivo | **Prioridad:** Media<br>**Estimación:** 13 horas |
|---|---|---|

**Historia de usuario:**

**Como** integrante de comunidad **quiero** registrar las actividades que realizo en mi huerto (preparación, limpieza o deshierbe, siembra, riego, abonado, aporque, replante, seguimiento y cosecha), **para** llevar la bitácora de cultivo y avanzar en mi progreso.

**Sabré que he terminado cuando se cumplan todos los criterios de aceptación:**

1. **Registro exitoso:** **Dado** que tengo un huerto registrado, **cuando** registro una actividad con tipo, fecha, responsable, destino, notas y, si lo deseo, una foto, **entonces** la actividad aparece en la Bitácora de Mi Huerto.
2. **Datos incompletos:** **Dado** que dejé vacío un dato obligatorio, **cuando** intento guardar la actividad, **entonces** se muestra el error y no se registra.
3. **Anular actividad:** **Dado** que registré una actividad por error, **cuando** la anulo, **entonces** se conserva en el historial como anulada, con su evidencia, y se revierten sus efectos.
4. **Conflicto de ocupación:** **Dado** que intento un replante hacia un espacio ocupado, **cuando** guardo, **entonces** el sistema lo rechaza y no desplaza a otra planta.
5. **Exceso de cuidados:** **Dado** que registro un riego o un abono antes de la frecuencia recomendada para la especie, **cuando** guardo, **entonces** el sistema advierte del exceso.
6. **Sin esperar revisión:** **Dado** que mi comunidad aún no ha sido revisada por el MSP, **cuando** registro una actividad, **entonces** se guarda de inmediato y queda válida.

**Tareas de implementación:**

1. Diseñar el formulario y la lista de actividades (2 horas).
2. Codificar los nueve tipos de actividad y sus datos específicos (5 horas).
3. Incluir validaciones y control de ocupación (2 horas).
4. Codificar la anulación conservando el historial (2 horas).
5. Probar cada tipo de actividad y su anulación (2 horas).

> *Estado:* 🟢 Con sesión, `POST /api/gardens/:gardenId/activities` (multipart, con foto opcional) y `POST …/:activityId/void` para anular; un identificador de reintento evita registros duplicados. El exceso de cuidados responde `CARE_OVERUSE` y la ocupación `PLOT_OCCUPIED`. La cosecha, la poscosecha, los rituales y la señalética se detallan en HU-022, HU-024, HU-025 y HU-026. Casos sugeridos: P-014; plan manual CP-AG-01 y CP-AG-02.

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

> *Estado:* 🟢 `POST /api/plants/:id/harvest` y consultas por huerto y comunidad; la cantidad se suma al almacén como recurso «Cosecha: especie». El MSP recomienda cosechar tomando solo las partes necesarias (p. 49), coherente con el rebrote. Caso del plan manual: CP-AG-05.

---

| **Nro:** HU-024 | **Título:** Registrar la poscosecha | **Prioridad:** Media<br>**Estimación:** 12 horas |
|---|---|---|

**Historia de usuario:**

**Como** integrante de comunidad **quiero** registrar la limpieza, el secado, el empaquetado y el almacenamiento de lo que coseché, **para** conservar las plantas secas en buen estado y saber de qué cosecha proviene cada lote.

**Sabré que he terminado cuando se cumplan todos los criterios de aceptación:**

1. **Etapas en orden:** **Dado** que registré una cosecha, **cuando** documento la limpieza, el inicio del secado a la sombra, el fin del secado, el empaquetado y el almacenamiento, **entonces** cada etapa queda en la Bitácora con su fecha y responsable, en ese orden.
2. **Sin cosecha previa:** **Dado** que la planta no tiene una cosecha registrada, **cuando** intento registrar una etapa de poscosecha, **entonces** el formulario bloquea la operación y explica que primero debo registrar la cosecha.
3. **Fechas incoherentes:** **Dado** que indico un fin de secado anterior a su inicio, **cuando** guardo, **entonces** el registro se rechaza sin alterar las etapas anteriores.
4. **Aviso de secado:** **Dado** que registro el secado, **cuando** consulto la etapa, **entonces** se muestra el aviso orientativo de 10 a 15 días de secado.
5. **Lote y caducidad:** **Dado** que empaqueto sin indicar lote o con una fecha de caducidad inválida, **cuando** guardo, **entonces** el registro se rechaza.
6. **Registro documental:** **Dado** que registro cualquier etapa de poscosecha, **cuando** consulto Mi Camino Verde, **entonces** esa etapa no suma puntos.

**Tareas de implementación:**

1. Diseñar el formulario de las cinco etapas (2 horas).
2. Codificar el registro de cada etapa como actividad de la Bitácora (3 horas).
3. Codificar las validaciones de orden, fechas, lote y caducidad (3 horas).
4. Mostrar el ciclo completo en la Bitácora (2 horas).
5. Probar el orden de etapas, fechas inválidas y anulación (2 horas).

> *Estado:* 🟢 Actividad de tipo `postharvest` en `POST /api/gardens/:gardenId/activities` (0 puntos base). La definición del proyecto (p. 2) pide limpieza, secado de 10 a 15 días, empaquetado con etiqueta y almacenamiento. Casos del plan manual: CP-AG-06 a CP-AG-11.

---

| **Nro:** HU-025 | **Título:** Registrar los rituales de siembra y de gratitud | **Prioridad:** Baja<br>**Estimación:** 6 horas |
|---|---|---|

**Historia de usuario:**

**Como** integrante de comunidad **quiero** registrar los rituales de siembra y de agradecimiento que realizamos en el huerto, **para** conservar la memoria de nuestras prácticas ancestrales junto al registro agrícola.

**Sabré que he terminado cuando se cumplan todos los criterios de aceptación:**

1. **Registro exitoso:** **Dado** que tengo un huerto, **cuando** registro un ritual de siembra o de gratitud con su fecha, notas y, si lo deseo, una foto, **entonces** aparece en la Bitácora identificado como ritual.
2. **Sin puntos:** **Dado** que registré un ritual, **cuando** consulto Mi Camino Verde, **entonces** el ritual no suma puntos ni avanza misiones.
3. **Datos incompletos:** **Dado** que dejé vacía la fecha, **cuando** intento guardar, **entonces** se muestra el error y no se registra.

**Tareas de implementación:**

1. Agregar los dos tipos de ritual al formulario de actividades (2 horas).
2. Codificar su registro en la Bitácora sin efecto en las recompensas (2 horas).
3. Probar el registro, la fecha obligatoria y la ausencia de puntos (2 horas).

> *Estado:* 🟢 Tipos `sowing_ritual` y `gratitude_ritual` con 0 puntos base. Corresponde a los «rituales de siembra y gratitud» de la definición del proyecto (p. 2). Caso del plan manual: CP-AG-03.

---

| **Nro:** HU-026 | **Título:** Imprimir la señalética botánica de una planta | **Prioridad:** Media<br>**Estimación:** 8 horas |
|---|---|---|

**Historia de usuario:**

**Como** responsable de comunidad **quiero** imprimir una etiqueta para cada planta con su nombre común, nombre científico, familia y cualidad tradicional, **para** señalizar el huerto real como recomienda el MSP.

**Sabré que he terminado cuando se cumplan todos los criterios de aceptación:**

1. **Etiqueta:** **Dado** que abro el Pasaporte Vivo de una planta, **cuando** elijo «Imprimir señalética», **entonces** se genera una etiqueta imprimible con nombre común, nombre científico y familia.
2. **Cualidad documentada:** **Dado** que la especie figura en el Anexo 5 de los lineamientos MSP 2017, **cuando** genero la etiqueta, **entonces** muestra su cualidad (caliente o fresca) y cita esa fuente.
3. **Cualidad sin fuente:** **Dado** que la especie no tiene una clasificación documentada, **cuando** genero la etiqueta, **entonces** se indica «No documentada», sin inventar la cualidad.
4. **Sin indicaciones médicas:** **Dado** que genero la etiqueta, **cuando** la reviso, **entonces** no contiene dosis ni recetas.
5. **Instalación:** **Dado** que coloqué la etiqueta en el huerto, **cuando** registro la actividad de señalética, **entonces** queda en la Bitácora sin sumar puntos.

**Tareas de implementación:**

1. Diseñar la etiqueta imprimible (2 horas).
2. Codificar la clasificación según el Anexo 5 del MSP (2 horas).
3. Codificar la impresión desde el Pasaporte Vivo (2 horas).
4. Probar especies con y sin clasificación (2 horas).

> *Estado:* 🟢 La etiqueta usa la clasificación de las siete especies del Anexo 5 del MSP 2017 ([lineamientos MSP aplicados](../analisis/lineamientos-msp-aplicados.md)); para las demás muestra «No documentada». El registro de instalación es la actividad `signage` (0 puntos). Caso del plan manual: CP-AG-04.

---

## Módulo 7 — Mi Camino Verde y notificaciones

| **Nro:** HU-018 | **Título:** Consultar mi progreso (Mi Camino Verde) | **Prioridad:** Media<br>**Estimación:** 12 horas |
|---|---|---|

**Historia de usuario:**

**Como** integrante de comunidad **quiero** ganar Semillas de vida, niveles e insignias por las actividades que registro, **para** sentirme motivado a cuidar mi huerto.

**Sabré que he terminado cuando se cumplan todos los criterios de aceptación:**

1. **Puntos por actividad:** **Dado** que registro una actividad válida, **cuando** consulto Mi Camino Verde, **entonces** veo los puntos correspondientes: preparación 10, limpieza 8, siembra 20, riego 5, abonado 8, aporque 8, replante 10, seguimiento 12 y cosecha 20.
2. **Niveles:** **Dado** que acumulo puntos, **cuando** alcanzo 100 o 300, **entonces** paso a nivel Oficial o Maestro respectivamente (Aprendiz desde 0).
3. **Sin duplicados:** **Dado** que registro otra actividad con el mismo tipo, fecha, destino y responsable, **cuando** se recalcula el progreso, **entonces** esa actividad suma 0 puntos.
4. **Actividad anulada:** **Dado** que anulo una actividad, **cuando** se recalcula el progreso, **entonces** sus puntos dejan de sumar.
5. **Insignias:** **Dado** que registro una siembra con foto, riego en tres fechas, seguimiento fotográfico en tres fechas o una cosecha con foto, **cuando** consulto mi progreso, **entonces** obtengo la insignia correspondiente; también obtengo «Ciclo lunar consciente» al documentar tres actividades guiadas por las recomendaciones lunares.
6. **Límite diario:** **Dado** que ya alcancé el límite diario de puntos de un tipo de actividad, **cuando** registro otra del mismo tipo ese día, **entonces** se guarda en la Bitácora pero no suma más puntos.
7. **Invalidación del MSP:** **Dado** que el MSP invalida una de mis actividades, **cuando** consulto mi progreso, **entonces** sus puntos se descuentan una sola vez y mis misiones se recalculan.

**Tareas de implementación:**

1. Definir las reglas de puntos, niveles e insignias (2 horas).
2. Codificar el cálculo de progreso a partir de los registros (4 horas).
3. Diseñar la vista Mi Camino Verde (2 horas).
4. Codificar la vista de progreso (2 horas).
5. Probar puntos, niveles, duplicados y anulaciones (2 horas).

> *Estado:* 🟢 Los puntos se acreditan en el servidor en un libro de movimientos (`GET /api/users/me/rewards`), sin duplicados por actividad; misiones e insignias también se guardan en el servidor. El ranking entre comunidades no forma parte de esta versión. Caso sugerido: P-014.

---

| **Nro:** HU-028 | **Título:** Consultar mis notificaciones | **Prioridad:** Media<br>**Estimación:** 6 horas |
|---|---|---|

**Historia de usuario:**

**Como** persona registrada **quiero** recibir avisos sobre las revisiones que el MSP hace de mis registros, **para** enterarme si debo corregir algo.

**Sabré que he terminado cuando se cumplan todos los criterios de aceptación:**

1. **Aviso de revisión:** **Dado** que el MSP comprobó, pidió corregir o invalidó una de mis actividades, **cuando** abro Notificaciones, **entonces** veo el aviso con su motivo.
2. **Contador:** **Dado** que tengo avisos sin leer, **cuando** inicio sesión, **entonces** la barra lateral muestra cuántos son.
3. **Marcar como leídas:** **Dado** que tengo avisos, **cuando** marco uno o todos como leídos, **entonces** el contador se actualiza.
4. **Limpiar:** **Dado** que tengo avisos leídos, **cuando** elijo limpiarlos, **entonces** dejan de mostrarse.

**Tareas de implementación:**

1. Diseñar la vista de notificaciones (1 hora).
2. Codificar la creación de avisos al revisar registros (2 horas).
3. Codificar la consulta, la lectura y la limpieza (2 horas).
4. Probar el contador y los cambios de estado (1 hora).

> *Estado:* 🟢 `GET /api/notifications`, `PATCH …/:id/read`, `PATCH …/read-all` y `DELETE …/read`. Las invitaciones a comunidades se responden según HU-020.

---

## Módulo 8 — Administración institucional

| **Nro:** HU-029 | **Título:** Revisar comunidades y actividades sin bloquear a las comunidades | **Prioridad:** Alta<br>**Estimación:** 16 horas |
|---|---|---|

**Historia de usuario:**

**Como** funcionario del MSP **quiero** revisar las comunidades y las actividades registradas, comprobarlas, pedir correcciones o invalidarlas, **para** asegurar que la información institucional sea confiable sin detener el trabajo de las comunidades.

**Sabré que he terminado cuando se cumplan todos los criterios de aceptación:**

1. **Trabajo sin espera:** **Dado** que una comunidad está pendiente de revisión o con correcciones solicitadas, **cuando** sus integrantes crean huertos, siembran o registran actividades, **entonces** los registros se guardan de inmediato, sin esperar la revisión del MSP.
2. **Filtrar:** **Dado** que estoy en el panel MSP, **cuando** filtro por comunidad y estado, **entonces** distingo las actividades válidas aún no auditadas de las ya comprobadas por un funcionario.
3. **Comprobar:** **Dado** que una actividad es válida, **cuando** la compruebo, **entonces** se registran mi nombre y la fecha, sin duplicar sus puntos.
4. **Pedir corrección:** **Dado** que una actividad tiene un problema, **cuando** solicito su corrección con un motivo, **entonces** sigue visible en el historial y su autor recibe el aviso.
5. **Invalidar:** **Dado** que una actividad no es válida, **cuando** la invalido con un motivo, **entonces** sus puntos se revierten una sola vez, se recalculan misiones e insignias, y la evidencia se conserva en el historial.
6. **Comunidad rechazada o suspendida:** **Dado** que rechazo o suspendo una comunidad, **cuando** sus integrantes intentan registrar nuevas actividades agrícolas, **entonces** el sistema lo impide y conserva todo su historial.
7. **Sin permiso:** **Dado** que soy un usuario común, **cuando** intento entrar al panel MSP, **entonces** el sistema rechaza el acceso.

**Tareas de implementación:**

1. Diseñar el panel MSP con filtros por comunidad y estado (3 horas).
2. Codificar la revisión de comunidades con sus cinco estados (3 horas).
3. Codificar la comprobación, corrección e invalidación de actividades (4 horas).
4. Codificar la reversión de puntos y el recálculo de misiones (3 horas).
5. Registrar cada decisión en la auditoría (1 hora).
6. Probar permisos, reversiones y comunidades rechazadas (2 horas).

> *Estado:* 🟢 `/api/admin/msp/communities` y `/api/admin/msp/activities`, con revisión en `…/:id/review`, solo para `ADMIN_MSP` y `ADMIN_TECNICO`. Las actividades nuevas quedan válidas de inmediato y la revisión es posterior ([flujo MSP no bloqueante](../analisis/flujo-msp-v1-no-bloqueante.md)). Caso del plan manual: CP-AG-15.

---

| **Nro:** HU-030 | **Título:** Publicar eventos y recursos educativos del MSP | **Prioridad:** Baja<br>**Estimación:** 10 horas |
|---|---|---|

**Historia de usuario:**

**Como** funcionario del MSP **quiero** publicar eventos institucionales y recursos educativos, **para** acompañar a las comunidades con información oficial.

**Sabré que he terminado cuando se cumplan todos los criterios de aceptación:**

1. **Publicar evento:** **Dado** que estoy en el panel MSP, **cuando** registro un evento con nombre, fecha y ámbito (nacional, provincial o cantonal), **entonces** queda publicado en la lista de eventos.
2. **Publicar recurso:** **Dado** que estoy en el panel MSP, **cuando** publico un recurso con título y tipo (guía, manual, ficha o video), **entonces** queda disponible en la lista de recursos.
3. **Eliminar:** **Dado** que un evento o recurso ya no aplica, **cuando** lo elimino, **entonces** deja de mostrarse.
4. **Sin permiso:** **Dado** que soy un usuario común, **cuando** intento publicar o eliminar, **entonces** el sistema rechaza la acción.

**Tareas de implementación:**

1. Diseñar los formularios de eventos y recursos (2 horas).
2. Codificar los servicios de eventos y recursos (4 horas).
3. Codificar las listas y la eliminación en el panel (2 horas).
4. Probar la publicación, la eliminación y los permisos (2 horas).

> *Estado:* 🟢 `/api/admin/msp/events` y `/api/admin/msp/resources` (consultar, crear y eliminar).

---

| **Nro:** HU-031 | **Título:** Administrar las cuentas institucionales | **Prioridad:** Media<br>**Estimación:** 12 horas |
|---|---|---|

**Historia de usuario:**

**Como** administrador técnico **quiero** crear las cuentas de los funcionarios del MSP, activar o desactivar usuarios y consultar la auditoría, **para** controlar quién accede a las funciones institucionales.

**Sabré que he terminado cuando se cumplan todos los criterios de aceptación:**

1. **Crear cuenta MSP:** **Dado** que soy administrador técnico, **cuando** creo una cuenta con nombre, correo y contraseña, **entonces** se registra con el rol de funcionario MSP.
2. **Correo repetido:** **Dado** que el correo ya pertenece a una cuenta, **cuando** intento crearla, **entonces** se informa que ya existe y no se duplica.
3. **Desactivar usuario:** **Dado** que desactivo una cuenta, **cuando** esa persona intenta iniciar sesión, **entonces** se le informa que su cuenta está desactivada.
4. **Auditoría:** **Dado** que se revisaron registros o se cambiaron cuentas, **cuando** consulto la auditoría, **entonces** veo quién hizo cada acción y cuándo.
5. **Sin permiso:** **Dado** que no soy administrador técnico, **cuando** intento entrar al panel técnico, **entonces** el sistema rechaza el acceso.

**Tareas de implementación:**

1. Diseñar el panel técnico de usuarios (2 horas).
2. Codificar la creación de cuentas MSP (3 horas).
3. Codificar la activación y desactivación de cuentas (2 horas).
4. Codificar la consulta de la auditoría (3 horas).
5. Probar los permisos y los correos repetidos (2 horas).

> *Estado:* 🟢 `/api/admin/technical/msp-users`, `…/users`, `…/users/:id/status` y `…/audit-logs`, solo para `ADMIN_TECNICO`. Las cuentas `admin1@mail.com` y `admin2@mail.com` se crean al cargar los datos iniciales (ver [credenciales](../CREDENCIALES-Y-ACTUALIZACION-BD.md)); la contraseña de ejemplo es solo para desarrollo.

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

> *Estado:* 🟢 Con sesión, los datos se guardan en SQLite y las fotos de plantas, actividades y comunidades en `backend/uploads/` (criterio 4). En modo visitante se aplican los criterios 1–3 con IndexedDB. Casos sugeridos: P-008, P-012, P-013; plan manual CP-AG-12 y CP-AG-13.

---

## Trazabilidad con los casos de prueba

**Casos ejecutados** ([casos v1](../casos-prueba/casos-prueba-v1.md), Santiago, 08/11/2026; [casos v2](../casos-prueba/casos-prueba-v2.md), sobre la versión entregada, 15/11/2026):

| Caso | HU relacionadas | 08/11/2026 | 15/11/2026 |
|---|---|---|---|
| P-001 Bienvenida y exploración en modo visitante | HU-004 | Aprobado | Aprobado |
| P-002 Validación de formularios de registro e inicio de sesión | HU-001, HU-002 | Aprobado | — |
| P-003 Crear comunidad | HU-005, HU-007 | Aprobado | — |
| P-004 Editar comunidad e integrantes | HU-006 | Aprobado | — |
| P-005 Provincia, cantón y parroquia | HU-008, HU-009 | Aprobado | — |
| P-006 Registrar huerto real | HU-010 | Aprobado | — |
| P-007 Editar huerto y cancelar la edición | HU-011 | Aprobado | — |
| P-008 Persistencia local al recargar | HU-019 | Aprobado | — |
| P-009 Teclado y pantalla móvil básica | Transversal | Aprobado | — |
| P-010 Cuenta, inicio y cierre de sesión con backend | HU-001, HU-002, HU-003 | Aprobado (reejecutado) | Aprobado |
| P-011 Aislamiento de datos entre dos cuentas | HU-002, HU-006, HU-007 | Aprobado (reejecutado) | Aprobado |
| P-012 Persistencia en base de datos | HU-019 | Aprobado (reejecutado) | Aprobado |
| P-013 Flujo integrado de demostración | HU-003, HU-015, HU-016, HU-019 | Aprobado (reejecutado) | Aprobado |
| P-014 Mi Huerto: catálogo, registro de planta y Pasaporte | HU-014, HU-015, HU-016, HU-017 | Aprobado | — |
| P-015 Integración final de Mi Huerto | HU-014 | Aprobado | — |
| P-016 Puntos y niveles (exploratorio) | HU-018 | Aprobado | — |
| P-017 Catálogo: búsqueda y ficha de especie | HU-012, HU-013 | Aprobado (reejecutado) | — |
| P-018 Invitar a un integrante y responder la invitación | HU-007, HU-020 | — | Aprobado |
| P-019 Almacén comunitario con control de permisos | HU-021 | — | Aprobado |
| P-020 Riego con puntos y cosecha con rebrote | HU-010, HU-015, HU-017, HU-018, HU-022 | — | Aprobado |
| P-021 Revisión MSP, reversión de puntos y notificación | HU-028, HU-029, HU-031 | — | Aprobado |

**Casos del plan manual del ciclo agrícola** ([ciclo-agricola-v2-manual.md](../casos-prueba/ciclo-agricola-v2-manual.md)):

| Caso | HU relacionadas |
|---|---|
| CP-AG-01, CP-AG-02 Siembra con método y preparación | HU-015, HU-017 |
| CP-AG-03 Rituales | HU-025 |
| CP-AG-04 Señalética | HU-026 |
| CP-AG-05 Cosecha parcial | HU-022 |
| CP-AG-06 a CP-AG-11 Poscosecha | HU-024 |
| CP-AG-12, CP-AG-13 Persistencia entre dispositivos y fotos desde el teléfono | HU-019, HU-015 |
| CP-AG-14 Etapa observada en el Espejo Digital | HU-027 |
| CP-AG-15 Acceso a fotos ajenas y revisión MSP | HU-029 |

**Sin caso ejecutado todavía:** HU-023, HU-024, HU-025, HU-026, HU-027 y HU-030. Para HU-024 a HU-027 hay casos redactados en el plan manual del ciclo agrícola.

*La matriz HU ↔ caso ↔ resultado se mantiene en [matriz-hu-pruebas.md](../casos-prueba/matriz-hu-pruebas.md) (Santiago y Leonardo). Los casos de la plantilla docente usan el identificador P-NNN.*
