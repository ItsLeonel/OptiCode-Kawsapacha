# Casos de prueba — Kawsapacha V1 (con resultados de ejecución)

**Responsable:** Santiago Guamán (`TonyTiago`) — QA · **Issues:** #5 QA-001 y #14 QA-002 · **Ejecución:** 08/11/2026
**Formato oficial:** `casos-prueba-v1.docx` (plantilla del docente, con capturas). Este archivo es la versión legible en el repositorio.

> **Resumen:** 17 casos ejecutados; 17 con estado final APROBADO. 5 casos fallaron en la primera ejecución (P-010, P-011, P-012, P-013, P-017) y se aprobaron al reejecutarlos tras corregir la causa. Los resultados detallados están en `resultados-ejecucion-v1.md`.

| ID | Título | HU | Primera ejecución | Estado final |
|---|---|---|---|---|
| P-001 | Bienvenida y exploración en modo visitante | HU-004 | APROBADO | APROBADO |
| P-002 | Validación de formularios de registro e inicio de sesión (solo interfaz) | HU-001, HU-002 | APROBADO | APROBADO |
| P-003 | Crear comunidad: validaciones y creación correcta | HU-005, HU-007 | APROBADO | APROBADO |
| P-004 | Editar comunidad, integrantes y conservación tras recarga | HU-006 | APROBADO | APROBADO |
| P-005 | Selección de provincia, cantón y parroquia coherentes | HU-008, HU-009 | APROBADO | APROBADO |
| P-006 | Registrar huerto real con todos sus datos | HU-010 | APROBADO | APROBADO |
| P-007 | Editar huerto y cancelar la edición | HU-011 | APROBADO | APROBADO |
| P-008 | Persistencia local al recargar y límite por origen | HU-019 | APROBADO | APROBADO |
| P-009 | Uso con teclado y pantalla móvil básica | Transversal (sin HU específica) | APROBADO | APROBADO |
| P-010 | Crear cuenta e iniciar/cerrar sesión con backend real | HU-001, HU-002, HU-003 | REPROBADO | APROBADO |
| P-011 | Aislamiento de datos entre dos cuentas | HU-002, HU-006, HU-007 | REPROBADO | APROBADO |
| P-012 | Persistencia en base de datos de comunidad y huerto | HU-019 | REPROBADO | APROBADO |
| P-013 | Flujo integrado de demostración (cuenta → comunidad → huerto → reingreso) | HU-003, HU-019 | REPROBADO | APROBADO |
| P-014 | Mi Jardín: catálogo, registro de planta y pasaporte (modo local) | HU-014, HU-015, HU-016, HU-017 | APROBADO | APROBADO |
| P-015 | Integración final de Mi Jardín | HU-014 | APROBADO | APROBADO |
| P-016 | Puntos y niveles locales (exploratorio, fuera del corte formal) | HU-018 | APROBADO | APROBADO |
| P-017 | Catálogo de plantas medicinales: búsqueda y ficha de especie | HU-012, HU-013 | REPROBADO | APROBADO |


---

## P-001 — Bienvenida y exploración en modo visitante

**HU:** HU-004
Requisito/Módulo: Usuarios — acceso y navegación (demo del alcance V1) · Bienvenida / Usuarios
Prioridad y tipo: Alta · Funcional
Precondiciones: Aplicación en ejecución en http://127.0.0.1:5173; perfil de navegador sin datos previos del sitio.
Datos de prueba: Ninguno.
Dependencia: Frontend local

**Descripción:** Comprobar que desde la pantalla de bienvenida se puede explorar la aplicación sin iniciar sesión y que la navegación principal responde sin errores.

**Procedimiento de prueba**
1. Abrir http://127.0.0.1:5173 y observar la pantalla de bienvenida.
2. Verificar que existen las pestañas «Crear cuenta» e «Iniciar sesión» y el botón «Descubrir Kawsapacha».
3. Pulsar «Descubrir Kawsapacha».
4. Navegar desde el menú a Comunidades, Mi terreno y Plantas medicinales.
5. Volver a Mi jardín desde cualquiera de las secciones.

**Resultados esperados:** Se ingresa a la aplicación sin autenticarse (modo visitante, sin «Sesión confirmada»). Cada sección abre sin errores ni pantallas en blanco y se puede volver a Mi jardín.

