# Casos de prueba — reejecución sobre la versión entregada (15/11/2026)

**Responsable de esta ejecución:** Leonardo Lugmaña, con asistencia de Claude · **Issue:** #15 DOC-002 · **Diseño original de los casos P-001 a P-017:** Santiago Guamán ([casos-prueba-v1.md](casos-prueba-v1.md))

> Este documento **no modifica** los resultados del 08/11 de Santiago. Agrega una ejecución nueva, fechada, sobre la versión que se entrega, y cuatro casos nuevos (P-018 a P-021) para historias que no tenían caso ejecutado.

## Entorno

| Elemento | Valor |
|---|---|
| Versión probada | `main` en el commit `661ad6b` |
| Fecha y hora | 15/11/2026, 20:40–20:42 (hora de Ecuador) |
| Sistema y navegador | Windows 11; Chromium de Playwright 1.64.1 a 1440 × 1000 |
| Backend | `http://localhost:3000`, base SQLite **temporal** creada desde cero (`prisma migrate deploy` + `prisma:seed`); no se usaron datos reales |
| Frontend | `http://127.0.0.1:5173` (Vite) con el backend real |
| Datos de prueba | Cuentas ficticias `qa.*@example.com`, contraseña `Prueba2026`; administrador técnico `admin1@mail.com` del seed |

## Método

Los pasos de cada caso se ejecutaron de forma **automatizada**, sin intervención manual durante la corrida:

- **Casos de interfaz** (P-001, P-010 a P-013): un navegador controlado por Playwright hace los mismos clics y escrituras que haría una persona y toma las capturas. Script: [ui-cases.spec.ts](scripts-v2/ui-cases.spec.ts).
- **Casos de integración** (P-018 a P-021): llamadas a la API real con cuentas distintas para comprobar permisos y reglas del servidor. Script: [api-cases.mjs](scripts-v2/api-cases.mjs).

Antes de la corrida oficial se ajustaron los scripts (no la aplicación) cuando fallaban por motivos del propio script: un selector con un título antiguo, la espera a que termine la carga tras iniciar sesión, y el texto «Parcela 2» del Pasaporte. La corrida oficial se hizo después, sobre una base nueva, y sus resultados en bruto están en [resultado-ui-2026-11-15.json](scripts-v2/resultado-ui-2026-11-15.json) y [resultado-api-2026-11-15.json](scripts-v2/resultado-api-2026-11-15.json).

## Resumen

| Caso | Título | HU | Resultado |
|---|---|---|---|
| P-001 | Bienvenida y exploración en modo visitante | HU-004 | Aprobado |
| P-010 | Crear cuenta e iniciar/cerrar sesión con backend real | HU-001, HU-002, HU-003 | Aprobado |
| P-011 | Aislamiento de datos entre dos cuentas | HU-002, HU-006, HU-007 | Aprobado |
| P-012 | Persistencia en base de datos | HU-019 | Aprobado |
| P-013 | Flujo integrado de demostración | HU-003, HU-015, HU-016, HU-019 | Aprobado |

| P-018 | Invitar a un integrante y responder la invitación | HU-007, HU-020 | Aprobado |
| P-019 | Gestionar el almacén comunitario con control de permisos | HU-021 | Aprobado |
| P-020 | Registrar riego con puntos y cosechar con rebrote | HU-010, HU-015, HU-017, HU-018, HU-022 | Aprobado |
| P-021 | Revisión MSP posterior, reversión de puntos y notificación | HU-028, HU-029, HU-031 | Aprobado |

**Resultado:** 9 casos ejecutados, 9 aprobados, 0 reprobados. Se registraron dos hallazgos que no impiden los casos (ver al final).

---

## P-001 — Bienvenida y exploración en modo visitante

**HU:** HU-004

**Descripción:** Comprobar que desde la bienvenida se puede explorar sin iniciar sesión y que la navegación principal responde sin errores.

**Procedimiento de prueba**
1. Abrir la aplicación y verificar las pestañas «Crear cuenta» e «Iniciar sesión».
2. Pulsar «Descubrir Kawsapacha».
3. Abrir Comunidad, Mi terreno, Catálogo medicinal, Bitácora y Mi Camino Verde.
4. Volver a Mi Huerto.

**Resultados esperados:** Se ingresa como visitante («Visitante · Sin sesión»); cada sección abre sin errores y se puede volver a Mi Huerto.

