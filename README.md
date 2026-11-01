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

> **Estado actual:** los [PR #17 (documentación)](https://github.com/ItsLeonel/OptiCode-Kawsapacha/pull/17) y [#18 (frontend inicial)](https://github.com/ItsLeonel/OptiCode-Kawsapacha/pull/18) ya están fusionados en `main`. El frontend existente **es un prototipo**: todavía no tiene autenticación real, API, base de datos ni subida de imágenes al servidor. **Nadie debe dar por completada la V1.**

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

- **Frontend ya iniciado:** React 19 + TypeScript + Vite 7.
- **Backend propuesto (pendiente de confirmar en #4):** Node.js + Express + TypeScript.
- **Base de datos propuesta:** PostgreSQL + Prisma ORM.
- **Intercambio:** API REST con JSON. Leonel y Ronny deben acordar rutas, formatos, validaciones y errores antes de integrar.
- **Diseño:** Figma; para mapa y huerto virtual, SVG/GeoJSON y componentes React.
- **Gestión y pruebas:** GitHub Issues/Projects/PR, Postman o equivalente y casos de prueba documentados.

**Mejoras opcionales, no bloqueantes de V1:** historial de fotos en el Pasaporte Vivo, sugerencias de especies según región e identificación asistida por Pl@ntNet. Solo se incorporan cuando el flujo principal funcione y quede tiempo para probarlas. Una identificación automática siempre requiere confirmación del usuario y no constituye consejo médico.

### ▶️ Ejecutar el frontend actual

Requiere Node.js compatible con Vite 7 y npm.

```bash
git clone https://github.com/ItsLeonel/OptiCode-Kawsapacha.git
cd OptiCode-Kawsapacha/frontend
npm install
npm run dev
```

Abrir la URL local que indique Vite. Para comprobar tipos y compilación:

```bash
npm run typecheck
npm run build
```

Más detalles en [frontend/README.md](frontend/README.md).

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
- [Organización de documentos](docs/README.md)
- [Reglas de trabajo](docs/organizacion/REGLAS-DE-TRABAJO.md)
- [Distribución de responsabilidades](docs/organizacion/REPARTO-DE-TAREAS-V1.md)
- [Issues y avances](https://github.com/ItsLeonel/OptiCode-Kawsapacha/issues)

**La entrega académica requiere:** historias de usuario, arquitectura y diseño, tecnologías, código, producto operativo, casos de prueba **ejecutados con resultados y evidencias**, instrucciones de ejecución e informe PDF final. **Leonardo consolida el informe; Leonel revisa y realiza la entrega oficial.**