**Ejecuciones**
- **Ejecución 1 (08/11/2026, Santiago Guamán):** APROBADO — Se ejecutaron los 5 pasos del procedimiento y el comportamiento observado coincide con lo esperado: Se ingresa a la aplicación sin autenticarse (modo visitante, sin «Sesión confirmada»). Cada sección abre sin errores ni pantallas en blanco y se puede volver a Mi jardín. _(capturas: 6)_


---

## P-002 — Validación de formularios de registro e inicio de sesión (solo interfaz)

**HU:** HU-001, HU-002
Requisito/Módulo: Usuarios — registro y login · Usuarios
Prioridad y tipo: Alta · Validación negativa
Precondiciones: Pantalla de bienvenida abierta.
Datos de prueba: Nombre «A»; correo «correo-invalido»; contraseña «abc»; confirmación «xyz». Válidos ficticios: «Usuario Prueba», «prueba@example.com», «Prueba2026».
Dependencia: Frontend local

**Descripción:** Verificar los mensajes de validación de «Crear cuenta» e «Iniciar sesión». En main no hay backend: solo se prueba la interfaz y que NO se abra una sesión real.

**Procedimiento de prueba**
1. En «Crear cuenta», enviar el formulario con todos los campos vacíos.
2. Ingresar nombre «A», correo «correo-invalido», contraseña «abc» y confirmación «xyz»; enviar.
3. Ingresar datos válidos (Usuario Prueba / prueba@example.com / Prueba2026 / Prueba2026); enviar.
4. Abrir «Iniciar sesión» y enviar vacío.
5. En «Iniciar sesión» ingresar prueba@example.com y cualquier contraseña; enviar.

**Resultados esperados:** Pasos 1-2: se muestran «Escribe tu correo electrónico.», «Escribe tu contraseña.», «Confirma tu contraseña.», «Escribe tu nombre completo (al menos 2 caracteres).», «Escribe un correo válido, por ejemplo: nombre@correo.com.», «Usa al menos 8 caracteres, una letra y un número.» y «Las contraseñas deben coincidir.», según corresponda. Pasos 3 y 5: la interfaz informa que no se inició sesión (sin servicio de autenticación) y no se muestra «Sesión confirmada».

**Ejecuciones**
- **Ejecución 1 (08/11/2026, Santiago Guamán):** APROBADO — Se ejecutaron los 5 pasos del procedimiento y el comportamiento observado coincide con lo esperado: Pasos 1-2: se muestran «Escribe tu correo electrónico.», «Escribe tu contraseña.», «Confirma tu contraseña.», «Escribe tu nombre completo (al menos 2 caracteres).», «Escribe un correo válido, por ejemplo: nombre@correo.com.», «Usa al menos 8 caracteres, una letra y un número.» y «Las contraseñas deben coincidir.», según corresponda. Pasos 3 y 5: la interfaz informa que no se inició sesión (sin servicio de autenticación) y no se muestra «Sesión confirmada». _(capturas: 5)_


---

## P-003 — Crear comunidad: validaciones y creación correcta

**HU:** HU-005, HU-007
Requisito/Módulo: Comunidades — crear (nombre, responsable, contacto, ubicación) · Comunidades
Prioridad y tipo: Alta · Funcional + validación negativa
Precondiciones: Aplicación en modo visitante, sin comunidad registrada en este navegador.
Datos de prueba: Nombre «AB» (inválido) y «Huerto Prueba QA»; responsable «A» (inválido) y «Tester QA»; teléfono «123» y «+593 99 000 0000»; correo «x@» y «qa@example.com»; provincia Pichincha; tipo Familiar.
Dependencia: Frontend local

**Descripción:** Verificar el asistente «Crear mi comunidad»: obligatoriedad de provincia, límites de nombre y responsable, formato de teléfono y correo, y creación exitosa.

**Procedimiento de prueba**
1. Ir a Comunidades y pulsar «Crear mi comunidad».
2. Elegir el tipo de comunidad «Familiar» y continuar.
3. En ubicación intentar continuar sin elegir provincia; luego elegir «Pichincha».
4. En datos ingresar nombre «AB» y responsable «A»; intentar continuar.
5. Ingresar teléfono «123» y correo «x@»; intentar continuar.
6. Corregir con nombre «Huerto Prueba QA», responsable «Tester QA», teléfono «+593 99 000 0000» y correo «qa@example.com»; completar el asistente y confirmar.