**Ejecuciones**
- **Ejecución 2 (15/11/2026, Leonardo Lugmaña):** APROBADO — Se mostraron las dos pestañas; tras «Descubrir Kawsapacha» apareció «Visitante · Sin sesión». Comunidad, Mi terreno, el «Catálogo de plantas medicinales», la Bitácora y Mi Camino Verde abrieron, y se volvió a Mi Huerto. No hubo errores de JavaScript en la página. _(capturas: 4)_

**Capturas:** [P-001-1-bienvenida](evidencias/P-001-1-bienvenida-2026-11-15.jpg) · [P-001-2-comunidad-visitante](evidencias/P-001-2-comunidad-visitante-2026-11-15.jpg) · [P-001-3-catalogo-visitante](evidencias/P-001-3-catalogo-visitante-2026-11-15.jpg) · [P-001-4-mi-huerto-visitante](evidencias/P-001-4-mi-huerto-visitante-2026-11-15.jpg)

---

## P-010 — Crear cuenta e iniciar/cerrar sesión con backend real

**HU:** HU-001, HU-002, HU-003

**Descripción:** Verificar la autenticación real contra la API: registro, cierre e inicio de sesión, contraseña incorrecta y correo duplicado.

**Procedimiento de prueba**
1. Crear una cuenta con datos válidos.
2. Cerrar sesión.
3. Iniciar sesión con una contraseña incorrecta.
4. Iniciar sesión con la contraseña correcta y cerrar sesión.
5. Intentar crear otra cuenta con el mismo correo.

**Resultados esperados:** El registro abre sesión; la contraseña incorrecta se rechaza con «Correo o contraseña incorrectos»; el correo duplicado se rechaza sin abrir sesión.

**Ejecuciones**
- **Ejecución 3 (15/11/2026, Leonardo Lugmaña):** APROBADO — El registro abrió la sesión (botón «Cerrar sesión» visible). La contraseña incorrecta mostró «Correo o contraseña incorrectos». El inicio correcto abrió sesión. El registro repetido mostró «Ya existe una cuenta…» y no abrió sesión. _(capturas: 3)_

**Capturas:** [P-010-1-cuenta-creada-sesion](evidencias/P-010-1-cuenta-creada-sesion-2026-11-15.jpg) · [P-010-2-contrasena-incorrecta](evidencias/P-010-2-contrasena-incorrecta-2026-11-15.jpg) · [P-010-3-correo-duplicado](evidencias/P-010-3-correo-duplicado-2026-11-15.jpg)

---

## P-011 — Aislamiento de datos entre dos cuentas

**HU:** HU-002, HU-006, HU-007

**Descripción:** Comprobar que una cuenta no ve la comunidad creada por otra.

**Procedimiento de prueba**
1. Ana crea una cuenta y una comunidad.
2. Ana cierra sesión.
3. Bruno crea una cuenta en otro navegador y abre Comunidad.

**Resultados esperados:** Bruno no ve la comunidad de Ana.

**Ejecuciones**
- **Ejecución 3 (15/11/2026, Leonardo Lugmaña):** APROBADO — La comunidad de Ana se creó; en la sesión de Bruno, la vista Comunidad no mostró el nombre de esa comunidad. _(capturas: 1)_

**Capturas:** [P-011-1-otra-cuenta-sin-datos-ajenos](evidencias/P-011-1-otra-cuenta-sin-datos-ajenos-2026-11-15.jpg)

---

## P-012 — Persistencia en base de datos

**HU:** HU-019

**Descripción:** Comprobar que los datos de una cuenta se recuperan desde el servidor en un navegador sin datos locales.

**Procedimiento de prueba**
1. Ana inicia sesión en un navegador nuevo, sin datos guardados.
2. Abre Comunidad.

**Resultados esperados:** La comunidad creada por Ana aparece, recuperada desde el servidor.

**Ejecuciones**
- **Ejecución 3 (15/11/2026, Leonardo Lugmaña):** APROBADO — En un contexto de navegador nuevo, tras iniciar sesión, la comunidad de Ana apareció en la vista Comunidad. _(capturas: 1)_

**Capturas:** [P-012-1-comunidad-recuperada-otro-navegador](evidencias/P-012-1-comunidad-recuperada-otro-navegador-2026-11-15.jpg)

---

## P-013 — Flujo integrado de demostración

**HU:** HU-003, HU-015, HU-016, HU-019

**Descripción:** Recorrer cuenta → comunidad → terreno → planta con foto → Pasaporte Vivo → cierre e inicio de sesión.

**Procedimiento de prueba**
1. Crear cuenta y comunidad.
2. Registrar el terreno (en tierra, suelo franco, 20 m²).
3. Elegir el espacio 2, adjuntar una foto desde la galería, elegir Manzanilla y guardar.
4. Abrir el Pasaporte Vivo desde el espacio.
5. Cerrar sesión, iniciar sesión en otro navegador y abrir el mismo espacio.

