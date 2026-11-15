# 🌱 Kawsapacha — Mi Huerto Vivo | Equipo OptiCode

**Calidad de Software · EPN · V1 + Fase 4.5 (Moderación MSP, Actividades, Recompensas) y Espejo Digital V2 integrados (14/11/2026)**

> **Estado actual (rama integrada con Fase 4.5 y `main`):** cuentas, comunidades (con flujo de aprobación MSP), huertos, plantas, fotos, calendario lunar, bitácora de actividades, misiones/recompensas auditables, notificaciones, roles `ADMIN_TECNICO` / `ADMIN_MSP` / `USUARIO` y Espejo Digital V2 por etapas están persistidos en el servidor (API REST + SQLite). En **modo visitante** (sin sesión), los datos y la bitácora local permanecen en IndexedDB. La poscosecha, rituales y señalética se registran como actividades documentales (0 puntos base) con respaldo en bitácora del servidor. Revisar [trazabilidad del cliente](docs/analisis/trazabilidad-cliente-2026-11-14.md).

## 🏛️ Arquitectura modular (rama PR #72)

La aplicación sigue siendo **un solo repositorio y un solo backend desplegable**. Se adopta **monolito modular** con límites de Clean Architecture; no se introducen microservicios y se preservan los contratos HTTP y las bases de datos existentes.

```text
OptiCode-Kawsapacha/
├── frontend/
│   └── src/
│       ├── app/           # Composición y navegación
│       ├── features/      # Áreas funcionales de la interfaz
│       └── shared/        # Contratos HTTP, UI y utilidades sin dependencias de features
├── backend/
│   ├── src/
│   │   ├── app/           # Composición Express
│   │   ├── modules/       # Dominio, aplicación, puertos, infraestructura y presentación
│   │   ├── infrastructure/
│   │   └── shared/
│   ├── prisma/            # Esquema y migraciones existentes, conservados
│   └── tests/
├── docs/
│   ├── architecture/
│   ├── requirements/
│   └── quality/
├── deploy/
└── .github/workflows/
```

**Criterios ejecutables:** `cd backend && npm run check:architecture` impide que dominio/aplicación dependan de infraestructura o HTTP y rechaza ciclos de módulos; `node tools/check-frontend-architecture.cjs` comprueba que `frontend/src/shared` no importa áreas de negocio. Los tests unitarios, de integración y la regresión Playwright son independientes de estas comprobaciones estructurales.

La [decisión arquitectónica](docs/architecture/ADR-0001-monolito-modular.md), [visión de módulos](docs/architecture/README.md) y [evidencia de regresión](docs/quality/regresion-arquitectura.md) documentan la implementación y sus límites. **La rama de trabajo y el PR no implican una fusión a `main`.**

Kawsapacha es una aplicación web educativa para que comunidades del Ecuador registren **huertos medicinales reales** y los representen en un **huerto virtual interactivo**. Cada planta podrá asociarse con su especie, una fotografía real y una ficha (*Pasaporte Vivo*).

## 🎯 Producto que vamos a desarrollar (V1)

1. **Usuarios:** registro, inicio de sesión, cierre de sesión y roles básicos.
2. **Comunidades:** creación, edición y gestión de integrantes.
3. **Huertos reales:** registro de características y ubicación; elección de provincia mediante un **mapa interactivo del Ecuador**.
4. **Catálogo medicinal:** consulta de especies, fotografías e información botánica y educativa.
5. **Huerto virtual 2D:** parcelas interactivas, registro de plantas cultivadas con fotos propias y consulta de su Pasaporte Vivo.

**Flujo de la demostración:** crear cuenta → iniciar sesión → crear comunidad → registrar huerto y provincia → elegir especie → subir foto real → colocar planta en una parcela → abrir su ficha → comprobar que los datos persisten.