**Resultados esperados:** Sin provincia no se avanza y se indica que es obligatoria. Aparecen «Escribe un nombre de entre 3 y 80 caracteres, sin contar espacios al inicio o al final.», «Escribe el nombre de la persona responsable (entre 2 y 80 caracteres).», «Escribe un teléfono válido, con 7 a 15 dígitos.» y «Escribe un correo electrónico válido.». Con datos válidos la comunidad se crea, aparece en «Nuestras comunidades» con los datos ingresados y el indicador muestra «Guardado local · Solo en este navegador».

**Ejecuciones**
- **Ejecución 1 (08/11/2026, Santiago Guamán):** APROBADO — Se ejecutaron los 6 pasos del procedimiento y el comportamiento observado coincide con lo esperado: Sin provincia no se avanza y se indica que es obligatoria. Aparecen «Escribe un nombre de entre 3 y 80 caracteres, sin contar espacios al inicio o al final.», «Escribe el nombre de la persona responsable (entre 2 y 80 caracteres).», «Escribe un teléfono válido, con 7 a 15 dígitos.» y «Escribe un correo electrónico válido.». Con datos válidos la comunidad se crea, aparece en «Nuestras comunidades» con los datos ingresados y el indicador muestra «Guardado local · Solo en este navegador». _(capturas: 5)_


---

## P-004 — Editar comunidad, integrantes y conservación tras recarga

**HU:** HU-006
Requisito/Módulo: Comunidades — editar y registrar integrantes · Comunidades
Prioridad y tipo: Alta · Funcional + persistencia
Precondiciones: Comunidad creada (resultado de P-003).
Datos de prueba: Nombre nuevo «Huerto Prueba QA 2»; integrante «Integrante Uno», nacimiento «2090-01-01» (inválida) y «1995-05-20», nivel Aprendiz; texto de 600 caracteres.
Dependencia: Frontend local

**Descripción:** Verificar la edición de la comunidad, el alta de un integrante con nivel de expertise y los límites de descripción y fecha de nacimiento.

**Procedimiento de prueba**
1. Abrir la comunidad y pulsar «Editar información».
2. Cambiar el nombre a «Huerto Prueba QA 2».
3. Pegar en «Acerca de la comunidad» un texto de 600 caracteres y observar el contador.
4. Agregar un integrante con nombre «Integrante Uno» y fecha de nacimiento «2090-01-01»; intentar guardar.
5. Corregir la fecha a «1995-05-20», nivel «Aprendiz», y guardar.
6. Recargar la página (F5) y revisar los datos.

**Resultados esperados:** La descripción se limita a 500 caracteres (contador «500 de 500 caracteres»). La fecha futura muestra «Indica una fecha válida entre 1900 y hoy.». Tras guardar y recargar se conservan el nombre nuevo, el integrante y su nivel.

**Ejecuciones**
- **Ejecución 1 (08/11/2026, Santiago Guamán):** APROBADO — Se ejecutaron los 6 pasos del procedimiento y el comportamiento observado coincide con lo esperado: La descripción se limita a 500 caracteres (contador «500 de 500 caracteres»). La fecha futura muestra «Indica una fecha válida entre 1900 y hoy.». Tras guardar y recargar se conservan el nombre nuevo, el integrante y su nivel. _(capturas: 5)_


---

## P-005 — Selección de provincia, cantón y parroquia coherentes

**HU:** HU-008, HU-009
Requisito/Módulo: Huertos reales — ubicación geográfica (provincia, parroquia) · Huertos reales / Comunidades
Prioridad y tipo: Alta · Funcional
Precondiciones: Formulario de ubicación abierto (Mi terreno o paso de territorio de comunidad).
Datos de prueba: Provincias Azuay y Guayas.
Dependencia: Frontend local

**Descripción:** Verificar que cantón y parroquia dependen de la provincia elegida y que el escenario regional corresponde a ella.

**Procedimiento de prueba**
1. Elegir la provincia «Azuay» y abrir la lista de cantones.
2. Elegir un cantón y luego una parroquia de ese cantón.
3. Cambiar la provincia a «Guayas».
4. Revisar la lista de cantones y el valor de cantón/parroquia previamente elegidos.
5. Probar la alternativa accesible al mapa (selector de provincia) con teclado.

