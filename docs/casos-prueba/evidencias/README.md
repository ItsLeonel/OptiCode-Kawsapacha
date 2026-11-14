# Evidencias de pruebas

Guardar aquí las capturas y videos reales de cada ejecución. Nombre: `P-XXX-descripcion-AAAA-MM-DD.png` (por ejemplo `P-003-comunidad-creacion-2026-11-08.png`).

**Antes de subir:** ocultar contraseñas, tokens, correos personales y ubicaciones exactas; usar solo datos ficticios. Si una captura muestra la pestaña de red o la base de datos, tapar los datos sensibles.

Las capturas de este documento corresponden al documento de Casos de Prueba de la versión 1 (casos P-001 a P-017). El nombre de cada imagen indica el caso, una descripción corta, la ejecución (`e1` primera ejecución, `e2` reejecución), el número de captura y la fecha.

## Resumen

| Caso | Título | Ejecuciones | Resultado final | Capturas |
|---|---|---|---|---|
| P-001 | Bienvenida y exploración en modo visitante | 1 | Aprobado | 6 |
| P-002 | Validación de formularios de registro e inicio de sesión (solo interfaz) | 1 | Aprobado | 5 |
| P-003 | Crear comunidad: validaciones y creación correcta | 1 | Aprobado | 5 |
| P-004 | Editar comunidad, integrantes y conservación tras recarga | 1 | Aprobado | 5 |
| P-005 | Selección de provincia, cantón y parroquia coherentes | 1 | Aprobado | 3 |
| P-006 | Registrar huerto real con todos sus datos | 1 | Aprobado | 11 |
| P-007 | Editar huerto y cancelar la edición | 1 | Aprobado | 5 |
| P-008 | Persistencia local al recargar y límite por origen | 1 | Aprobado | 2 |
| P-009 | Uso con teclado y pantalla móvil básica | 1 | Aprobado | 4 |
| P-010 | Crear cuenta e iniciar/cerrar sesión con backend real | 2 | Aprobado | 6 |
| P-011 | Aislamiento de datos entre dos cuentas | 2 | Aprobado | 4 |
| P-012 | Persistencia en base de datos de comunidad y huerto | 2 | Aprobado | 7 |
| P-013 | Flujo integrado de demostración (cuenta → comunidad → huerto → reingreso) | 2 | Aprobado | 3 |
| P-014 | Mi Jardín: catálogo, registro de planta y pasaporte (modo local) | 1 | Aprobado | 4 |
| P-015 | Integración final de Mi Jardín | 1 | Aprobado | 2 |
| P-016 | Puntos y niveles locales (exploratorio, fuera del corte formal) | 1 | Aprobado | 2 |
| P-017 | Catálogo de plantas medicinales: búsqueda y ficha de especie | 2 | Aprobado | 2 |

Total: 17 casos, 76 capturas.

## Detalle por caso

### P-001 – Bienvenida y exploración en modo visitante

**Ejecución 1** · Fecha: 08/11/2026 · Responsable: Santiago Guamán · Resultado: **Aprobado**

Resultado obtenido: Se ejecutaron los 5 pasos del procedimiento y el comportamiento observado coincide con lo esperado: Se ingresa a la aplicación sin autenticarse (modo visitante, sin «Sesión confirmada»). Cada sección abre sin errores ni pantallas en blanco y se puede volver a Mi jardín.

![P-001 ejecución 1, captura 1](P-001-bienvenida-modo-visitante-e1-01-2026-11-08.png)

![P-001 ejecución 1, captura 2](P-001-bienvenida-modo-visitante-e1-02-2026-11-08.png)

![P-001 ejecución 1, captura 3](P-001-bienvenida-modo-visitante-e1-03-2026-11-08.png)

![P-001 ejecución 1, captura 4](P-001-bienvenida-modo-visitante-e1-04-2026-11-08.png)

![P-001 ejecución 1, captura 5](P-001-bienvenida-modo-visitante-e1-05-2026-11-08.png)

![P-001 ejecución 1, captura 6](P-001-bienvenida-modo-visitante-e1-06-2026-11-08.png)

### P-002 – Validación de formularios de registro e inicio de sesión (solo interfaz)

**Ejecución 1** · Fecha: 08/11/2026 · Responsable: Santiago Guamán · Resultado: **Aprobado**