> **Estado al 8/11/2026 (PR #30, #31):** frontend y backend están integrados en `main`. Con sesión iniciada, cuentas, comunidades, integrantes, huertos, plantas, fotos, cuidados, cosechas y bodega se guardan en el servidor (API REST + SQLite). En **modo visitante** los datos se conservan solo en el navegador (IndexedDB). Puntos, niveles e insignias se calculan en el navegador. El estado de cada función está en las [historias de usuario](docs/historias-usuario/historias-usuario-v1.md); los resultados de prueba los publica QA en [docs/casos-prueba/](docs/casos-prueba/).

## 👥 Equipo: empiecen por estas tareas

Las tareas de V1 y las fases posteriores están organizadas en GitHub Issues. Cada responsable debe revisar los criterios de aceptación y las dependencias actuales, especialmente #35, #43, #45, #48 y #49.

| Responsable | Qué empieza a hacer ahora | Issues iniciales |
|---|---|---|
| **Leonel — PM / Frontend** (`ItsLeonel`) | Ejecutar el frontend existente; preparar pantallas y formularios de registro/login; acordar con Ronny el contrato de API y coordinar la integración. | [#6](https://github.com/ItsLeonel/OptiCode-Kawsapacha/issues/6), [#8](https://github.com/ItsLeonel/OptiCode-Kawsapacha/issues/8) |
| **Ronny — Backend / BD** (`Rodni15`) | Definir arquitectura, entidades y endpoints; configurar servidor y base de datos; comenzar autenticación real. | [#4](https://github.com/ItsLeonel/OptiCode-Kawsapacha/issues/4), [#7](https://github.com/ItsLeonel/OptiCode-Kawsapacha/issues/7), [#8](https://github.com/ItsLeonel/OptiCode-Kawsapacha/issues/8) |
| **Dylan — Diseño UI/UX** (`DylanIMM`) | Diseñar en Figma login, dashboard, mapa provincial y huerto visual; compartir prototipo navegable, recursos y guía visual para implementación. | [#3](https://github.com/ItsLeonel/OptiCode-Kawsapacha/issues/3) |
| **Leonardo — Análisis / Documentación** (`kened-leonardo`) | Redactar historias de usuario con plantilla docente; organizar la documentación y preparar el informe final, recopilando los aportes verificables de cada compañero. | [#2](https://github.com/ItsLeonel/OptiCode-Kawsapacha/issues/2), [#15](https://github.com/ItsLeonel/OptiCode-Kawsapacha/issues/15) |
| **Santiago — QA / Pruebas** (`TonyTiago`) | Elaborar plan y casos de prueba con plantilla docente; ejecutar cada flujo cuando esté integrado, registrando resultados reales, errores y capturas. | [#5](https://github.com/ItsLeonel/OptiCode-Kawsapacha/issues/5), [#14](https://github.com/ItsLeonel/OptiCode-Kawsapacha/issues/14) |

**Implementación compartida:** los Issues [#8 al #13](https://github.com/ItsLeonel/OptiCode-Kawsapacha/issues) pertenecen a **Leonel (frontend)** y **Ronny (backend)**. No deben esperar a que Dylan o Leonardo terminen todo para empezar. **Primera prioridad conjunta: registro e inicio de sesión con persistencia real.**

### 🛠️ Herramientas y arquitectura

- **Frontend:** React 19 + TypeScript 5.9 + Vite 7; Phaser 3.90 para el huerto virtual; Leaflet 1.9 / React Leaflet 5 para el mapa detallado.
- **Backend:** Node.js 22 + Express 4 + TypeScript 5.6; JWT y bcrypt para autenticación; Multer para fotos. Ver [arquitectura del backend](docs/arquitectura/backend.md).
- **Base de datos:** **SQLite** con Prisma ORM 5.22 (archivo local, sin servidor externo).
- **Intercambio:** API REST con JSON. Contratos en [docs/arquitectura/contratos-api.md](docs/arquitectura/contratos-api.md).
- **Diseño:** Figma; mapa provincial con GeoJSON y catálogo territorial INEC DPA 2026.
- **Gestión y pruebas:** GitHub Issues/PR; Playwright para pruebas automatizadas del frontend; casos de prueba documentados con la plantilla docente.

**Identificación automática por fotografía:** no forma parte de los flujos actuales y no debe presentarse como existente. El Espejo Digital usa la especie seleccionada y la etapa declarada por la persona; el sistema no valida automáticamente la identidad botánica. Requiere revisión de fuentes y no sustituye criterio sanitario. Una identificación automática siempre requiere confirmación del usuario y no constituye consejo médico.

### ▶️ Ejecutar la aplicación

Requiere Node.js 20.19+ o 22 LTS y npm. Se usan **dos terminales**: primero el backend y luego el frontend.

**1. Backend** (API en `http://localhost:3000`):

```bash
git clone https://github.com/ItsLeonel/OptiCode-Kawsapacha.git
cd OptiCode-Kawsapacha/backend
cp .env.example .env          # PowerShell: Copy-Item .env.example .env
npm install
npx prisma migrate deploy     # crea o actualiza la base SQLite sin perder datos (o: npx prisma migrate dev)
npm run prisma:seed           # carga el catálogo regional (30 entradas) y asegura admin1/admin2
npm run dev
```

Comprobar: `http://localhost:3000/api/health` debe responder `"status": "ok"`.

**2. Frontend** (en otra terminal):

```bash
cd OptiCode-Kawsapacha/frontend
npm install
npm run dev
```

Abrir `http://localhost:5173`. Vite redirige las llamadas `/api` al backend en el puerto 3000. Si el backend no está encendido, la aplicación lo indica y solo funciona el modo visitante.

Para comprobar tipos y compilación, en cada carpeta: `npm run typecheck` y `npm run build`. Más detalles en [backend/README.md](backend/README.md) y [frontend/README.md](frontend/README.md).

> El `JWT_SECRET` de `.env.example` es solo para desarrollo local.

## 👤 Cuentas, Credenciales en Base de Datos y Actualización de SQLite

> 📘 **Guía completa:** revisa [docs/CREDENCIALES-Y-ACTUALIZACION-BD.md](docs/CREDENCIALES-Y-ACTUALIZACION-BD.md) para ver el detalle de credenciales administrativas, creación de cuentas desde la app y actualización desde versiones anteriores de la base de datos.

### 1. Credenciales grabadas en la base de datos (`ADMIN_TECNICO`)

Al ejecutar `npm run prisma:seed` en `backend/`, además de las 30 fichas del catálogo medicinal regional, se aseguran de forma no destructiva las dos cuentas técnicas iniciales en la tabla `users`:

| Nombre | Correo | Contraseña | Rol global | Panel |
|---|---|---|---|---|
| **Administrador Técnico 1** | `admin1@mail.com` | `Password123` | `ADMIN_TECNICO` | `#admin-tecnico` |
| **Administrador Técnico 2** | `admin2@mail.com` | `Password123` | `ADMIN_TECNICO` | `#admin-tecnico` |

*(Opcional: `npx ts-node src/scripts/bootstrap-admin.ts` permite aprovisionar un `ADMIN_TECNICO` distinto pasando `<email> <password> "<nombre>"`, o usa por defecto `admin.tecnico@kawsapacha.gob.ec` / `AdminTecnico2026*`.)*

### 2. Cuentas creadas desde el programa (`ADMIN_MSP` y `USUARIO`)

- **Funcionarios MSP (`ADMIN_MSP`):** se crean desde la interfaz web iniciando sesión como `admin1@mail.com` o `admin2@mail.com` en `#admin-tecnico` (gestión de usuarios / alta MSP).
- **Usuarios comunitarios (`USUARIO`):** se crean directamente desde la pantalla de bienvenida en la pestaña **"Crear cuenta"**. Se sugieren las siguientes cuentas para probar distintos escenarios:

| Nombre | Correo Sugerido | Contraseña Sugerida | Rol Comunitario | Escenario de Prueba |
|---|---|---|---|---|
| **Ronny Veloz** | `ronny@kawsapacha.ec` | `Password123` | **RESPONSABLE** | Crear la primera comunidad y registrar el huerto real. Cuenta con permisos para invitar miembros, cambiar roles y administrar el huerto. |
| **María Quispe** | `maria@mail.com` | `Password123` | **PARTICIPANTE** | Unirse a la comunidad invitada (puede sembrar, cuidar y cosechar) y probar el botón para crear una comunidad propia (selector multi-comunidad). |
| **Carlos Sanchez** | `carlos@kawsapacha.ec` | `Password123` | **PARTICIPANTE** | Recibir invitación a la comunidad y probar la campana de notificaciones (aceptar/rechazar). |
| **Juan Lopez** | `juan@mail.com` | `Password123` | **PARTICIPANTE** | Usuario independiente con estado inicial limpio (0 comunidades y 0 huertos) para verificar aislamiento de datos. |

### 3. Cómo pasar de una base de datos antigua a la versión actual (paso a paso)

Si ya tienes una base SQLite de una versión anterior (por ejemplo de V1 o de ramas previas) y quieres **actualizarla conservando tus usuarios, comunidades, huertos, plantas y fotos**:

1. **Detén el servidor backend** (`Ctrl + C` en la terminal donde corría `npm run dev`) para evitar bloqueos de lectura/escritura en SQLite.
2. **Verifica la ruta de tu base antigua en `backend/.env`:**
   - Prisma resuelve `DATABASE_URL` respecto a `backend/prisma/schema.prisma`. Por defecto `.env.example` usa `DATABASE_URL="file:./kawsapacha.db"`, que corresponde al archivo `backend/prisma/kawsapacha.db`.
   - Si tu versión anterior guardaba los datos en otro archivo (por ejemplo `backend/prisma/dev.db`), copia ese archivo como `backend/prisma/kawsapacha.db` o ajusta `DATABASE_URL` en `backend/.env` antes de migrar.
3. **Haz una copia de respaldo** de la base y de **todo** `backend/uploads/` (fotos de plantas, actividades y comunidades) antes de migrar. Detén el backend primero y comprueba el respaldo:
   ```powershell
   # Windows PowerShell (desde OptiCode-Kawsapacha/backend)
   Copy-Item prisma/kawsapacha.db prisma/kawsapacha.db.bak
   Copy-Item uploads uploads-backup -Recurse
   ```
   ```bash
   # Linux / macOS (desde OptiCode-Kawsapacha/backend)
   cp prisma/kawsapacha.db prisma/kawsapacha.db.bak
   cp -a uploads uploads-backup
   ```
4. **Instala dependencias y revisa qué migraciones faltan:**
   ```bash
   cd OptiCode-Kawsapacha/backend
   npm install
   npx prisma migrate status
   ```
   Verás listadas las migraciones pendientes (por ejemplo `20261114044500_catalogo_medicinal_regional` y `20261114190000_fase4_5_msp_moderacion_auditoria_y_espejo_v2`).
5. **Aplica las migraciones de forma aditiva (sin borrar registros):**
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```
   Esto agrega las nuevas tablas (`notifications`, `audit_logs`, `reward_rules`, `mission_definitions`, `msp_institutional_events`, `msp_educational_resources`) y las columnas nuevas en `users`, `communities`, `cultivated_plants`, `garden_activities`, `reward_ledgers` y `medicinal_catalog`, preservando tus filas existentes.
6. **Actualiza el catálogo medicinal y asegura las cuentas técnicas (`admin1` y `admin2`):**
   ```bash
   npm run prisma:seed
   ```
   Este comando actualiza las 30 especies del catálogo regional manteniendo intactos los 8 IDs históricos y crea `admin1@mail.com` y `admin2@mail.com` (`Password123`, rol `ADMIN_TECNICO`) únicamente si aún no existen en tu base.
7. **Verifica qué sucede con los datos antiguos y posibles casos especiales:**
   - **Estados iniciales tras migrar desde V1:** las comunidades, plantas y actividades creadas antes de Fase 4.5 reciben automáticamente `status = 'PENDING'` / `reviewStatus = 'PENDING'`. Inicia sesión con `admin1@mail.com` (`Password123`) o crea una cuenta `ADMIN_MSP` para aprobarlas en `#admin-msp`.
   - **Si aparece `duplicate column name` o falla una migración:** **detén el proceso; no ejecutes `migrate resolve --applied` a ciegas.** Ese error puede indicar una base modificada con `prisma db push` o un esquema parcialmente aplicado. Conserva la copia `.bak` y `backend/uploads/`, consulta `npx prisma migrate status` e inspecciona en una **copia de la BD** el esquema y `_prisma_migrations`. Solo un responsable técnico debe marcar **la migración específica** como aplicada después de comprobar que **todos** sus cambios ya existen; de lo contrario se omitirían columnas o tablas necesarias. Si no está claro, restaura el respaldo y revisa la migración antes de reintentar.
   - **Si prefieres empezar con una BD nueva sin conservar datos antiguos:** ejecuta `npx prisma migrate reset --force` y luego `npm run prisma:seed`.
8. **Comprueba que todo quedó operativo:** levanta `npm run dev` en `backend/` y `frontend/`, verifica `http://localhost:3000/api/health` (`"status": "ok"`) e inicia sesión con `admin1@mail.com` / `Password123` o con tus cuentas comunitarias previas. Más detalles y ejemplos en [docs/CREDENCIALES-Y-ACTUALIZACION-BD.md](docs/CREDENCIALES-Y-ACTUALIZACION-BD.md).




## ✅ Reglas para trabajar desde hoy

1. Entrar a [Issues](https://github.com/ItsLeonel/OptiCode-Kawsapacha/issues), abrir las tareas asignadas y revisar sus **criterios de aceptación**.
2. Cambiar el estado a **In Progress** en Projects al comenzar, si el Issue está vinculado al tablero.
3. Crear una **rama por tarea**, subir avances y abrir un **Pull Request** indicando el Issue relacionado. No trabajar directamente en `main`.
4. Comunicar bloqueos temprano y compartir las decisiones, diseños, pruebas y evidencias con **Leonardo**, responsable del informe.
5. Marcar **Done** o cerrar un Issue **solo cuando su entregable esté verificado**. No inventar resultados de pruebas.

## 📆 Objetivos y entrega

| Fecha objetivo | Resultado |
|---|---|
| **4 nov.** | Diseño prioritario, primeras historias, arquitectura acordada y proyectos frontend/backend funcionando localmente. |
| **6 nov.** | Flujo principal de los cinco módulos desarrollado e integrado. |
| **8 nov.** | Pruebas ejecutadas, correcciones y documentación final consolidada. |
| **10 nov.** | Demostración y entrega de V1. |

> El milestone de preparación M1 tenía fecha 30 de octubre y ya venció: las tareas que sigan pendientes deben atenderse ahora, sin frenar el desarrollo paralelo.

## 📁 Documentación y entregables

- [Credenciales en BD y actualización de SQLite](docs/CREDENCIALES-Y-ACTUALIZACION-BD.md)
- [Alcance de V1](docs/analisis/alcance-v1.md)
- [Estado y trazabilidad del cliente (14/11/2026)](docs/analisis/trazabilidad-cliente-2026-11-14.md)
- [Contrato propuesto de integración Espejo Digital V2](docs/arquitectura/contrato-espejo-digital-v2.md)
- [Plan de pruebas manuales ciclo agrícola V2](docs/casos-prueba/ciclo-agricola-v2-manual.md)
- [Despliegue reproducible Docker y HTTPS (aún no público)](docs/arquitectura/despliegue-docker-https.md)
- [Historias de usuario V1](docs/historias-usuario/historias-usuario-v1.md)
- [Arquitectura del backend](docs/arquitectura/backend.md) y [contratos de API](docs/arquitectura/contratos-api.md)
- [Lineamientos MSP aplicados](docs/analisis/lineamientos-msp-aplicados.md) · [Preguntas al cliente](docs/analisis/preguntas-al-cliente.md) · [Dudas y decisiones](docs/analisis/dudas-y-decisiones-pendientes.md)
- [Esquema del informe final](docs/informe/esquema-informe-v1.md)
- [Organización de documentos](docs/README.md)
- [Reglas de trabajo](docs/organizacion/REGLAS-DE-TRABAJO.md)
- [Distribución de responsabilidades](docs/organizacion/REPARTO-DE-TAREAS-V1.md)
- [Issues y avances](https://github.com/ItsLeonel/OptiCode-Kawsapacha/issues)

**La entrega académica requiere:** historias de usuario, arquitectura y diseño, tecnologías, código, producto operativo, casos de prueba **ejecutados con resultados y evidencias**, instrucciones de ejecución e informe PDF final. **Leonardo consolida el informe; Leonel revisa y realiza la entrega oficial.**
