# Entrega UI/UX V1 — Kawsapacha

> **Actualización de recorrido real — 15/11/2026.** Este documento distingue ahora **tres estados** que antes se mezclaban. No se deben presentar como equivalentes.

> **Estado 1 — Línea base histórica (09/11/2026).** Las 12 imágenes de la raíz
> `docs/diseno/evidencias-diseno/` y las mediciones de las secciones 3.5–3.9 originales provienen de la
> revisión local antigua (autoría Dylan). Se conservan como historia; **no** describen el `main` actual
> ni el PR #74.
>
> **Estado 2 — `main` actual (verificado el 15/11/2026).** Frontend de `origin/main`
> (`750082c`; local `419bd6d`). Se capturó el recorrido completo del usuario en
> `docs/diseno/evidencias-diseno/main/` (35 imágenes) y los paneles administrativos en
> `docs/diseno/evidencias-diseno/msp/` (11 imágenes, **implementado, no presentado**). La auditoría
> responsive cubrió 320/360/390/430/768/1440 px. Ver el manifiesto
> [`evidencias-diseno/LEEME.md`](evidencias-diseno/LEEME.md).
>
> **Estado 3 — Rama en QA, PR #74 (no fusionada).** Rama `fix/responsive-mobile-garden`
> (`6d7750a`), base común `3f3547b` con `origin/main`, 22 commits por delante y 30 por detrás. Se capturó
> el mismo recorrido clave en `docs/diseno/evidencias-diseno/rama-qa-pr74/` (16 imágenes) sobre el
> servidor `5174`. **No es `main`.** El PR está en borrador; sus pruebas Playwright verdes no equivalen a
> aprobación estética ni a prueba en dispositivo real.

> **Alcance de la actualización:** se conserva la autoría y el análisis de Dylan; se añade el recorrido
> real, la comparación `main` ↔ PR #74 y los hallazgos P0/P1/P2 medidos. Pruebas automáticas verdes del
> PR #74 **no** equivalen a revisión UX física.