Resultado obtenido: Se ejecutaron los 5 pasos del procedimiento y el comportamiento observado coincide con lo esperado: Pasos 1-2: se muestran «Escribe tu correo electrónico.», «Escribe tu contraseña.», «Confirma tu contraseña.», «Escribe tu nombre completo (al menos 2 caracteres).», «Escribe un correo válido, por ejemplo: nombre@correo.com.», «Usa al menos 8 caracteres, una letra y un número.» y «Las contraseñas deben coincidir.», según corresponda. Pasos 3 y 5: la interfaz informa que no se inició sesión (sin servicio de autenticación) y no se muestra «Sesión confirmada».

![P-002 ejecución 1, captura 1](P-002-validacion-formularios-acceso-e1-01-2026-11-08.png)

![P-002 ejecución 1, captura 2](P-002-validacion-formularios-acceso-e1-02-2026-11-08.png)

![P-002 ejecución 1, captura 3](P-002-validacion-formularios-acceso-e1-03-2026-11-08.png)

![P-002 ejecución 1, captura 4](P-002-validacion-formularios-acceso-e1-04-2026-11-08.png)

![P-002 ejecución 1, captura 5](P-002-validacion-formularios-acceso-e1-05-2026-11-08.png)

### P-003 – Crear comunidad: validaciones y creación correcta

**Ejecución 1** · Fecha: 08/11/2026 · Responsable: Santiago Guamán · Resultado: **Aprobado**

Resultado obtenido: Se ejecutaron los 6 pasos del procedimiento y el comportamiento observado coincide con lo esperado: Sin provincia no se avanza y se indica que es obligatoria. Aparecen «Escribe un nombre de entre 3 y 80 caracteres, sin contar espacios al inicio o al final.», «Escribe el nombre de la persona responsable (entre 2 y 80 caracteres).», «Escribe un teléfono válido, con 7 a 15 dígitos.» y «Escribe un correo electrónico válido.». Con datos válidos la comunidad se crea, aparece en «Nuestras comunidades» con los datos ingresados y el indicador muestra «Guardado local · Solo en este navegador».

![P-003 ejecución 1, captura 1](P-003-crear-comunidad-e1-01-2026-11-08.png)

![P-003 ejecución 1, captura 2](P-003-crear-comunidad-e1-02-2026-11-08.png)

![P-003 ejecución 1, captura 3](P-003-crear-comunidad-e1-03-2026-11-08.png)

![P-003 ejecución 1, captura 4](P-003-crear-comunidad-e1-04-2026-11-08.png)

![P-003 ejecución 1, captura 5](P-003-crear-comunidad-e1-05-2026-11-08.png)

### P-004 – Editar comunidad, integrantes y conservación tras recarga

**Ejecución 1** · Fecha: 08/11/2026 · Responsable: Santiago Guamán · Resultado: **Aprobado**

Resultado obtenido: Se ejecutaron los 6 pasos del procedimiento y el comportamiento observado coincide con lo esperado: La descripción se limita a 500 caracteres (contador «500 de 500 caracteres»). La fecha futura muestra «Indica una fecha válida entre 1900 y hoy.». Tras guardar y recargar se conservan el nombre nuevo, el integrante y su nivel.

![P-004 ejecución 1, captura 1](P-004-editar-comunidad-e1-01-2026-11-08.png)

![P-004 ejecución 1, captura 2](P-004-editar-comunidad-e1-02-2026-11-08.png)

![P-004 ejecución 1, captura 3](P-004-editar-comunidad-e1-03-2026-11-08.png)

![P-004 ejecución 1, captura 4](P-004-editar-comunidad-e1-04-2026-11-08.png)

![P-004 ejecución 1, captura 5](P-004-editar-comunidad-e1-05-2026-11-08.png)

### P-005 – Selección de provincia, cantón y parroquia coherentes

**Ejecución 1** · Fecha: 08/11/2026 · Responsable: Santiago Guamán · Resultado: **Aprobado**

Resultado obtenido: Se ejecutaron los 5 pasos del procedimiento y el comportamiento observado coincide con lo esperado: Los cantones listados pertenecen únicamente a la provincia elegida y las parroquias al cantón elegido. Al cambiar de provincia no queda un cantón o parroquia de otra provincia. El escenario regional corresponde a la provincia (Azuay → Sierra, Guayas → Costa). El selector funciona con teclado.

![P-005 ejecución 1, captura 1](P-005-provincia-canton-parroquia-e1-01-2026-11-08.png)

![P-005 ejecución 1, captura 2](P-005-provincia-canton-parroquia-e1-02-2026-11-08.png)

