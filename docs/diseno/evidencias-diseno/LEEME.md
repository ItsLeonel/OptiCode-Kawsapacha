# Evidencias de diseño UI/UX — Kawsapacha V1

Este directorio reúne las capturas de la revisión UI/UX. Se separa en tres conjuntos con
procedencias distintas que **no deben confundirse**:

| Conjunto | Ruta | Qué es | Versión que representa |
|---|---|---|---|
| Histórico | `./*.png` (12 archivos) | Capturas de la revisión local del **09/11/2026** (autoría Dylan). | Línea base antigua. No describen el `main` actual ni el PR #74. |
| `main` | `./main/*.png` (35 archivos) | Recorrido real del producto el **15/11/2026** sobre el frontend de `main`. | Frontend de `origin/main` (`750082c`). |
| `msp` | `./msp/*.png` (11 archivos) | Paneles administrativos (Administrador técnico y MSP). | Frontend de `main`. **Implementado, no presentado** en V1 (ver aviso). |
| `rama-qa-pr74` | `./rama-qa-pr74/*.png` (16 archivos) | Mismo recorrido clave sobre la rama en revisión. | **Rama en QA (PR #74), no fusionada.** No es `main`. |

## Metadatos de captura

- **Fecha:** 15/11/2026.
- **Navegador:** Chromium headless empaquetado por Playwright
  (`HeadlessChrome/156.0.0.0`, `chromium-1248`), `Windows NT 10.0; Win64; x64`, `devicePixelRatio = 1`,
  idioma `es-ES`. **No es un dispositivo móvil real: las capturas móviles son emulación de viewport.**
- **Resoluciones:** escritorio `1440 × 1000`; móvil `390 × 844`. La auditoría responsive adicional cubrió
  `320`, `360`, `390`, `430`, `768` y `1440` px de ancho.
- **Servidor `main`:** `http://localhost:5173` — árbol de trabajo de la rama
  `docs/ui-002-evidencias-ux-v1` (`338873c`). `git diff -- frontend backend` contra `origin/main`
  (`750082c`) no devuelve diferencias: el frontend renderizado equivale al de `main`.
- **Servidor rama #74:** `http://localhost:5174` — rama `fix/responsive-mobile-garden` (`6d7750a`),
  base común `3f3547b` con `origin/main`, 22 commits por delante y 30 por detrás, **sin fusionar**.
- **Backend compartido:** `http://localhost:3000` (una sola base SQLite para ambos servidores).
- **Datos de la sesión:** usuario de prueba `Ronny Veloz` (`ronny@kawsapacha.ec`, rol USUARIO),
  comunidad `Raíces del Tarqui` (Guayas/Guayaquil/Tarqui, estado PENDING), terreno `Huerto del Tarqui`
  (En tierra, 24 m²) y una planta `Achiote` (`Bixa orellana`). **Sin credenciales ni datos personales reales.**

> ⚠️ **Aviso sobre los paneles MSP.** Las capturas `40`–`46` documentan el panel de Administrador
> técnico (`#admin-tecnico`) y el panel de Administrador MSP (`#admin-msp`). Ambos están **implementados y
> funcionan** en el código y en la ejecución local, pero **su presentación en la entrega V1 no está
> confirmada con el PM (Leonel)**. Se documentan como *implementado, no presentado* hasta que el PM
> confirme el alcance. La cabecera de los paneles indica explícitamente «Proyecto académico EPN · No
> constituye una plataforma oficial del MSP».

## Conjunto `main/` — recorrido del usuario (frontend de `main`)

| Archivo | Módulo | Qué se observa |
|---|---|---|
| `01-bienvenida-desktop.png` | Bienvenida | Pantalla pública de bienvenida, escritorio. |
| `01-bienvenida-mobile.png` | Bienvenida | Bienvenida en viewport móvil. |
| `02-acceso-login-desktop.png` | Acceso | Pestaña «Iniciar sesión» con formulario. |
| `02-acceso-login-mobile.png` | Acceso | Acceso en viewport móvil (sesión sin iniciar). |
| `04-jardin-vacio-desktop.png` | Mi Jardín | Jardín sin terreno conectado (estado inicial). |
| `04-jardin-mobile.png` | Mi Jardín | Jardín con terreno conectado, móvil. |
| `15-comunidad-crear-modal-desktop.png` | Comunidad | Modal de creación de comunidad. |
| `16-comunidad-ubicacion-desktop.png` | Comunidad | Paso de territorio (provincia/cantón/parroquia). |
| `17-comunidad-identidad-desktop.png` | Comunidad | Paso de identidad (nombre, descripción, tipo). |
| `18-comunidad-builder-desktop.png` | Comunidad | Configurador (responsable/integrantes). |
| `19-comunidad-confirmar-desktop.png` | Comunidad | Paso de confirmación previo a crear. |
| `20-comunidad-creada-desktop.png` | Comunidad | Resultado tras crear la comunidad. |
| `21-terreno-form-desktop.png` | Mi terreno | Formulario de registro del terreno. |
| `22-terreno-confirmar-dialogo-desktop.png` | Mi terreno | Diálogo de confirmación (nombre, área). |
| `23-terreno-registrado-desktop.png` | Mi terreno | Resumen del terreno registrado. |
| `23-terreno-registrado-mobile.png` | Mi terreno | Terreno registrado en móvil. |
| `24-jardin-conectado-desktop.png` | Mi Jardín | Jardín tras conectar el terreno (escena Phaser). |
| `25-registrar-planta-modal-desktop.png` | Registro de planta | Modal de registro con foto. |
| `26-jardin-con-planta-desktop.png` | Mi Jardín | Jardín con una planta registrada. |
| `27-pasaporte-vivo-desktop.png` | Pasaporte Vivo | Pasaporte de la planta (diálogo). |
| `27-pasaporte-vivo-mobile.png` | Pasaporte Vivo | Pasaporte en móvil. |
| `28-bitacora-desktop.png` | Bitácora | Bitácora Viva con actividad registrada. |
| `28-bitacora-mobile.png` | Bitácora | Bitácora en móvil. |
| `29-catalogo-medicinal-desktop.png` | Catálogo medicinal | Catálogo regional (Costa/Guayas). |
| `29-catalogo-medicinal-mobile.png` | Catálogo medicinal | Catálogo en móvil. |
| `30-mis-plantas-desktop.png` | Mis plantas | Listado de plantas del usuario. |
| `30-mis-plantas-mobile.png` | Mis plantas | Mis plantas en móvil. |
| `31-mi-camino-verde-desktop.png` | Mi camino verde | Progreso, insignias y misiones. |
| `31-mi-camino-verde-mobile.png` | Mi camino verde | Mi camino verde en móvil. |
| `32-comunidad-desktop.png` | Comunidad | Vista de la comunidad creada. |
| `32-comunidad-mobile.png` | Comunidad | Comunidad en móvil. |
| `33-mi-historia-desktop.png` | Mi historia | Ruta `#mi-historia` (ver hallazgo UX-108). |
| `34-catalogo-ficha-desktop.png` | Catálogo medicinal | Ficha de especie (Achiote / *Bixa orellana*). |
| `35-notificaciones-desktop.png` | Notificaciones | Modal de notificaciones. |
| `35-notificaciones-mobile.png` | Notificaciones | Notificaciones en móvil. |

## Conjunto `msp/` — paneles administrativos (implementado, no presentado)

| Archivo | Panel | Qué se observa |
|---|---|---|
| `40-admin-tecnico-login-desktop.png` | `#admin-tecnico` | Acceso protegido del Administrador técnico. |
| `41-admin-tecnico-inicio-desktop.png` | `#admin-tecnico` | Resumen: 5 usuarios, 2 roles, estado de servicios. |
| `42-admin-tecnico-usuarios-desktop.png` | `#admin-tecnico` | Usuarios y roles + formulario «Crear cuenta MSP». |
| `43-admin-tecnico-msp-creado-desktop.png` | `#admin-tecnico` | Confirmación «Funcionario MSP creado exitosamente». |
| `44-admin-msp-login-desktop.png` | `#admin-msp` | Acceso protegido del Administrador MSP. |
| `45-admin-msp-inicio-desktop.png` | `#admin-msp` | Resumen institucional (1 comunidad, 2 en moderación). |
| `46-admin-msp-moderacin-desktop.png` | `#admin-msp` | Moderación de comunidades (Raíces del Tarqui). |
| `46-admin-msp-comunidades-desktop.png` | `#admin-msp` | Comunidades y estados de verificación. |
| `46-admin-msp-eventos-desktop.png` | `#admin-msp` | Eventos institucionales. |
| `46-admin-msp-recursos-desktop.png` | `#admin-msp` | Biblioteca de recursos educativos. |
| `46-admin-msp-actividades-desktop.png` | `#admin-msp` | Reportes/actividades (la etiqueta «Actividades» no existe en la navegación MSP; la captura muestra el estado de Comunidades). |

## Conjunto `rama-qa-pr74/` — rama en QA (PR #74), no fusionada

| Archivo | Módulo | Qué se observa |
|---|---|---|
| `01-bienvenida-desktop.png` | Bienvenida | Bienvenida en la rama. |
| `02-acceso-login-desktop.png` | Acceso | Acceso en la rama. |
| `04-jardin-desktop.png` | Mi Jardín | Jardín en la rama, escritorio. |
| `04-jardin-mobile.png` | Mi Jardín | Jardín en la rama, móvil (cámara con zoom/paneo). |
| `23-terreno-registrado-desktop.png` | Mi terreno | Terreno registrado en la rama. |
| `23-terreno-registrado-mobile.png` | Mi terreno | Terreno en móvil en la rama. |
| `27-pasaporte-vivo-mobile.png` | Pasaporte Vivo | Pasaporte en móvil en la rama. |
| `28-bitacora-desktop.png` | Bitácora | Bitácora en la rama. |
| `28-bitacora-mobile.png` | Bitácora | Bitácora en móvil en la rama. |
| `29-catalogo-medicinal-desktop.png` | Catálogo medicinal | Catálogo en la rama. |
| `29-catalogo-medicinal-mobile.png` | Catálogo medicinal | Catálogo en móvil en la rama. |
| `30-mis-plantas-mobile.png` | Mis plantas | Mis plantas en móvil en la rama. |
| `31-mi-camino-verde-mobile.png` | Mi camino verde | Mi camino verde en móvil en la rama. |
| `32-comunidad-desktop.png` | Comunidad | Comunidad en la rama. |
| `32-comunidad-mobile.png` | Comunidad | Comunidad en móvil en la rama. |
| `35-notificaciones-mobile.png` | Notificaciones | Notificaciones en móvil en la rama. |

## Conjunto histórico (12 archivos, 09/11/2026)

`01-bienvenida-registro-*`, `02-comunidad-*`, `03-terreno-guayas-desktop`,
`03-terreno-manabi-mobile`, `04-jardin-costa-*`, `05-registro-planta-*`, `06-pasaporte-vivo-*`.

Corresponden a la revisión local antigua. Se conservan como línea base; **no** son evidencia del
responsive actual ni del PR #74.

## Reproducción

Las capturas se obtuvieron con un recorrido automatizado en Chromium headless sobre los servidores
locales `5173` (`main`) y `5174` (rama #74) con backend compartido en `3000`. Las mediciones de la
auditoría responsive (anchos, desbordes y áreas táctiles) se registran en el documento
[`entrega-ui-ux-v1.md`](../entrega-ui-ux-v1.md). Ninguna captura contiene credenciales ni datos
personales reales.