**Resultados esperados:** La planta aparece en su espacio con su foto; el Pasaporte muestra especie y parcela; tras reingresar en otro navegador la planta sigue ahí.

**Ejecuciones**
- **Ejecución 3 (15/11/2026, Leonardo Lugmaña):** APROBADO — Se mostró «1 planta registrada» y la manzanilla en el espacio 2. El Pasaporte abrió con «Manzanilla», «Matricaria chamomilla», «Parcela 2» y la foto. Tras cerrar sesión e ingresar en otro navegador, el mismo espacio abrió el mismo Pasaporte. _(capturas: 3)_

**Capturas:** [P-013-1-planta-en-su-espacio](evidencias/P-013-1-planta-en-su-espacio-2026-11-15.jpg) · [P-013-2-pasaporte-planta-registrada](evidencias/P-013-2-pasaporte-planta-registrada-2026-11-15.jpg) · [P-013-3-planta-recuperada-tras-reingreso](evidencias/P-013-3-planta-recuperada-tras-reingreso-2026-11-15.jpg)

---

## P-018 — Invitar a un integrante y responder la invitación

**HU:** HU-007, HU-020

**Descripción:** Comprobar que la Responsable invita por correo, que la persona invitada acepta una sola vez y que solo la Responsable puede invitar.

**Procedimiento de prueba**
1. Invitar un correo no registrado.
2. Una persona ajena intenta invitar.
3. La Responsable invita a Bruno como Participante.
4. Bruno consulta sus invitaciones.
5. Bruno acepta la invitación.
6. Bruno intenta aceptarla otra vez.
7. La lista de integrantes incluye a Bruno.

**Resultados esperados:** Los rechazos responden con error y sin crear datos; la invitación válida se acepta una sola vez y Bruno queda como Participante.

**Ejecuciones**
- **Ejecución 1 (15/11/2026, Leonardo Lugmaña):** APROBADO — Se ejecutaron los 7 pasos; 7 coincidieron con lo esperado. Detalle por paso en la tabla. _(capturas: 0)_

**Detalle por paso** (respuesta real de la API):

| # | Paso | Esperado | Obtenido | Resultado |
|---|---|---|---|---|
| 1 | Invitar un correo no registrado | Rechazo sin crear invitación | HTTP 404 USER_NOT_FOUND | Aprobado |
| 2 | Una persona ajena intenta invitar | Rechazo por permisos (403) | HTTP 403 FORBIDDEN | Aprobado |
| 3 | La Responsable invita a Bruno como Participante | Invitación creada | HTTP 201 «Invitación enviada exitosamente.» | Aprobado |
| 4 | Bruno consulta sus invitaciones | La invitación aparece pendiente | HTTP 200 «Invitaciones pendientes.»; invitación PENDING | Aprobado |
| 5 | Bruno acepta la invitación | Pasa a ser integrante | HTTP 200 «Invitación aceptada exitosamente.» | Aprobado |
| 6 | Bruno intenta aceptarla otra vez | Se informa que ya fue procesada | HTTP 400 BAD_REQUEST | Aprobado |
| 7 | La lista de integrantes incluye a Bruno | Bruno figura como Participante | HTTP 200 «Miembros de la comunidad.»; PARTICIPANTE | Aprobado |

---

## P-019 — Gestionar el almacén comunitario con control de permisos

**HU:** HU-021

**Descripción:** Comprobar que la Responsable registra, modifica y elimina recursos de la bodega y que un Participante no puede hacerlo.

**Procedimiento de prueba**
1. La Responsable registra una herramienta.
2. Un Participante intenta registrar un recurso.
3. La Responsable cambia estado y cantidad.
4. Un Participante intenta eliminar el recurso.
5. La Responsable elimina el recurso.

**Resultados esperados:** La Responsable gestiona el inventario; el Participante recibe un rechazo por permisos.

**Ejecuciones**
- **Ejecución 1 (15/11/2026, Leonardo Lugmaña):** APROBADO — Se ejecutaron los 5 pasos; 5 coincidieron con lo esperado. Detalle por paso en la tabla. _(capturas: 0)_

**Detalle por paso** (respuesta real de la API):