![P-005 ejecución 1, captura 3](P-005-provincia-canton-parroquia-e1-03-2026-11-08.png)

### P-006 – Registrar huerto real con todos sus datos

**Ejecución 1** · Fecha: 08/11/2026 · Responsable: Santiago Guamán · Resultado: **Aprobado**

Resultado obtenido: Se ejecutaron los 6 pasos del procedimiento y el comportamiento observado coincide con lo esperado: El huerto queda registrado y el resumen muestra nombre, tipo, ubicación, «25 m²», riego, suelo y características elegidas. El escenario de Mi jardín refleja la modalidad «En tierra» y el indicador muestra «Guardado local · Solo en este navegador».

![P-006 ejecución 1, captura 1](P-006-registrar-huerto-e1-01-2026-11-08.png)

![P-006 ejecución 1, captura 2](P-006-registrar-huerto-e1-02-2026-11-08.png)

![P-006 ejecución 1, captura 3](P-006-registrar-huerto-e1-03-2026-11-08.png)

![P-006 ejecución 1, captura 4](P-006-registrar-huerto-e1-04-2026-11-08.png)

![P-006 ejecución 1, captura 5](P-006-registrar-huerto-e1-05-2026-11-08.png)

![P-006 ejecución 1, captura 6](P-006-registrar-huerto-e1-06-2026-11-08.png)

![P-006 ejecución 1, captura 7](P-006-registrar-huerto-e1-07-2026-11-08.png)

![P-006 ejecución 1, captura 8](P-006-registrar-huerto-e1-08-2026-11-08.png)

![P-006 ejecución 1, captura 9](P-006-registrar-huerto-e1-09-2026-11-08.png)

![P-006 ejecución 1, captura 10](P-006-registrar-huerto-e1-10-2026-11-08.png)

![P-006 ejecución 1, captura 11](P-006-registrar-huerto-e1-11-2026-11-08.png)

### P-007 – Editar huerto y cancelar la edición

**Ejecución 1** · Fecha: 08/11/2026 · Responsable: Santiago Guamán · Resultado: **Aprobado**

Resultado obtenido: Se ejecutaron los 5 pasos del procedimiento y el comportamiento observado coincide con lo esperado: Tras cancelar, el huerto conserva su nombre original «Huerto QA Sierra». Tras guardar, el resumen muestra «40 m²» y el resto de datos sin cambios.

![P-007 ejecución 1, captura 1](P-007-editar-huerto-e1-01-2026-11-08.png)

![P-007 ejecución 1, captura 2](P-007-editar-huerto-e1-02-2026-11-08.png)

![P-007 ejecución 1, captura 3](P-007-editar-huerto-e1-03-2026-11-08.png)

![P-007 ejecución 1, captura 4](P-007-editar-huerto-e1-04-2026-11-08.png)

![P-007 ejecución 1, captura 5](P-007-editar-huerto-e1-05-2026-11-08.png)

### P-008 – Persistencia local al recargar y límite por origen

**Ejecución 1** · Fecha: 08/11/2026 · Responsable: Santiago Guamán · Resultado: **Aprobado**

Resultado obtenido: Se ejecutaron los 3 pasos del procedimiento y el comportamiento observado coincide con lo esperado: En el mismo origen se conservan comunidad, huerto y fotografía tras recargar y reabrir. En otro origen no aparecen los datos (IndexedDB es por origen); se anota como limitación del alcance local.

![P-008 ejecución 1, captura 1](P-008-persistencia-local-e1-01-2026-11-08.png)

![P-008 ejecución 1, captura 2](P-008-persistencia-local-e1-02-2026-11-08.png)

### P-009 – Uso con teclado y pantalla móvil básica

**Ejecución 1** · Fecha: 08/11/2026 · Responsable: Santiago Guamán · Resultado: **Aprobado**

Resultado obtenido: Se ejecutaron los 4 pasos del procedimiento y el comportamiento observado coincide con lo esperado: Todos los controles son alcanzables con teclado, con foco visible, y los formularios se pueden enviar. A 375 px el contenido se adapta sin solapamientos importantes ni desplazamiento horizontal.

![P-009 ejecución 1, captura 1](P-009-teclado-movil-e1-01-2026-11-08.png)

![P-009 ejecución 1, captura 2](P-009-teclado-movil-e1-02-2026-11-08.png)

![P-009 ejecución 1, captura 3](P-009-teclado-movil-e1-03-2026-11-08.png)