**Resultados esperados:** Los cantones listados pertenecen únicamente a la provincia elegida y las parroquias al cantón elegido. Al cambiar de provincia no queda un cantón o parroquia de otra provincia. El escenario regional corresponde a la provincia (Azuay → Sierra, Guayas → Costa). El selector funciona con teclado.

**Ejecuciones**
- **Ejecución 1 (08/11/2026, Santiago Guamán):** APROBADO — Se ejecutaron los 5 pasos del procedimiento y el comportamiento observado coincide con lo esperado: Los cantones listados pertenecen únicamente a la provincia elegida y las parroquias al cantón elegido. Al cambiar de provincia no queda un cantón o parroquia de otra provincia. El escenario regional corresponde a la provincia (Azuay → Sierra, Guayas → Costa). El selector funciona con teclado. _(capturas: 3)_


---

## P-006 — Registrar huerto real con todos sus datos

**HU:** HU-010
Requisito/Módulo: Huertos reales — creación (tipo, ubicación, características) · Huertos reales
Prioridad y tipo: Alta · Funcional
Precondiciones: Comunidad creada (P-003). Imagen JPG o PNG de prueba menor a 3 MB.
Datos de prueba: Nombre «Huerto QA Sierra»; tipo «En tierra»; Pichincha; referencia «Calle ficticia s/n»; superficie «25»; riego «Disponible todo el año»; suelo «Arcilloso»; diseño Surcos; cerca Vivas; agua Río o acequia; riego Goteo; abono Compost.
Dependencia: Frontend local

**Descripción:** Registrar un huerto real completo en «Mi terreno» y comprobar que el resumen refleja lo ingresado.

**Procedimiento de prueba**
1. Ir a «Mi terreno».
2. Ingresar el nombre y elegir el tipo «En tierra».
3. Elegir provincia, cantón y parroquia; marcar una posición en el mapa (opcional) y escribir la referencia.
4. Ingresar superficie «25», riego «Disponible todo el año» y suelo «Arcilloso».
5. Marcar las características: Surcos, Vivas, Río o acequia, Goteo y Compost.
6. Adjuntar la fotografía del terreno y pulsar «Guardar mi terreno».

**Resultados esperados:** El huerto queda registrado y el resumen muestra nombre, tipo, ubicación, «25 m²», riego, suelo y características elegidas. El escenario de Mi jardín refleja la modalidad «En tierra» y el indicador muestra «Guardado local · Solo en este navegador».

**Ejecuciones**
- **Ejecución 1 (08/11/2026, Santiago Guamán):** APROBADO — Se ejecutaron los 6 pasos del procedimiento y el comportamiento observado coincide con lo esperado: El huerto queda registrado y el resumen muestra nombre, tipo, ubicación, «25 m²», riego, suelo y características elegidas. El escenario de Mi jardín refleja la modalidad «En tierra» y el indicador muestra «Guardado local · Solo en este navegador». _(capturas: 11)_


---

## P-007 — Editar huerto y cancelar la edición

**HU:** HU-011
Requisito/Módulo: Huertos reales — edición · Huertos reales
Prioridad y tipo: Alta · Funcional
Precondiciones: Huerto registrado (P-006).
Datos de prueba: Nombre temporal «Huerto Cancelado»; superficie nueva «40».
Dependencia: Frontend local

**Descripción:** Verificar que «Cancelar edición» no aplica cambios y que «Guardar» sí los conserva.

**Procedimiento de prueba**
1. Pulsar «Editar mi terreno».
2. Cambiar el nombre a «Huerto Cancelado» y pulsar «Cancelar edición».
3. Revisar el nombre mostrado en el resumen.
4. Pulsar de nuevo «Editar mi terreno», cambiar la superficie a «40» y guardar.
5. Revisar el resumen.

**Resultados esperados:** Tras cancelar, el huerto conserva su nombre original «Huerto QA Sierra». Tras guardar, el resumen muestra «40 m²» y el resto de datos sin cambios.

**Ejecuciones**
- **Ejecución 1 (08/11/2026, Santiago Guamán):** APROBADO — Se ejecutaron los 5 pasos del procedimiento y el comportamiento observado coincide con lo esperado: Tras cancelar, el huerto conserva su nombre original «Huerto QA Sierra». Tras guardar, el resumen muestra «40 m²» y el resto de datos sin cambios. _(capturas: 5)_


---

## P-008 — Persistencia local al recargar y límite por origen