| # | Paso | Esperado | Obtenido | Resultado |
|---|---|---|---|---|
| 1 | La Responsable registra una herramienta | Recurso creado en el inventario | HTTP 201 «Recurso creado.» | Aprobado |
| 2 | Un Participante intenta registrar un recurso | Rechazo por permisos (403) | HTTP 403 FORBIDDEN | Aprobado |
| 3 | La Responsable cambia estado y cantidad | Inventario refleja MANTENIMIENTO y 1 | HTTP 200 «Recurso actualizado.»; MANTENIMIENTO / 1 | Aprobado |
| 4 | Un Participante intenta eliminar el recurso | Rechazo por permisos (403) | HTTP 403 FORBIDDEN | Aprobado |
| 5 | La Responsable elimina el recurso | Deja de mostrarse en el inventario | HTTP 200 «Recurso eliminado.»; ya no está en la lista | Aprobado |

---

## P-020 — Registrar riego con puntos y cosechar con rebrote

**HU:** HU-010, HU-015, HU-017, HU-018, HU-022

**Descripción:** Comprobar el registro de huerto, planta y riego sin esperar la revisión del MSP, los puntos del riego sin duplicados, y la cosecha con rebrote y suma al almacén.

**Procedimiento de prueba**
1. Registrar el huerto en tierra con suelo gredoso.
2. Registrar una manzanilla con foto en el espacio 1, con la comunidad aún sin revisión MSP.
3. Registrar un riego de la planta.
4. Consultar Mi Camino Verde.
5. Reenviar el mismo riego (mismo identificador de reintento).
6. Cosechar la manzanilla.
7. Consultar la planta tras la cosecha.
8. Revisar el almacén.

**Resultados esperados:** Todo se guarda de inmediato; el riego suma 5 puntos una vez; la planta cosechada sigue en su espacio en rebrote y la cosecha aparece en el almacén.

**Ejecuciones**
- **Ejecución 1 (15/11/2026, Leonardo Lugmaña):** APROBADO — Se ejecutaron los 8 pasos; 8 coincidieron con lo esperado. Detalle por paso en la tabla. _(capturas: 0)_

**Detalle por paso** (respuesta real de la API):

| # | Paso | Esperado | Obtenido | Resultado |
|---|---|---|---|---|
| 1 | Registrar el huerto en tierra con suelo gredoso | Huerto creado con suelo gredoso | HTTP 201 «Huerto registrado exitosamente.»; suelo heavyClay | Aprobado |
| 2 | Registrar una manzanilla con foto en el espacio 1, con la comunidad aún sin revisión MSP | Planta guardada de inmediato | HTTP 201 «Planta registrada en el huerto virtual.»; comunidad PENDING | Aprobado |
| 3 | Registrar un riego de la planta | Actividad guardada y válida (APPROVED) | HTTP 201 «Actividad registrada exitosamente en la Bitácora Viva.»; estado APPROVED | Aprobado |
| 4 | Consultar Mi Camino Verde | El riego suma 5 puntos | antes 20, después 25 | Aprobado |
| 5 | Reenviar el mismo riego (mismo identificador de reintento) | No se duplica la actividad ni los puntos | HTTP 200 «Actividad ya registrada previamente (idempotencia).»; puntos 25 | Aprobado |
| 6 | Cosechar la manzanilla | Cosecha registrada | HTTP 201 «Cosecha registrada.» | Aprobado |
| 7 | Consultar la planta tras la cosecha | Sigue en su espacio (rebrote) | estado REGROWING, espacio 0 | Aprobado |
| 8 | Revisar el almacén | Aparece «Cosecha: Manzanilla» | aparece | Aprobado |

---

## P-021 — Revisión MSP posterior, reversión de puntos y notificación

**HU:** HU-028, HU-029, HU-031

**Descripción:** Comprobar que el administrador técnico crea cuentas MSP, que la funcionaria MSP invalida una actividad ya válida con reversión única de puntos, que la autora recibe el aviso y que la decisión queda auditada.

**Procedimiento de prueba**
1. Iniciar sesión como administrador técnico.
2. Crear una cuenta de funcionario MSP.
3. Crear otra cuenta con el mismo correo.
4. Una usuaria común intenta abrir el panel MSP.
5. La funcionaria MSP lista las actividades.
6. Invalidar el riego con un motivo.
7. Consultar los puntos de Ana.
8. Repetir la invalidación.
9. Ana abre sus notificaciones.
10. Marcar todas como leídas.
11. Consultar la auditoría como administrador técnico.

**Resultados esperados:** Solo los roles institucionales acceden; la invalidación descuenta los puntos una vez, genera la notificación con el motivo y queda en la auditoría.

**Ejecuciones**
- **Ejecución 1 (15/11/2026, Leonardo Lugmaña):** APROBADO — Se ejecutaron los 11 pasos; 11 coincidieron con lo esperado. Detalle por paso en la tabla. _(capturas: 0)_