![P-009 ejecución 1, captura 4](P-009-teclado-movil-e1-04-2026-11-08.png)

### P-010 – Crear cuenta e iniciar/cerrar sesión con backend real

**Ejecución 1** · Fecha: 08/11/2026 · Responsable: Santiago Guamán · Resultado: **Reprobado**

Resultado obtenido: No ingresa al sistema ya que aun no esta conectado a una base de datos

![P-010 ejecución 1, captura 1](P-010-cuenta-sesion-backend-e1-01-2026-11-08.png)

![P-010 ejecución 1, captura 2](P-010-cuenta-sesion-backend-e1-02-2026-11-08.png)

**Ejecución 2** · Fecha: 08/11/2026 · Responsable: Santiago Guamán · Resultado: **Aprobado**

Resultado obtenido: Reejecución tras aplicar las migraciones y el seed de la base de datos (npx prisma migrate dev y npm run prisma:seed). Se repitieron los 5 pasos y el comportamiento observado coincide con lo esperado: El registro y el login abren una sesión real («Sesión confirmada»). La contraseña incorrecta y el correo duplicado se rechazan con mensaje claro y sin sesión. Al cerrar sesión se pierde el acceso a datos de cuenta.

![P-010 ejecución 2, captura 1](P-010-cuenta-sesion-backend-e2-01-2026-11-08.png)

![P-010 ejecución 2, captura 2](P-010-cuenta-sesion-backend-e2-02-2026-11-08.png)

![P-010 ejecución 2, captura 3](P-010-cuenta-sesion-backend-e2-03-2026-11-08.png)

![P-010 ejecución 2, captura 4](P-010-cuenta-sesion-backend-e2-04-2026-11-08.png)

### P-011 – Aislamiento de datos entre dos cuentas

**Ejecución 1** · Fecha: 08/11/2026 · Responsable: Santiago Guamán · Resultado: **Reprobado**

Resultado obtenido: Únicamente se puede ingresar sin iniciar sesión a las comunidades y huertos

![P-011 ejecución 1, captura 1](P-011-aislamiento-cuentas-e1-01-2026-11-08.png)

**Ejecución 2** · Fecha: 08/11/2026 · Responsable: Santiago Guamán · Resultado: **Aprobado**

Resultado obtenido: Se puede crear comunidades desde las dos cuentas y qa2 solo puede ver su comunidad

![P-011 ejecución 2, captura 1](P-011-aislamiento-cuentas-e2-01-2026-11-08.png)

![P-011 ejecución 2, captura 2](P-011-aislamiento-cuentas-e2-02-2026-11-08.png)

![P-011 ejecución 2, captura 3](P-011-aislamiento-cuentas-e2-03-2026-11-08.png)

### P-012 – Persistencia en base de datos de comunidad y huerto

**Ejecución 1** · Fecha: 08/11/2026 · Responsable: Santiago Guamán · Resultado: **Reprobado**

Resultado obtenido: Los datos no persisten luego de recargar la pagina

![P-012 ejecución 1, captura 1](P-012-persistencia-base-datos-e1-01-2026-11-08.png)

![P-012 ejecución 1, captura 2](P-012-persistencia-base-datos-e1-02-2026-11-08.png)

![P-012 ejecución 1, captura 3](P-012-persistencia-base-datos-e1-03-2026-11-08.png)

![P-012 ejecución 1, captura 4](P-012-persistencia-base-datos-e1-04-2026-11-08.png)

**Ejecución 2** · Fecha: 08/11/2026 · Responsable: Santiago Guamán · Resultado: **Aprobado**

Resultado obtenido: Reejecución tras aplicar las migraciones y el seed de la base de datos. Se repitieron los 4 pasos y el comportamiento observado coincide con lo esperado: Los datos persisten tras cerrar sesión y recargar, coinciden con lo registrado en la API/BD y se asocian a la cuenta.

![P-012 ejecución 2, captura 1](P-012-persistencia-base-datos-e2-01-2026-11-08.png)

![P-012 ejecución 2, captura 2](P-012-persistencia-base-datos-e2-02-2026-11-08.png)

![P-012 ejecución 2, captura 3](P-012-persistencia-base-datos-e2-03-2026-11-08.png)

### P-013 – Flujo integrado de demostración (cuenta → comunidad → huerto → reingreso)

**Ejecución 1** · Fecha: 08/11/2026 · Responsable: Santiago Guamán · Resultado: **Reprobado**