**HU:** HU-019
Requisito/Módulo: Huertos reales / Comunidades — conservación de datos · Persistencia (IndexedDB)
Prioridad y tipo: Alta · Persistencia
Precondiciones: Comunidad y huerto registrados (P-003 y P-006) en http://127.0.0.1:5173.
Datos de prueba: Los registrados en P-003 y P-006.
Dependencia: Frontend local

**Descripción:** Comprobar que comunidad y huerto sobreviven a recargas en el mismo origen y que otro origen no los comparte (limitación documentada del producto, no defecto).

**Procedimiento de prueba**
1. Recargar la página (F5) y revisar Mi terreno.
2. Cerrar la pestaña, abrirla otra vez en la misma URL y revisar.
3. Abrir http://localhost:5173 (host distinto, otro origen) y revisar Mi terreno.

**Resultados esperados:** En el mismo origen se conservan comunidad, huerto y fotografía tras recargar y reabrir. En otro origen no aparecen los datos (IndexedDB es por origen); se anota como limitación del alcance local.

**Ejecuciones**
- **Ejecución 1 (08/11/2026, Santiago Guamán):** APROBADO — Se ejecutaron los 3 pasos del procedimiento y el comportamiento observado coincide con lo esperado: En el mismo origen se conservan comunidad, huerto y fotografía tras recargar y reabrir. En otro origen no aparecen los datos (IndexedDB es por origen); se anota como limitación del alcance local. _(capturas: 2)_


---

## P-009 — Uso con teclado y pantalla móvil básica

**HU:** Transversal (sin HU específica)
Requisito/Módulo: UI — usabilidad básica · Accesibilidad / UI
Prioridad y tipo: Media · Accesibilidad básica
Precondiciones: Aplicación abierta.
Datos de prueba: Ancho de ventana 375 px (herramientas de desarrollo).
Dependencia: Frontend local

**Descripción:** Verificar navegación con teclado, foco visible y adaptación a ancho móvil sin solapamientos importantes.

**Procedimiento de prueba**
1. Recorrer bienvenida y el formulario «Crear cuenta» solo con Tab, Shift+Tab, Enter y Espacio.
2. Recorrer el asistente de comunidad y el formulario de Mi terreno solo con teclado.
3. Reducir el ancho a 375 px y repetir bienvenida, Comunidades y Mi terreno.
4. Buscar textos cortados, botones superpuestos o desplazamiento horizontal.

**Resultados esperados:** Todos los controles son alcanzables con teclado, con foco visible, y los formularios se pueden enviar. A 375 px el contenido se adapta sin solapamientos importantes ni desplazamiento horizontal.

**Ejecuciones**
- **Ejecución 1 (08/11/2026, Santiago Guamán):** APROBADO — Se ejecutaron los 4 pasos del procedimiento y el comportamiento observado coincide con lo esperado: Todos los controles son alcanzables con teclado, con foco visible, y los formularios se pueden enviar. A 375 px el contenido se adapta sin solapamientos importantes ni desplazamiento horizontal. _(capturas: 4)_


---

## P-010 — Crear cuenta e iniciar/cerrar sesión con backend real

**HU:** HU-001, HU-002, HU-003
Requisito/Módulo: Usuarios — registro, login, logout · Usuarios
Prioridad y tipo: Alta · Integración
Precondiciones: Backend desplegado/accesible, SHA y URL de la API confirmados por Ronny; sin cuentas previas con los correos de prueba.
Datos de prueba: Cuentas ficticias: qa1@example.com / Prueba2026 y qa2@example.com / Prueba2026.
Dependencia: Backend integrado (Ronny)

**Descripción:** Verificar autenticación real contra la API: registro, login, logout, contraseña incorrecta y correo duplicado. Se ejecuta solo cuando Ronny entregue el backend integrado y accesible.

**Procedimiento de prueba**
1. Crear la cuenta qa1@example.com con datos válidos.
2. Cerrar sesión e iniciar sesión con las mismas credenciales.
3. Iniciar sesión con contraseña incorrecta.
4. Intentar crear otra cuenta con el correo qa1@example.com.
5. Cerrar sesión y verificar que las pantallas protegidas dejan de ser accesibles.

**Resultados esperados:** El registro y el login abren una sesión real («Sesión confirmada»). La contraseña incorrecta y el correo duplicado se rechazan con mensaje claro y sin sesión. Al cerrar sesión se pierde el acceso a datos de cuenta.