**Detalle por paso** (respuesta real de la API):

| # | Paso | Esperado | Obtenido | Resultado |
|---|---|---|---|---|
| 1 | Iniciar sesión como administrador técnico | Sesión con rol ADMIN_TECNICO | HTTP 200 «Sesión iniciada correctamente.»; rol ADMIN_TECNICO | Aprobado |
| 2 | Crear una cuenta de funcionario MSP | Cuenta creada | HTTP 201 «Cuenta de funcionario ADMIN_MSP aprovisionada exitosamente.» | Aprobado |
| 3 | Crear otra cuenta con el mismo correo | Se rechaza (409) | HTTP 409 EMAIL_IN_USE | Aprobado |
| 4 | Una usuaria común intenta abrir el panel MSP | Rechazo por permisos (403) | HTTP 403 FORBIDDEN | Aprobado |
| 5 | La funcionaria MSP lista las actividades | Aparece el riego registrado | HTTP 200 «Bandeja de actividades para supervisión MSP.»; aparece | Aprobado |
| 6 | Invalidar el riego con un motivo | Actividad invalidada | HTTP 200 «Actividad evaluada con ajuste de puntos exitosamente.» | Aprobado |
| 7 | Consultar los puntos de Ana | Se descuentan los 5 puntos una sola vez | antes 25, después 20 | Aprobado |
| 8 | Repetir la invalidación | No se descuenta dos veces | HTTP 200 «Actividad evaluada con ajuste de puntos exitosamente.»; puntos 20 | Aprobado |
| 9 | Ana abre sus notificaciones | Aviso de actividad invalidada con el motivo | HTTP 200 «Notificaciones obtenidas correctamente.»; aviso presente, con motivo | Aprobado |
| 10 | Marcar todas como leídas | No quedan avisos sin leer | HTTP 200 «Todas las notificaciones marcadas como leídas.»; todas leídas | Aprobado |
| 11 | Consultar la auditoría como administrador técnico | La invalidación figura en la auditoría | HTTP 200 «Registros de auditoría obtenidos correctamente.»; figura | Aprobado |

---

## Hallazgos de esta ejecución

No impiden ningún caso, pero conviene corregirlos.

| Id | Severidad | Hallazgo | Evidencia | Sugerencia |
|---|---|---|---|---|
| H-01 | Media | La fecha de siembra se muestra en hora UTC. Una planta registrada el 15/11/2026 a las 20:40 (hora de Ecuador) aparece con «Siembra: 16/11/2026» en el Pasaporte Vivo, mientras su foto figura el 15/11/2026. Coincide con la observación UX-104 de Dylan. | [P-013-3](evidencias/P-013-3-planta-recuperada-tras-reingreso-2026-11-15.jpg) | Guardar y mostrar la fecha de siembra con la zona horaria local. |
| H-02 | Baja | La respuesta de `GET /api/plants/:id/passport` incluye `photoPath`, la ruta interna del servidor donde se guarda la foto. | Respuesta de la API durante la preparación | No devolver rutas internas del servidor; basta con `photoUrl`. |

## Cobertura después de esta ejecución

- **Con caso ejecutado sobre la versión entregada:** HU-001 a HU-004, HU-007, HU-010, HU-015 a HU-022, HU-028, HU-029 y HU-031.
- **Con caso ejecutado solo el 08/11:** HU-005, HU-006, HU-008, HU-009 y HU-011 a HU-014 (casos P-002 a P-009, P-014 a P-017 de Santiago).
- **Sin caso ejecutado:** HU-023 (calendario lunar), HU-024 (poscosecha), HU-025 (rituales), HU-026 (señalética), HU-027 (Espejo Digital) y HU-030 (eventos y recursos MSP). Para HU-024 a HU-027 existen casos redactados en [ciclo-agricola-v2-manual.md](ciclo-agricola-v2-manual.md).

## Cómo repetir esta ejecución

1. Copiar `ui-cases.spec.ts` y `playwright.qa.config.ts` en `frontend/qa-v1/`.
2. Levantar el backend con una base nueva (`npx prisma migrate deploy`, `npm run prisma:seed`, `npm run dev`) y el frontend (`npm run dev`).
3. Desde `frontend/`: `npx playwright test -c qa-v1/playwright.qa.config.ts`.
4. Desde la raíz: `node docs/casos-prueba/scripts-v2/api-cases.mjs frontend/src/features/real-gardens/assets/en-tierra-v1.jpg resultado.json`.