Resultado obtenido: Se produce un error al intentar recuperar los datos guardados

![P-013 ejecución 1, captura 1](P-013-flujo-demostracion-e1-01-2026-11-08.png)

![P-013 ejecución 1, captura 2](P-013-flujo-demostracion-e1-02-2026-11-08.png)

**Ejecución 2** · Fecha: 08/11/2026 · Responsable: Santiago Guamán · Resultado: **Aprobado**

Resultado obtenido: Reejecución tras aplicar las migraciones y el seed de la base de datos. Se repitieron los 5 pasos y el comportamiento observado coincide con lo esperado: Todo el recorrido se completa sin errores y los datos creados reaparecen al reingresar.

![P-013 ejecución 2, captura 1](P-013-flujo-demostracion-e2-01-2026-11-08.png)

### P-014 – Mi Jardín: catálogo, registro de planta y pasaporte (modo local)

**Ejecución 1** · Fecha: 08/11/2026 · Responsable: Santiago Guamán · Resultado: **Aprobado**

Resultado obtenido: Se ejecutaron los 5 pasos del procedimiento y el comportamiento observado coincide con lo esperado: La búsqueda sin coincidencias muestra «No se encontraron especies con ese nombre.». La planta registrada aparece en el espacio elegido con su foto y su pasaporte abre con los datos ingresados. La actividad queda en el historial.

![P-014 ejecución 1, captura 1](P-014-mi-jardin-pasaporte-e1-01-2026-11-08.png)

![P-014 ejecución 1, captura 2](P-014-mi-jardin-pasaporte-e1-02-2026-11-08.png)

![P-014 ejecución 1, captura 3](P-014-mi-jardin-pasaporte-e1-03-2026-11-08.png)

![P-014 ejecución 1, captura 4](P-014-mi-jardin-pasaporte-e1-04-2026-11-08.png)

### P-015 – Integración final de Mi Jardín

**Ejecución 1** · Fecha: 08/11/2026 · Responsable: Santiago Guamán · Resultado: **Aprobado**

Resultado obtenido: Se ejecutaron los 4 pasos del procedimiento y el comportamiento observado coincide con lo esperado: La versión final cumple lo esperado en P-014 y conserva los registros. Se documentan las diferencias respecto a la exploración previa.

![P-015 ejecución 1, captura 1](P-015-integracion-mi-jardin-e1-01-2026-11-08.png)

![P-015 ejecución 1, captura 2](P-015-integracion-mi-jardin-e1-02-2026-11-08.png)

### P-016 – Puntos y niveles locales (exploratorio, fuera del corte formal)

**Ejecución 1** · Fecha: 08/11/2026 · Responsable: Santiago Guamán · Resultado: **Aprobado**

Resultado obtenido: Se ejecutaron los 4 pasos del procedimiento y el comportamiento observado coincide con lo esperado: La siembra suma 20 y el riego 5. El riego repetido (misma fecha, destino y responsable) no suma de nuevo. Al anular una actividad esta deja de sumar. El nivel mostrado corresponde al puntaje (Aprendiz desde 0).

![P-016 ejecución 1, captura 1](P-016-puntos-niveles-e1-01-2026-11-08.png)

![P-016 ejecución 1, captura 2](P-016-puntos-niveles-e1-02-2026-11-08.png)

### P-017 – Catálogo de plantas medicinales: búsqueda y ficha de especie

**Ejecución 1** · Fecha: 08/11/2026 · Responsable: Santiago Guamán · Resultado: **Reprobado**

Resultado obtenido: Únicamente muestra los nombres científicos nada mas de información

![P-017 ejecución 1, captura 1](P-017-catalogo-plantas-e1-01-2026-11-08.png)

**Ejecución 2** · Fecha: 08/11/2026 · Responsable: Santiago Guamán · Resultado: **Aprobado**

Resultado obtenido: Reejecución tras actualizar el repositorio a la última versión de main. Se repitieron los 5 pasos y el comportamiento observado coincide con lo esperado: El catálogo lista las especies y la búsqueda filtra sin distinguir mayúsculas. Cada especie presenta ficha con los datos del alcance (nombre común y científico, usos medicinales, fotografía con fuente); lo que falte se registra como observación o defecto según lo que confirme el PM. Sin coincidencias se muestra «No se encontraron especies con ese nombre.».

![P-017 ejecución 2, captura 1](P-017-catalogo-plantas-e2-01-2026-11-08.png)