**Ejecuciones**
- **Ejecución 1 (08/11/2026, Santiago Guamán):** REPROBADO — No ingresa al sistema ya que aun no esta conectado a una base de datos _(capturas: 2)_
- **Ejecución 2 (08/11/2026, Santiago Guamán):** APROBADO — Reejecución tras aplicar las migraciones y el seed de la base de datos (npx prisma migrate dev y npm run prisma:seed). Se repitieron los 5 pasos y el comportamiento observado coincide con lo esperado: El registro y el login abren una sesión real («Sesión confirmada»). La contraseña incorrecta y el correo duplicado se rechazan con mensaje claro y sin sesión. Al cerrar sesión se pierde el acceso a datos de cuenta. _(capturas: 4)_


---

## P-011 — Aislamiento de datos entre dos cuentas

**HU:** HU-002, HU-006, HU-007
Requisito/Módulo: Usuarios — roles y permisos · Usuarios / Comunidades
Prioridad y tipo: Alta · Integración (permisos)
Precondiciones: P-010 disponible; dos cuentas ficticias con una comunidad cada una.
Datos de prueba: Cuentas qa1 y qa2; comunidades «Comunidad QA1» y «Comunidad QA2».
Dependencia: Backend integrado (Ronny)

**Descripción:** Comprobar que una cuenta no ve ni modifica comunidades ni huertos de otra cuenta.

**Procedimiento de prueba**
1. Con qa1 crear «Comunidad QA1» y su huerto.
2. Cerrar sesión; con qa2 crear «Comunidad QA2».
3. Con qa2 listar comunidades y huertos.
4. Con qa2 intentar abrir o editar los recursos de qa1 (por la interfaz y, si es posible, por el identificador en la URL/API).

**Resultados esperados:** qa2 solo ve y edita sus propios datos. El acceso a recursos de qa1 se rechaza (permiso denegado o no encontrado) sin exponer información.

**Ejecuciones**
- **Ejecución 1 (08/11/2026, Santiago Guamán):** REPROBADO — Únicamente se puede ingresar sin iniciar sesión a las comunidades y huertos _(capturas: 1)_
- **Ejecución 2 (08/11/2026, Santiago Guamán):** APROBADO — Se puede crear comunidades desde las dos cuentas y qa2 solo puede ver su comunidad _(capturas: 3)_


---

## P-012 — Persistencia en base de datos de comunidad y huerto

**HU:** HU-019
Requisito/Módulo: Comunidades y Huertos reales — persistencia central · Comunidades / Huertos reales
Prioridad y tipo: Alta · Integración (persistencia)
Precondiciones: P-010 disponible; cuenta ficticia con sesión abierta.
Datos de prueba: Comunidad y huerto con datos de P-003 y P-006.
Dependencia: Backend integrado (Ronny)

**Descripción:** Verificar que comunidad y huerto se guardan en la base (SQLite) y sobreviven al cierre de sesión y recarga.

**Procedimiento de prueba**
1. Crear comunidad y huerto con la cuenta de prueba.
2. Editar la superficie del huerto y guardar.
3. Cerrar sesión, recargar e iniciar sesión de nuevo.
4. Revisar comunidad y huerto y contrastar con la respuesta de la API/BD.

**Resultados esperados:** Los datos persisten tras cerrar sesión y recargar, coinciden con lo registrado en la API/BD y se asocian a la cuenta.

**Ejecuciones**
- **Ejecución 1 (08/11/2026, Santiago Guamán):** REPROBADO — Los datos no persisten luego de recargar la pagina _(capturas: 4)_
- **Ejecución 2 (08/11/2026, Santiago Guamán):** APROBADO — Reejecución tras aplicar las migraciones y el seed de la base de datos. Se repitieron los 4 pasos y el comportamiento observado coincide con lo esperado: Los datos persisten tras cerrar sesión y recargar, coinciden con lo registrado en la API/BD y se asocian a la cuenta. _(capturas: 3)_


---

## P-013 — Flujo integrado de demostración (cuenta → comunidad → huerto → reingreso)

**HU:** HU-003, HU-019
Requisito/Módulo: Demostración propuesta del alcance V1 · Integración V1
Prioridad y tipo: Alta · Integración (extremo a extremo)
Precondiciones: Backend y frontend integrados en el commit congelado para la demo.
Datos de prueba: Cuenta ficticia nueva y datos de P-003/P-006.
Dependencia: Backend integrado (Ronny)