### Pendientes para convertir esta entrega histórica en evidencia del producto actual
- [x] Recorrer `main` y capturar bienvenida/login, comunidad, Mi terreno, catálogo, jardín, registro de planta/foto, Pasaporte y Bitácora. Fecha, navegador, resolución y SHA registrados en `evidencias-diseno/LEEME.md`.
- [x] Comparar con el [PR #74](https://github.com/ItsLeonel/OptiCode-Kawsapacha/pull/74) en 320, 360, 390, 430 y 768 px (más 1440). Diferencias medidas y marcadas como **corregido en la rama**, **verificado manualmente** o **pendiente** en 3.6.
- [ ] Revisar las **cuatro regiones y cuatro modalidades** (16 configuraciones) con capturas o matriz de revisión visual. Matriz de estado añadida en `propuesta-jardin-v1.md` §5.4.1; **la revisión visual de las 16 combinaciones sigue pendiente** (solo se recorrió Costa/En tierra).
- [ ] Revisar los estados visuales de Comunidad, pero **foro, eventos, experiencias y ranking de comunidades** son desarrollo pendiente de Santiago en [#48](https://github.com/ItsLeonel/OptiCode-Kawsapacha/issues/48); no dibujarlos como funcionalidades finales ni crear pantallas ficticias.
- [ ] Verificar si Figma/prototipo enlazado sigue siendo accesible y representa el producto actual. Etiquetar pantallas distintas como maquetas, no capturas de ejecución.
- [ ] Entregar a Leonardo ([#15](https://github.com/ItsLeonel/OptiCode-Kawsapacha/issues/15)) guía visual, capturas reales y decisiones UI/UX verificadas; registrar hallazgos P0/P1/P2 con captura y pasos. La prueba de despliegue real HTTPS corresponde a Santiago [#75](https://github.com/ItsLeonel/OptiCode-Kawsapacha/issues/75).
- [ ] **Confirmar con el PM (Leonel) si los paneles administrativos (`#admin-tecnico`, `#admin-msp`) entran en la presentación V1.** Están implementados y funcionan; se documentan como *implementado, no presentado*.
- [ ] **Confirmar el alcance móvil real:** todas las capturas móviles son emulación de viewport en Chromium headless (`390 × 844`). **No se probó en teléfono físico.**



**Issue:** [UI-002 #32](https://github.com/ItsLeonel/OptiCode-Kawsapacha/issues/32)

**Responsable UI/UX:** Dylan Maldonado (`DylanIMM`) · **Revisión para:** Leonel (PM) · **Documentación:** Leonardo Lugmaña

**Estado de la entrega:** documentación preparada para revisión de Leonel. No se declara aprobada, cerrada ni marcada como completada.

## 3.1. Objetivo y alcance

Esta entrega reúne el inventario visual, las referencias disponibles, los hallazgos UX y las decisiones de diseño de Kawsapacha V1. La revisión parte del código de los commits indicados en 3.2, de la documentación técnica disponible y del conjunto de capturas de `docs/diseno/evidencias-diseno/`.

El alcance comprende bienvenida, registro e inicio de sesión, Comunidad, Mi terreno y selección de provincia, catálogo de plantas medicinales, Mi Jardín (con Costa como evidencia principal), registro de planta, Pasaporte Vivo, Bitácora y Mi camino verde. Además se documentan, como **implementado pero no presentado**, los paneles administrativos `#admin-tecnico` y `#admin-msp`. No incluye cambios de código, modificación de Phaser, certificación de pruebas, auditoría de accesibilidad, validación botánica ni verificación funcional del backend más allá del health check local.

La revisión combina inspección de código, lectura de las capturas históricas y un recorrido real del producto el 15/11/2026 sobre `main` (`5173`) y sobre la rama del PR #74 (`5174`), con backend compartido. El recorrido incluyó **registro de cuenta e inicio de sesión reales**, creación de una comunidad, guardado de un terreno, carga de Mi Jardín, registro de una planta con imagen y apertura del Pasaporte Vivo. La auditoría responsive cubrió `320/360/390/430/768/1440` px. **No se probó en dispositivo móvil real** (solo emulación de viewport) y no se probaron producción ni sincronización multiusuario: una sesión local no demuestra comportamiento de producción.

## 3.2. Estado del repositorio y de la aplicación local

### Repositorio

- Rama de trabajo de esta documentación: `docs/ui-002-evidencias-ux-v1`.
- HEAD revisado de esta rama: `338873c` (merge de `main` en la rama; ya integrada en `main` mediante el PR #41, commit `d26d0cd`).
- `origin/main` revisado: `750082c` (PR #79 fusionado). `main` local: `419bd6d`.
- `git diff origin/main..HEAD -- frontend backend` no devuelve diferencias: el código de frontend y backend revisado equivale al de `origin/main`. Por eso las capturas del servidor `5173` representan el frontend de `main`.
- Rama comparada del [PR #74](https://github.com/ItsLeonel/OptiCode-Kawsapacha/pull/74): `fix/responsive-mobile-garden`, HEAD `6d7750a`. Base común con `origin/main`: `3f3547b`. Estado: 22 commits por delante y 30 por detrás de `origin/main`; **sin fusionar**.
- El frontend usa React 19, TypeScript, Vite 7 y Phaser 3.90. La navegación principal se resuelve con rutas hash en `App.tsx`.
- La revisión cubrió los componentes, páginas, rutas, estilos y recursos del frontend necesarios para describir las áreas del inventario.

El árbol de trabajo contiene cambios previos en documentación y en el conjunto de evidencias que no forman parte de esta edición. Esta revisión solo modifica los documentos de `docs/diseno/` y añade capturas dentro de `docs/diseno/evidencias-diseno/`; no altera código, Phaser, contratos, base de datos ni colores de la aplicación.

### Aplicación local en ejecución

Se recibieron dos servidores locales con un backend compartido:

- `http://localhost:5173` — frontend de `main` (árbol de trabajo `338873c`).
- `http://localhost:5174` — frontend de la rama `fix/responsive-mobile-garden` (`6d7750a`).
- Backend compartido en `http://localhost:3000` (una sola base SQLite).

Resultados comprobados:

- La aplicación carga con el título `Kawsapacha | Mi Huerto Vivo` y abre en `#bienvenida`.
- El backend responde en `http://localhost:3000/api/health` con `{"status":"ok","service":"kawsapacha-backend","db":"connected"}`.
- Se creó una cuenta real de prueba y se inició sesión (usuario `Ronny Veloz`, rol USUARIO). A diferencia de la revisión histórica, esta vez **sí** se ejecutaron registro de cuenta e inicio de sesión reales.
- Se creó una comunidad real (`Raíces del Tarqui`, Guayas/Guayaquil/Tarqui, estado PENDING), se guardó un terreno (`Huerto del Tarqui`, En tierra, 24 m²) y se conectó a Mi Jardín.
- Se registró una planta (`Achiote`, *Bixa orellana*) con una imagen de prueba; la interfaz confirmó «1 planta registrada» y el Pasaporte Vivo abrió con contenido.
- Se capturaron 35 pantallas del recorrido en `main`, 11 del panel administrativo y 16 de la rama #74. Detalle y metadatos en `evidencias-diseno/LEEME.md`.
- Ruido de red benigno observado: `net::ERR_ABORTED /api/lunar-calendar?...` (recarga de HMR en desarrollo) y un 404 intermitente de `/src/assets/ecuador-provincias.geojson` — **el archivo existe en el repositorio**, por lo que se atribuye al servidor de desarrollo, no a un recurso faltante.
- La correspondencia con una URL pública o con producción no se verificó. La sesión local demuestra persistencia en SQLite del backend, pero **no** demuestra sincronización multiusuario ni comportamiento de producción.
- **No se probó en un dispositivo móvil real.** Todas las capturas móviles son emulación de viewport (`390 × 844`) en Chromium headless. No se probaron Sierra, Amazonía/Oriente ni Galápagos, ni las modalidades Macetas, Vertical o Colgante.

### Criterios de lectura del inventario

| Término | Significado en este documento |
|---|---|
| Implementado en repositorio | El componente, ruta, estilo o recurso existe en el código del commit revisado. No implica que el flujo funcione. |
| Visible en la aplicación local | Se observó en una sesión real de `http://localhost:5173/`. No equivale a producción. |
| Verificado funcionalmente | Se ejecutó la interacción y se comprobó su resultado en la sesión local. |
| No comprobado o inaccesible | No hay URL pública, sesión, captura o reproducción suficiente para afirmarlo. |

## 3.3. Inventario visual de pantallas

| Área | Implementación en repositorio | Verificación en aplicación local | Evidencia disponible | Observaciones |
|---|---|---|---|---|
| Bienvenida, registro e inicio de sesión | Implementada. `AuthPage` y `AuthForm` incluyen pestañas de registro y acceso, formulario, validación visual, progreso de campos y acceso de visitante. | Verificada localmente: carga en `1440 × 1000` y `390 × 844`; sin desbordamiento horizontal. El acceso visitante funciona. No se probó registro de cuenta ni inicio de sesión real. | Capturas de escritorio y móvil. | La captura muestra el formulario de registro; no demuestra una cuenta creada, un inicio de sesión ni persistencia. Código: [AuthPage.tsx](../../frontend/src/features/auth/AuthPage.tsx), [AuthForm.tsx](../../frontend/src/features/auth/AuthForm.tsx). |
| Comunidad | Implementada. La página presenta comunidad, miembros y roles, accesos a huertos, experiencias y espacios comunitarios; también admite vista de visitante. | Verificada localmente: carga, creación de una comunidad personal con datos ficticios y vista de comunidad; sin desbordamiento horizontal a `390 px`. Se confirmó la contradicción de mensajes de persistencia (P0-001). No se probó unirse a una comunidad existente, publicar ni sincronizar. | Capturas de escritorio y móvil. | La captura corresponde a una vista de visitante/demo con información de ejemplo. La creación local funcionó; no prueba persistencia ni sincronización comunitaria. Código: [CommunitiesPage.tsx](../../frontend/src/features/communities/CommunitiesPage.tsx). |
| Mi terreno y selección de provincia | Implementada. El formulario incluye selector territorial, tipo de cultivo, superficie, características y guardado. La provincia se mapea a región en `garden-region.ts`. | Verificada localmente: ubicación heredada, tipo «En tierra», agua, suelo, guardado y resumen. En `390 px` el contenido comienza en y≈`1152` por la cabecera y la navegación. No se probaron otras regiones ni modalidades. | Escritorio: Guayas. Móvil: Manabí. | Las dos capturas muestran provincias distintas y no son una comparación de la misma sesión o configuración. La sesión local usó Guayas/Guayaquil/Tarqui. Código: [RealGardenPage.tsx](../../frontend/src/features/real-gardens/RealGardenPage.tsx), [garden-region.ts](../../frontend/src/features/real-gardens/garden-region.ts). |
| Catálogo de plantas medicinales | Implementada. `App.tsx` construye la búsqueda, las tarjetas y la acción de registrar una especie. El catálogo local se combina con la respuesta de la API cuando está disponible. | Verificada localmente: carga por ruta directa en escritorio sin errores de consola. Se abrió la ficha de especie (Achiote / *Bixa orellana*) y se navegó a `#plantas/Achiote`. No se probaron búsqueda por texto, todos los filtros ni el registro desde la tarjeta. | `main/29-catalogo-medicinal-desktop.png`, `main/29-catalogo-medicinal-mobile.png`, `main/34-catalogo-ficha-desktop.png`; rama: `rama-qa-pr74/29-catalogo-medicinal-*.png`. | El catálogo muestra 8 especies para Costa/Guayas con filtros por categoría. Los chips de filtro (`mc-chip`) miden 31 px de alto en móvil (ver UX-105). Código: [App.tsx](../../frontend/src/app/App.tsx), [plant-species.ts](../../frontend/src/features/my-garden/plant-species.ts). |
| Mi Jardín | Implementada. React compone HUD, guía, paneles, acciones y diálogos; Phaser pinta el paisaje y las seis zonas. El código contempla Costa, Sierra, Amazonía y Galápagos, y las modalidades En tierra, Macetas, Vertical y Colgante. | Verificada localmente en Costa/En tierra: canvas, seis slots y HUD en `1440 × 1000` y `390 × 844`. En móvil las seis parcelas están dentro del encuadre; en la rama #74 hay además controles de zoom/paneo y selector de parcela (ver 3.6). | `main/04-jardin-vacio-desktop.png`, `main/04-jardin-mobile.png`, `main/24-jardin-conectado-desktop.png`, `main/26-jardin-con-planta-desktop.png`; rama: `rama-qa-pr74/04-jardin-desktop.png`, `rama-qa-pr74/04-jardin-mobile.png`. | La unión del terreno con el paisaje derecho no se confirmó como defecto. La contradicción de mensajes de persistencia se confirmó también aquí (P0-001). Código: [MyGardenPage.tsx](../../frontend/src/features/my-garden/MyGardenPage.tsx), [PhaserGardenPoc.tsx](../../frontend/src/features/my-garden/phaser-poc/PhaserGardenPoc.tsx), [createGardenGame.ts](../../frontend/src/features/my-garden/phaser-poc/createGardenGame.ts). |
| Registro de planta, Pasaporte Vivo y Bitácora | Implementadas. El registro combina cámara o galería con datos de la planta; el Pasaporte usa un diálogo nativo; la Bitácora presenta actividades, filtros, fichas y estados vacíos. | Registro y Pasaporte verificados con imagen de prueba y especie Achiote: se guardó «1 planta registrada» y se abrió el Pasaporte. La Bitácora carga con 1 actividad y filtros. Persistencia entre recargas no verificada explícitamente en esta sesión. | `main/25-registrar-planta-modal-desktop.png`, `main/26-jardin-con-planta-desktop.png`, `main/27-pasaporte-vivo-{desktop,mobile}.png`, `main/28-bitacora-{desktop,mobile}.png`; rama: `rama-qa-pr74/27-pasaporte-vivo-mobile.png`, `rama-qa-pr74/28-bitacora-*.png`. | Código: [PlantRegistrationModal.tsx](../../frontend/src/features/my-garden/PlantRegistrationModal.tsx), [PlantPassport.tsx](../../frontend/src/features/my-garden/PlantPassport.tsx), [GardenHistory.tsx](../../frontend/src/features/my-garden/GardenHistory.tsx). |
| Mi camino verde | Implementada. La vista deriva hitos, semillas de vida, nivel, insignias y retos de las actividades documentadas; el código indica que son reconocimientos locales. | Verificada localmente: carga con nivel, insignias y misiones. La ruta `#mi-historia` renderiza además la Bitácora Viva (ver UX-108). | `main/31-mi-camino-verde-{desktop,mobile}.png`, `main/33-mi-historia-desktop.png`; rama: `rama-qa-pr74/31-mi-camino-verde-mobile.png`. | Los filtros de estado de misiones miden 32 px de alto en móvil (UX-105). Código: [GardenProgress.tsx](../../frontend/src/features/my-garden/GardenProgress.tsx), [App.tsx](../../frontend/src/app/App.tsx). |
| Autenticación y roles (registro e inicio de sesión reales) | Implementada. `AuthForm` con pestañas de registro/acceso; `App.tsx` resuelve el rol (`USUARIO`, `ADMIN_TECNICO`, `ADMIN_MSP`) y redirige según el rol. | Verificada localmente: se creó una cuenta y se inició sesión; el backend confirmó el rol y persistió la sesión. | `main/01-bienvenida-desktop.png`, `main/02-acceso-login-desktop.png`, `main/02-acceso-login-mobile.png`. | A diferencia de la revisión histórica, el registro e inicio de sesión **sí** se ejecutaron. Código: [AuthPage.tsx](../../frontend/src/features/auth/AuthPage.tsx), [AuthForm.tsx](../../frontend/src/features/auth/AuthForm.tsx), [app/App.tsx](../../frontend/src/app/App.tsx). |
| Panel Administrador técnico (`#admin-tecnico`) | Implementada. `AdminDashboard` muestra resumen, usuarios y roles, provisión de cuentas MSP, configuración y auditoría. Guardia de rol en `AdminPortalRoot`. | Verificada localmente con `admin1@mail.com`: resumen (5 usuarios, 2 roles), lista de usuarios y creación exitosa de una cuenta MSP. | `msp/40`–`msp/43`. | **Implementado, no presentado en V1** hasta confirmar con el PM. Código: [AdminDashboard.tsx](../../frontend/src/features/admin-portal/AdminDashboard.tsx), [AdminPortalRoot.tsx](../../frontend/src/features/admin-portal/AdminPortalRoot.tsx). |
| Panel Administrador MSP (`#admin-msp`) | Implementada. `MspHome`/`MspDetail` con resumen institucional, comunidades y estados, eventos, recursos y moderación. | Verificada localmente con la cuenta MSP recién creada: resumen (1 comunidad, 2 en moderación), comunidades, eventos, recursos y moderación. | `msp/44`–`msp/46`. | **Implementado, no presentado en V1** hasta confirmar con el PM. Los paneles declaran «No constituye una plataforma oficial del MSP». Código: [AdminMspViews.tsx](../../frontend/src/features/admin-portal/AdminMspViews.tsx), [AdminMspHome.tsx](../../frontend/src/features/admin-portal/AdminMspHome.tsx). |
| Notificaciones | Implementada. Modal de notificaciones con pestañas «No leídas / Leídas / Invitaciones». | Verificada localmente: el modal abre con sus pestañas. | `main/35-notificaciones-{desktop,mobile}.png`; rama: `rama-qa-pr74/35-notificaciones-mobile.png`. | Las pestañas miden 30 px de alto y «Cerrar notificaciones» 25 × 32 px (UX-105). |

## 3.4. Evidencias visuales

Las evidencias se organizan en **tres conjuntos con procedencias distintas** que no deben confundirse. El detalle de cada archivo y sus metadatos está en el manifiesto [`evidencias-diseno/LEEME.md`](evidencias-diseno/LEEME.md).

| Conjunto | Ruta | Imágenes | Versión que representa |
|---|---|---|---|
| Histórico (09/11/2026) | `evidencias-diseno/*.png` | 12 | Revisión local antigua (autoría Dylan). Línea base; **no** es el `main` actual ni el PR #74. |
| `main` (15/11/2026) | `evidencias-diseno/main/` | 35 | Frontend de `origin/main` (`750082c`). Recorrido real del usuario. |
| `msp` (15/11/2026) | `evidencias-diseno/msp/` | 11 | Paneles `#admin-tecnico` y `#admin-msp`. **Implementado, no presentado** en V1. |
| `rama-qa-pr74` (15/11/2026) | `evidencias-diseno/rama-qa-pr74/` | 16 | **Rama en QA (PR #74), no fusionada.** No es `main`. |

### Conjunto histórico (línea base, 09/11/2026)

| Pantalla | Escritorio | Móvil |
|---|---|---|
| Bienvenida y registro | [01-bienvenida-registro-desktop.png](evidencias-diseno/01-bienvenida-registro-desktop.png) | [01-bienvenida-registro-mobile.png](evidencias-diseno/01-bienvenida-registro-mobile.png) |
| Comunidad | [02-comunidad-desktop.png](evidencias-diseno/02-comunidad-desktop.png) | [02-comunidad-mobile.png](evidencias-diseno/02-comunidad-mobile.png) |
| Mi terreno — Guayas / Manabí | [03-terreno-guayas-desktop.png](evidencias-diseno/03-terreno-guayas-desktop.png) | [03-terreno-manabi-mobile.png](evidencias-diseno/03-terreno-manabi-mobile.png) |
| Mi Jardín — Costa | [04-jardin-costa-desktop.png](evidencias-diseno/04-jardin-costa-desktop.png) | [04-jardin-costa-mobile.png](evidencias-diseno/04-jardin-costa-mobile.png) |
| Registro de planta | [05-registro-planta-desktop.png](evidencias-diseno/05-registro-planta-desktop.png) | [05-registro-planta-mobile.png](evidencias-diseno/05-registro-planta-mobile.png) |
| Pasaporte Vivo | [06-pasaporte-vivo-desktop.png](evidencias-diseno/06-pasaporte-vivo-desktop.png) | [06-pasaporte-vivo-mobile.png](evidencias-diseno/06-pasaporte-vivo-mobile.png) |

Estas capturas se conservan como historia. Las móviles son imágenes de página completa o recortes (por ejemplo `456 × 3468` en Mi terreno), no necesariamente un viewport de `390 × 844`; por eso **no** se usan como certificación de responsive.

### Conjunto `main/` — recorrido real (frontend de `main`)

Cubre bienvenida, acceso, comunidad (creación paso a paso), terreno, jardín vacío y conectado, registro de planta, Pasaporte Vivo, Bitácora, catálogo medicinal (incluida ficha de especie), Mis plantas, Mi camino verde, `#mi-historia` y notificaciones. Escritorio `1440 × 1000` y móvil `390 × 844`.

Ejemplos: [main/01-bienvenida-desktop.png](evidencias-diseno/main/01-bienvenida-desktop.png), [main/02-acceso-login-desktop.png](evidencias-diseno/main/02-acceso-login-desktop.png), [main/20-comunidad-creada-desktop.png](evidencias-diseno/main/20-comunidad-creada-desktop.png), [main/23-terreno-registrado-mobile.png](evidencias-diseno/main/23-terreno-registrado-mobile.png), [main/27-pasaporte-vivo-desktop.png](evidencias-diseno/main/27-pasaporte-vivo-desktop.png), [main/29-catalogo-medicinal-desktop.png](evidencias-diseno/main/29-catalogo-medicinal-desktop.png), [main/31-mi-camino-verde-desktop.png](evidencias-diseno/main/31-mi-camino-verde-desktop.png), [main/35-notificaciones-mobile.png](evidencias-diseno/main/35-notificaciones-mobile.png). Lista completa en el manifiesto.

### Conjunto `msp/` — paneles administrativos (**implementado, no presentado**)

`#admin-tecnico` (acceso, resumen, usuarios y roles, alta de cuenta MSP) y `#admin-msp` (acceso, resumen, moderación, comunidades, eventos, recursos). **Su presentación en la entrega V1 no está confirmada con el PM (Leonel).** Los paneles declaran «Proyecto académico EPN · No constituye una plataforma oficial del MSP».

### Conjunto `rama-qa-pr74/` — rama en QA (PR #74), no fusionada

Mismo recorrido clave (bienvenida, acceso, jardín escritorio/móvil, terreno, Pasaporte, Bitácora, catálogo, Mis plantas, Mi camino verde, comunidad, notificaciones) sobre el servidor `5174`. **No es `main`.**

### Metadatos comunes

- **Fecha:** 15/11/2026. **Navegador:** Chromium headless de Playwright (`HeadlessChrome/156.0.0.0`, `chromium-1248`), `Windows NT 10.0; Win64; x64`, `devicePixelRatio = 1`, idioma `es-ES`.
- **Resoluciones:** escritorio `1440 × 1000`; móvil `390 × 844`. Auditoría responsive adicional: `320`, `360`, `390`, `430`, `768`, `1440` px.
- **Servidores:** `http://localhost:5173` (`main`) y `http://localhost:5174` (rama #74), con backend compartido en `http://localhost:3000`.
- **Datos de sesión:** usuario de prueba `Ronny Veloz` (`ronny@kawsapacha.ec`, rol USUARIO), comunidad `Raíces del Tarqui`, terreno `Huerto del Tarqui`, planta `Achiote`. **Sin credenciales ni datos personales reales en las imágenes.**
- **No se probó en dispositivo móvil real:** todas las capturas móviles son emulación de viewport.

Sigue sin haber captura de las regiones Sierra, Amazonía/Oriente y Galápagos, ni de las modalidades Macetas, Vertical y Colgante: solo se recorrió Costa/En tierra.

## 3.5. Diseño propuesto en Figma

**Propuesta de diseño visual en Figma:** [diseño propuesto Kawsapacha](https://www.figma.com/design/w5Ky7101rMa2XW6cWX5nYi/dise%C3%B1o-propuesto-kawsapacha?node-id=0-1&t=qNBA6nsNjoBFpH1m-1).

El enlace se registra como referencia de una propuesta visual. No se presenta como prototipo interactivo validado, implementación idéntica a la aplicación ni archivo cuyo acceso de otras personas se haya comprobado. No se verificó la interactividad del archivo ni que la implementación coincida exactamente con él.

## 3.6. Hallazgos de experiencia de usuario

Los hallazgos combinan la lectura de código y capturas con el recorrido real del 15/11/2026 sobre `main` y sobre la rama del PR #74. Cuando una observación de la captura histórica no se reprodujo, se indica expresamente y **deja de mantenerse como defecto confirmado**. Los estados posibles son: **confirmado en `main`**, **corregido en la rama #74 (según medición, no fusionado)**, **no reproducido** o **pendiente**.

La auditoría responsive cubrió `320/360/390/430/768/1440` px en ocho pantallas de ambos servidores. **Ningún ancho produjo desbordamiento horizontal a nivel de documento** (`scrollWidth ≤ innerWidth`); los elementos que exceden el viewport son decorativos (imágenes de guía, fondos SVG, hojas del héroe, parcelas de Phaser recortadas) y no generan barra de desplazamiento.

### P0 — Bloqueos para la demostración

| Identificador | Pantalla o módulo | Evidencia | Archivo o componente relacionado | Problema observado | Corrección propuesta | Estado de verificación |
|---|---|---|---|---|---|---|
| P0-001 | Mi Jardín y Comunidad — mensajes de persistencia | `main/04-jardin-mobile.png`, `main/32-comunidad-desktop.png` y sesión local a `1440 × 1000` y `390 × 844` | [MyGardenPage.tsx](../../frontend/src/features/my-garden/MyGardenPage.tsx), [phaser-poc/PhaserGardenPoc.tsx](../../frontend/src/features/my-garden/phaser-poc/PhaserGardenPoc.tsx), [CommunitiesPage.tsx](../../frontend/src/features/communities/CommunitiesPage.tsx), [CommunityForm.tsx](../../frontend/src/features/communities/CommunityForm.tsx), [app/App.tsx](../../frontend/src/app/App.tsx) | La interfaz afirma a la vez que los datos se guardan **en la base de datos** y que el guardado es **local, sin sincronización**. Confirmado en **sesión autenticada**: «Tus plantas, bitácoras y cosechas se guardan en la base de datos.» (MyGardenPage) convive con «Tu huerto real, reflejado en cada registro · Guardado local en este navegador» (PhaserGardenPoc) y «Guardado local · Solo en este navegador» (App). En Comunidad: «Sesión activa · Datos guardados en la base de datos.» (CommunitiesPage) frente a «Guardado local · Sin sincronización» (CommunityForm). En visitante se añade «Demostración pública». Los mensajes se contradicen sobre dónde se persiste y pueden inducir a error en la demo. | Unificar el mensaje según el modo y el destino real de los datos: distinguir explícitamente guardado en servidor (sesión autenticada) de guardado local/borrador (visitante). Revisar los cinco puntos de mensaje listados. | **Confirmado en `main`** en sesión autenticada y en visitante, a escritorio y móvil. No corregido en `main`. La rama #74 **no** modifica estos textos. |

### P1 — Legibilidad, responsive, navegación o interacción

| Identificador | Pantalla o módulo | Evidencia | Archivo o componente relacionado | Problema observado | Corrección propuesta | Estado de verificación |
|---|---|---|---|---|---|---|
| UX-001 | Mi Jardín — mensaje de guardado móvil | `main/04-jardin-mobile.png` y medición local a `390 × 844` en ambos servidores | [phaser-poc/phaser-poc.css](../../frontend/src/features/my-garden/phaser-poc/phaser-poc.css), [app/App.tsx](../../frontend/src/app/App.tsx), [garden-live.css](../../frontend/src/features/my-garden/phaser-poc/garden-live.css) | **No reproducido en la sesión actual.** El texto «Guardado local en este navegador» (`.garden-poc-note`) se renderiza en la parte **superior** (y≈`9`), no sobre las acciones. La franja «Guardado local · Solo en este navegador» (`.garden-storage-status`) existe pero es `position: fixed` en y≈`780–832` y **solo aparece en modo visitante**; en visitante las acciones rápidas quedan en y≈`1847` (fuera del primer viewport), por lo que la superposición medida es **0 px**. En sesión autenticada las acciones están en y≈`714` (`main`) / `722` (rama #74) y tampoco se solapan. | Si reaparece, reproducir en el ancho y modo exactos antes de abrir un defecto. Mantener la verificación de `safe-area` y de la orientación horizontal. | **No reproducido** ni en `main` ni en la rama #74 a `390 × 844` (autenticado ni visitante). El hallazgo histórico **no se mantiene** como defecto confirmado. |
| UX-002 | Mi Jardín — parcelas móviles | `main/04-jardin-mobile.png` y medición local a `390 × 844` | [createGardenGame.ts](../../frontend/src/features/my-garden/phaser-poc/createGardenGame.ts), [layouts.ts](../../frontend/src/features/my-garden/phaser-poc/layouts.ts), [phaser-poc.css](../../frontend/src/features/my-garden/phaser-poc/phaser-poc.css) | En `main` las seis parcelas están dentro del encuadre pero la cámara fija y el zoom pequeño hacen que las zonas táctiles sean muy reducidas y las cuatro laterales difíciles de distinguir. La rama #74 añade **controles de zoom/paneo** (`Acercar jardín`, `Alejar jardín`, `Centrar jardín`), arrastre y pellizco, y un selector de parcela; el encuadre de las seis parcelas se conserva. | Verificar en dispositivo táctil real el gesto de pellizco y la precisión del selector antes de fusionar el PR #74. Coordinar cualquier cambio adicional de Phaser. | **Parcialmente atendido en la rama #74** (zoom/paneo/selector presentes según medición, no fusionado). En `main` permanece como está. No validado en hardware real. |
| UX-003 | Mi Jardín — Costa escritorio | `main/04-jardin-vacio-desktop.png` y sesión local a `1440 × 1000` | [createGardenGame.ts](../../frontend/src/features/my-garden/phaser-poc/createGardenGame.ts), [scene-painter.ts](../../frontend/src/features/my-garden/phaser-poc/scene-painter.ts), [courtyard.ts](../../frontend/src/features/my-garden/phaser-poc/courtyard.ts), [coastal-terrain.ts](../../frontend/src/features/my-garden/phaser-poc/coastal-terrain.ts) | No se confirmó un corte vertical dominante en el borde derecho a `1440 × 1000`; un análisis de gradiente horizontal no mostró una costura persistente en esa zona. El código ajusta el ancho del terreno y comenta que así evita que el césped termine abruptamente en ventanas bajas. La observación original puede depender de otra resolución. | Revisar la unión en varios anchos y alturas; si aparece un corte, extender la superficie o mezclar el borde con el paisaje. No modificar Phaser sin coordinación. | **No confirmado** como defecto en `1440 × 1000`. Pendiente de revisar en otros tamaños. |
| UX-004 | Mi Jardín — HUD móvil y escritorio | `main/04-jardin-mobile.png` y medición local a `390 × 844` | [MyGardenPage.tsx](../../frontend/src/features/my-garden/MyGardenPage.tsx), [garden-live.css](../../frontend/src/features/my-garden/phaser-poc/garden-live.css), [phaser-poc.css](../../frontend/src/features/my-garden/phaser-poc/phaser-poc.css) | El tercio inferior del HUD móvil está congestionado: guía regional, contador, progreso y acciones rápidas compiten por el espacio y las etiquetas de acción bajan a 10 px. En la rama #74 el botón de menú (`garden-sidebar-tab`) pasa de `30 × 58` a `48 × 48` px (arriba a la derecha) y el widget lunar (`lunar-widget-toggle`) de `132 × 36` a `132 × 44` px, mejorando el área táctil; las acciones rápidas pasan de `316` a `376` px de ancho. | Revisar jerarquía del HUD, mantener etiquetas legibles y asegurar áreas táctiles de al menos 44 px. Validar con teclado y con puntero táctil. | **Parcialmente atendido en la rama #74** (áreas táctiles del menú y del widget lunar; ver UX-105). Congestión del HUD pendiente de validación visual en dispositivo real. |
| UX-005 | Mi terreno — móvil | `main/23-terreno-registrado-mobile.png` y medición local a `390 × 844` | [RealGardenPage.tsx](../../frontend/src/features/real-gardens/RealGardenPage.tsx), [real-gardens.css](../../frontend/src/features/real-gardens/real-gardens.css), [GardenNavigation.tsx](../../frontend/src/features/my-garden/GardenNavigation.tsx) | A `390 × 844` no hay desbordamiento horizontal (`scrollWidth = innerWidth = 390`), pero el contenido de Mi terreno comienza muy por debajo del primer viewport por el peso de la navegación superior y la cabecera de bienvenida. La captura histórica móvil de `456 px` sugiere una columna más estrecha, pero ese ancho no se reprodujo. | Revisar el colapso de la navegación y el peso de la cabecera en móvil para que el resumen y las acciones aparezcan antes. | **Confirmado en `main`**: sin overflow horizontal, con desplazamiento vertical excesivo antes del contenido. No corregido en la rama #74. |
| UX-105 | Global — áreas táctiles pequeñas | Medición local a `320` y `390` px en ambos servidores | Varios componentes (notificaciones, catálogo, Mis plantas, Mi camino verde, campana del jardín) | Persisten controles por debajo de 44 px de alto en móvil, en `main` **y** en la rama #74: pestañas de notificaciones (30 px) y «Cerrar notificaciones» (`25 × 32`), chips de filtro del catálogo `mc-chip` (31 px), filtros de Mis plantas `bv-filter-pill` (32 px) y `bv-register-button` (41 px), botón de Mis plantas `rv-subtle-button` (41 px), campana del jardín `garden-header-bell-btn` (`42 × 34`) y selector del catálogo (41 px). | Elevar las áreas táctiles a ≥44 px (o ampliar el área de acierto sin cambiar el aspecto visual) en estos controles. | **Confirmado en `main` y en la rama #74.** No corregido. |
| UX-108 | Navegación — ruta `#mi-historia` | `main/33-mi-historia-desktop.png` y sesión local a `1440 × 1000` | [app/App.tsx](../../frontend/src/app/App.tsx), [GardenProgress.tsx](../../frontend/src/features/my-garden/GardenProgress.tsx), [GardenHistory.tsx](../../frontend/src/features/my-garden/GardenHistory.tsx) | La ruta `#mi-historia` **no tiene identidad propia**: renderiza «Mi camino verde» (`GardenProgress`) **y además** la Bitácora Viva (`GardenHistory`), pero el título y la miga de pan siguen mostrando «Mi camino verde». El usuario no percibe que sea una sección distinta. | Decidir con el PM si `#mi-historia` debe ser una sección propia (con su título y encabezado) o si conviene redirigirla a `#progreso` o a `#bitacora`. No dejarla como alias silencioso. | **Confirmado en `main`.** No corregido en la rama #74. |

La observación histórica sobre un posible desbordamiento en Comunidad móvil **no se mantiene** como hallazgo: la auditoría a `320/360/390/430/768/1440` px midió `scrollWidth ≤ innerWidth` en las ocho pantallas de ambos servidores, sin overflow horizontal de documento. La franja clara de la captura no se reprodujo; puede ser un artefacto de composición o corresponder a otro ancho. Si vuelve a aparecer, debe reproducirse en el ancho exacto de la captura antes de abrir un defecto.

**Nota sobre la rama #74:** la rama `fix/responsive-mobile-garden` **no fusionada** incorpora `responsive-phase1.css` y `garden-mobile.css`, y añade controles de zoom/paneo y selector de parcela en Mi Jardín. Los cambios verificados por medición (no por revisión estética ni en dispositivo real) son: botón de menú `garden-sidebar-tab` `30 × 58` → `48 × 48`, widget lunar `132 × 36` → `132 × 44`, acciones rápidas `316` → `376` px de ancho, y presencia de `Acercar/Alejar/Centrar jardín`. El resto de hallazgos (P0-001, UX-005, UX-105, UX-108) **no** están corregidos en la rama.

### P2 — Mejoras estéticas no bloqueantes

| Identificador | Pantalla o módulo | Evidencia | Problema o mejora | Corrección propuesta | Estado de verificación |
|---|---|---|---|---|---|
| UX-101 | Global | Código de estilos; `main/` y `rama-qa-pr74/` | La interfaz general usa DM Sans y Outfit, mientras la capa de juego usa Trebuchet MS y Georgia. La diferencia es perceptible entre pantallas. | Evaluar una unificación tipográfica solo con aprobación del PM; no es un cambio urgente para la demo. | Revisión de CSS en ambos servidores. No evaluado como defecto visual en la sesión local. |
| UX-102 | Mi Jardín | `main/04-jardin-*.png` y medición local | La jerarquía del HUD, la guía y el contador puede refinarse para dar más protagonismo a las parcelas. | Ajustar espaciado, contraste y agrupación de controles después de resolver los hallazgos P1 de móvil. | Propuesta no implementada. La rama #74 mejora algunas áreas táctiles (UX-004), pero no la jerarquía. |
| UX-103 | Comunidad | `main/32-comunidad-desktop.png` y sesión local | Se muestran las tarjetas «Foro comunitario», «Aprender juntos» y «Eventos y mingas». El alcance V1 excluye foro y funciones extendidas; no se determinó si las tarjetas son informativas o accesos. | Confirmar con Leonel si deben permanecer en la demo y si son solo informativas; no convertirlas en alcance nuevo sin decisión. | Presencia confirmada en `main`; alcance no confirmado. |
| UX-104 | Pasaporte Vivo | `main/27-pasaporte-vivo-desktop.png` | En la captura histórica, «Registrada» figura como 9/11/2026 y la siembra como 8/11/2026. Puede deberse a zona horaria o al significado de cada fecha. | Confirmar con QA y PM antes de cambiar textos o lógica. | Observación de captura histórica; **no reproducida** en el recorrido del 15/11/2026. |

## 3.7. Decisiones de diseño

### Decisiones respaldadas por la implementación

- React compone formularios, navegación, paneles, diálogos, HUD y mensajes; Phaser se integra mediante un puente de eventos y se ocupa del paisaje y de la representación de las parcelas.
- La provincia determina la región visual mediante `garden-region.ts`. El código contempla Costa, Sierra, Amazonía/Oriente y Galápagos con paisajes y guías diferenciados.
- Mi Jardín conserva seis identificadores estables, `garden-slot-0` a `garden-slot-5`, y reutiliza el modelo de seis espacios en las cuatro modalidades de cultivo.
- La interfaz distingue visitante y sesión autenticada. El modo visitante guarda en el navegador y no se presenta como una cuenta ni como sincronización multiusuario.
- La cámara de la escena en `main` es fija: los comandos heredados de paneo y zoom no producen efecto en el código de `main`; el movimiento del puntero solo diferencia clic de arrastre. La rama del PR #74 **sí** introduce cámara adaptable con zoom, paneo y pellizco, además de un selector de parcela.
- El recorrido real del 15/11/2026 confirmó registro de cuenta e inicio de sesión, la creación de una comunidad, el guardado del terreno, la carga de Mi Jardín, el registro de una planta con imagen y la apertura del Pasaporte Vivo, con persistencia en el backend SQLite compartido.
- La dirección visual combina paisajes regionales, madera, tierra, tejidos y personajes guía con controles de interfaz separados.

### Decisiones pendientes de revisión o aprobación

- Leonel debe revisar la dirección artística final de Mi Jardín, la transición del terreno con el paisaje de Costa, la guía regional, la jerarquía del HUD y las correcciones responsive propuestas.
- Debe acordarse si la composición de cámara esperada es la fija de `main` o la adaptable del PR #74 (zoom/paneo/selector de parcela). La discrepancia entre documentos de implementación queda pendiente de confirmar con el PM.
- La unificación tipográfica entre la interfaz general y la capa de juego queda como recomendación, no como decisión tomada.

## 3.8. Limitaciones y aspectos pendientes

- **No se probó en un dispositivo móvil real.** Todas las capturas y mediciones móviles son emulación de viewport (`390 × 844`) en Chromium headless. No se validaron gestos táctiles reales (pellizco, arrastre), `safe-area` ni orientación horizontal.
- No se probó sincronización multiusuario, unión a una comunidad existente, publicación comunitaria, recuperación ante fallos ni comportamiento de producción.
- En modo visitante, la API de calendario devuelve 401; el Pasaporte usa contenido alternativo. Es una frontera de autenticación esperada, no una certificación de que el calendario autenticado funcione.
- Las evidencias cubren **Costa/En tierra**. No se probaron Sierra, Amazonía/Oriente, Galápagos, ni las modalidades Macetas, Vertical y Colgante (ver la matriz de `propuesta-jardin-v1.md` §5.4, todavía sin recorrer).
- La verificación responsive se hizo por emulación en `320/360/390/430/768/1440` px, no en dispositivos reales.
- La rama del PR #74 se evaluó **por medición y captura**, no con revisión estética ni con aprobación de accesibilidad. Sus pruebas Playwright verdes no equivalen a validación UX física.
- Ruido de red benigno: `net::ERR_ABORTED /api/lunar-calendar?...` (recarga de HMR) y un 404 intermitente de `/src/assets/ecuador-provincias.geojson`, **aunque el archivo existe** en el repositorio; se atribuye al servidor de desarrollo.
- Esta revisión solo modifica documentos de `docs/diseno/` y añade capturas en `docs/diseno/evidencias-diseno/`; **no** altera código, Phaser, contratos, base de datos ni colores de la aplicación.

## 3.9. Resumen del estado de preparación para la demo

La documentación queda preparada para revisión de Leonel. No se declara aprobación del PM ni cierre del issue #32.

- **Recorrido real completado en `main`:** registro de cuenta e inicio de sesión reales, creación de comunidad, guardado de terreno, Mi Jardín con planta registrada, Pasaporte Vivo, Bitácora, catálogo, Mis plantas, Mi camino verde y notificaciones. 35 capturas en `evidencias-diseno/main/`.
- **Paneles administrativos:** `#admin-tecnico` y `#admin-msp` verificados y capturados (11 imágenes), documentados como **implementado, no presentado** hasta que el PM confirme su alcance.
- **P0 confirmado:** contradicción de mensajes de persistencia («base de datos» vs. «guardado local») en Mi Jardín y Comunidad, confirmada también en **sesión autenticada** (P0-001). No corregido en `main` ni en el PR #74.
- **Riesgos P1 vigentes en `main`:** áreas táctiles por debajo de 44 px (notificaciones, catálogo, Mis plantas, Mi camino verde, campana del jardín — UX-105); `#mi-historia` sin identidad propia (UX-108); Mi terreno móvil con desplazamiento vertical excesivo antes del contenido (UX-005); parcelas móviles pequeñas sin controles de encuadre (UX-002).
- **Rama en QA (PR #74, no fusionada):** mejora medible de áreas táctiles en Mi Jardín (menú `30 × 58` → `48 × 48`, widget lunar `36` → `44` px) y añade zoom/paneo/selector de parcela. **No** corrige P0-001, UX-005, UX-105 ni UX-108.
- **Hallazgos históricos descartados o corregidos:** la superposición del mensaje de guardado en Mi Jardín móvil (UX-001) **no se reprodujo**; el supuesto desbordamiento de Comunidad móvil **no se reproduce** en ningún ancho auditado; el corte del terreno con el paisaje derecho no se confirmó a `1440 × 1000` (UX-003).
- **P2 / alcance:** confirmar con Leonel si las tarjetas «Foro comunitario», «Aprender juntos» y «Eventos y mingas» permanecen en la demo; la diferencia de fechas del Pasaporte histórico no se reprodujo.
- **Pendiente para cerrar la verificación:** revisión en teléfono físico, recorrido de las demás regiones y modalidades (matriz de 16 combinaciones), confirmación del alcance MSP y del acceso a Figma, y decisión sobre la publicación del PR.
- **Estado:** preparada para revisión; no aprobada.

