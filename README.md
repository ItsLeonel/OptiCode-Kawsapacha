# 🌱 Kawsapacha — Mi Huerto Vivo | Equipo OptiCode

**Calidad de Software · EPN · Versión 1 · Demostración: 10 de noviembre de 2026**

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

Todos los **16 Issues ya tienen responsables asignados**. Cada persona debe revisar sus actividades, criterios de aceptación y entregables.

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

**Mejoras opcionales, no bloqueantes de V1:** historial de fotos en el Pasaporte Vivo, sugerencias de especies según región e identificación asistida por Pl@ntNet. Solo se incorporan cuando el flujo principal funcione y quede tiempo para probarlas. Una identificación automática siempre requiere confirmación del usuario y no constituye consejo médico.

### ▶️ Ejecutar la aplicación

Requiere Node.js 20.19+ o 22 LTS y npm. Se usan **dos terminales**: primero el backend y luego el frontend.

**1. Backend** (API en `http://localhost:3000`):

```bash
git clone https://github.com/ItsLeonel/OptiCode-Kawsapacha.git
cd OptiCode-Kawsapacha/backend
cp .env.example .env          # PowerShell: Copy-Item .env.example .env
npm install
npx prisma migrate dev        # crea la base SQLite
npm run prisma:seed           # carga las 8 especies del catálogo
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

## 👤 Cuentas y Credenciales Sugeridas para Pruebas

> ℹ️ **Nota para el evaluador o revisor:** La base de datos local SQLite se inicia limpia. Para probar el flujo completo de punta a punta, la persona que realice las pruebas debe **crear las cuentas desde la pestaña "Crear cuenta"** en la pantalla de bienvenida. Se sugieren las siguientes cuentas para validar los diferentes roles y escenarios:

| Nombre | Correo Sugerido | Contraseña Sugerida | Rol Comunitario | Escenario de Prueba |
|---|---|---|---|---|
| **Ronny Veloz** | `ronny@kawsapacha.ec` | `Password123` | **RESPONSABLE** | Crear la primera comunidad y registrar el huerto real. Cuenta con permisos para invitar miembros, cambiar roles y administrar el huerto. |
| **María Quispe** | `maria@mail.com` | `Password123` | **PARTICIPANTE** | Unirse a la comunidad invitada (puede sembrar, cuidar y cosechar) y probar el botón para crear una comunidad propia (selector multi-comunidad). |
| **Carlos Sanchez** | `carlos@kawsapacha.ec` | `Password123` | **PARTICIPANTE** | Recibir invitación a la comunidad y probar la campana de notificaciones (aceptar/rechazar). |
| **Juan Lopez** | `juan@mail.com` | `Password123` | **PARTICIPANTE** | Usuario independiente con estado inicial limpio (0 comunidades y 0 huertos) para verificar aislamiento de datos. |




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

- [Alcance de V1](docs/analisis/alcance-v1.md)
- [Historias de usuario V1](docs/historias-usuario/historias-usuario-v1.md)
- [Arquitectura del backend](docs/arquitectura/backend.md) y [contratos de API](docs/arquitectura/contratos-api.md)
- [Lineamientos MSP aplicados](docs/analisis/lineamientos-msp-aplicados.md) · [Preguntas al cliente](docs/analisis/preguntas-al-cliente.md) · [Dudas y decisiones](docs/analisis/dudas-y-decisiones-pendientes.md)
- [Esquema del informe final](docs/informe/esquema-informe-v1.md)
- [Organización de documentos](docs/README.md)
- [Reglas de trabajo](docs/organizacion/REGLAS-DE-TRABAJO.md)
- [Distribución de responsabilidades](docs/organizacion/REPARTO-DE-TAREAS-V1.md)
- [Issues y avances](https://github.com/ItsLeonel/OptiCode-Kawsapacha/issues)

**La entrega académica requiere:** historias de usuario, arquitectura y diseño, tecnologías, código, producto operativo, casos de prueba **ejecutados con resultados y evidencias**, instrucciones de ejecución e informe PDF final. **Leonardo consolida el informe; Leonel revisa y realiza la entrega oficial.**