**Descripción:** Recorrer el flujo crítico de la demostración del 10/11 de punta a punta.

**Procedimiento de prueba**
1. Crear cuenta e iniciar sesión.
2. Crear comunidad.
3. Registrar huerto con provincia elegida en el mapa.
4. Explorar el catálogo y registrar una planta con foto en la parcela.
5. Cerrar sesión, iniciar sesión y revisar que todo persiste.

**Resultados esperados:** Todo el recorrido se completa sin errores y los datos creados reaparecen al reingresar.

**Ejecuciones**
- **Ejecución 1 (08/11/2026, Santiago Guamán):** REPROBADO — Se produce un error al intentar recuperar los datos guardados _(capturas: 2)_
- **Ejecución 2 (08/11/2026, Santiago Guamán):** APROBADO — Reejecución tras aplicar las migraciones y el seed de la base de datos. Se repitieron los 5 pasos y el comportamiento observado coincide con lo esperado: Todo el recorrido se completa sin errores y los datos creados reaparecen al reingresar. _(capturas: 1)_


---

## P-014 — Mi Jardín: catálogo, registro de planta y pasaporte (modo local)

**HU:** HU-014, HU-015, HU-016, HU-017
Requisito/Módulo: Plantas medicinales y huerto virtual — registrar planta y abrir pasaporte · Huerto virtual / Plantas medicinales
Prioridad y tipo: Media · Funcional (exploratorio)
Precondiciones: Comunidad y huerto registrados (P-003 y P-006). Imagen JPG/PNG/WebP de prueba menor a 3 MB.
Datos de prueba: Búsqueda «zzz» (sin resultados) y una especie existente; responsable «Tester QA».
Dependencia: Jardín en diseño (Leonel) — exploración local

**Descripción:** Explorar con la versión actual el registro de una planta desde el catálogo, su aparición en la parcela y el Pasaporte Vivo. NO es aceptación final: se repite sobre la versión definitiva.

**Procedimiento de prueba**
1. Abrir «Plantas medicinales» y escribir «zzz» en «Buscar plantas».
2. Buscar el nombre de una especie visible en la lista y pulsar «Registrar en mi huerto».
3. Elegir espacio, adjuntar fotografía, indicar responsable y pulsar «Registrar planta en ese espacio».
4. Observar la parcela de Mi jardín y abrir el Pasaporte de la planta.
5. Pulsar «Registrar actividad agrícola» y registrar un riego.

**Resultados esperados:** La búsqueda sin coincidencias muestra «No se encontraron especies con ese nombre.». La planta registrada aparece en el espacio elegido con su foto y su pasaporte abre con los datos ingresados. La actividad queda en el historial.

**Ejecuciones**
- **Ejecución 1 (08/11/2026, Santiago Guamán):** APROBADO — Se ejecutaron los 5 pasos del procedimiento y el comportamiento observado coincide con lo esperado: La búsqueda sin coincidencias muestra «No se encontraron especies con ese nombre.». La planta registrada aparece en el espacio elegido con su foto y su pasaporte abre con los datos ingresados. La actividad queda en el historial. _(capturas: 4)_


---

## P-015 — Integración final de Mi Jardín

**HU:** HU-014
Requisito/Módulo: Huerto virtual — versión final de V1 · Huerto virtual
Prioridad y tipo: Media · Integración
Precondiciones: Leonel anuncia diseño estable; commit de la versión final identificado.
Datos de prueba: Los de P-014.
Dependencia: Diseño final e integración (Leonel/Ronny)

**Descripción:** Repetir los casos de Mi Jardín sobre la versión aprobada e integrada. Si no se integra para el 10/11, se declara «BLOQUEADO / fuera del corte» en el informe; no se marca aprobado.

**Procedimiento de prueba**
1. Abrir el escenario y las parcelas de la versión final.
2. Registrar planta con foto, abrir pasaporte y registrar actividad.
3. Verificar que el registro de huerto sigue enlazando el escenario correcto.
4. Cerrar y reabrir la aplicación y comprobar el estado.

**Resultados esperados:** La versión final cumple lo esperado en P-014 y conserva los registros. Se documentan las diferencias respecto a la exploración previa.

**Ejecuciones**
- **Ejecución 1 (08/11/2026, Santiago Guamán):** APROBADO — Se ejecutaron los 4 pasos del procedimiento y el comportamiento observado coincide con lo esperado: La versión final cumple lo esperado en P-014 y conserva los registros. Se documentan las diferencias respecto a la exploración previa. _(capturas: 2)_


---

## P-016 — Puntos y niveles locales (exploratorio, fuera del corte formal)

**HU:** HU-018
Requisito/Módulo: Fuera del corte V1 según alcance (niveles, insignias y ranking son incrementos posteriores) · Gamificación local
Prioridad y tipo: Baja · Funcional (exploratorio)
Precondiciones: Huerto registrado y al menos una planta registrada.
Datos de prueba: Siembra 20 pts; riego 5 pts; niveles Aprendiz 0, Oficial 100, Maestro 300 (según README del frontend).
Dependencia: Jardín en diseño (Leonel) — exploración local

**Descripción:** Verificar que los puntos locales siguen lo documentado en el README del frontend. Es exploración: no abrir defectos sin consultar al PM porque gamificación está fuera del corte formal de V1.

**Procedimiento de prueba**
1. Registrar una actividad de siembra con foto y revisar «Mi camino verde».
2. Registrar un riego y revisar el puntaje.
3. Registrar otro riego con la misma fecha, destino y responsable.
4. Anular el último riego y revisar el puntaje.

**Resultados esperados:** La siembra suma 20 y el riego 5. El riego repetido (misma fecha, destino y responsable) no suma de nuevo. Al anular una actividad esta deja de sumar. El nivel mostrado corresponde al puntaje (Aprendiz desde 0).

**Ejecuciones**
- **Ejecución 1 (08/11/2026, Santiago Guamán):** APROBADO — Se ejecutaron los 4 pasos del procedimiento y el comportamiento observado coincide con lo esperado: La siembra suma 20 y el riego 5. El riego repetido (misma fecha, destino y responsable) no suma de nuevo. Al anular una actividad esta deja de sumar. El nivel mostrado corresponde al puntaje (Aprendiz desde 0). _(capturas: 2)_


---

## P-017 — Catálogo de plantas medicinales: búsqueda y ficha de especie

**HU:** HU-012, HU-013
Requisito/Módulo: Plantas medicinales — catálogo inicial con fichas y fotografías con fuentes · Plantas medicinales
Prioridad y tipo: Alta · Funcional
Precondiciones: Aplicación abierta en «Plantas medicinales».
Datos de prueba: Texto de búsqueda de una especie visible y otro inexistente («zzz»).
Dependencia: Frontend local

**Descripción:** Verificar el catálogo inicial contra el alcance V1 (fichas y fotografías con fuentes). Según el código revisado, la tarjeta muestra nombre, nombre científico e ícono: contrastar al ejecutar con lo que pide el alcance (caso agregado al catálogo inicial).

**Procedimiento de prueba**
1. Abrir «Plantas medicinales» y revisar la lista de especies.
2. Para una especie, revisar qué datos muestra (nombre común, nombre científico, familia, usos, fotografía, fuente).
3. Buscar por nombre una especie existente.
4. Buscar «zzz».
5. Buscar con mayúsculas/minúsculas distintas del nombre de una especie.

**Resultados esperados:** El catálogo lista las especies y la búsqueda filtra sin distinguir mayúsculas. Cada especie presenta ficha con los datos del alcance (nombre común y científico, usos medicinales, fotografía con fuente); lo que falte se registra como observación o defecto según lo que confirme el PM. Sin coincidencias se muestra «No se encontraron especies con ese nombre.».

**Ejecuciones**
- **Ejecución 1 (08/11/2026, Santiago Guamán):** REPROBADO — Únicamente muestra los nombres científicos nada mas de información _(capturas: 1)_
- **Ejecución 2 (08/11/2026, Santiago Guamán):** APROBADO — Reejecución tras actualizar el repositorio a la última versión de main. Se repitieron los 5 pasos y el comportamiento observado coincide con lo esperado: El catálogo lista las especies y la búsqueda filtra sin distinguir mayúsculas. Cada especie presenta ficha con los datos del alcance (nombre común y científico, usos medicinales, fotografía con fuente); lo que falte se registra como observación o defecto según lo que confirme el PM. Sin coincidencias se muestra «No se encontraron especies con ese nombre.».
