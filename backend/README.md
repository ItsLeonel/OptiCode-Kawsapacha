# 🛠️ Kawsapacha — Backend y API REST

**Servidor, reglas de negocio y persistencia** de [Kawsapacha: Mi Huerto Vivo](../README.md). Proporciona servicios para cuentas, comunidades, huertos, plantas medicinales, fotografías, actividades agrícolas, recompensas y funciones institucionales.

**Tecnologías principales:** Node.js, Express 4, TypeScript 5.6, Prisma 5.22 y SQLite; autenticación mediante JWT y contraseñas almacenadas con hash bcrypt. Las versiones de instalación están registradas en `package-lock.json`.

## 🏛️ Arquitectura

El backend es un **monolito modular con principios de Clean Architecture**: un solo servicio Express, organizado internamente por capacidades de negocio. No son microservicios.

Cada módulo separa, cuando corresponde:

| Capa | Responsabilidad |
| --- | --- |
| `domain/` | Entidades y reglas de negocio, independientes de HTTP y Prisma. |
| `application/` | Casos de uso y contratos (`ports`) para sus dependencias. |
| `infrastructure/` | Adaptadores de persistencia y servicios técnicos. |
| `presentation/` | Rutas, controladores y entrada/salida HTTP. |

Los módulos se ensamblan en sus puntos de composición y desde `src/app/router.ts`. La infraestructura implementa contratos requeridos por los casos de uso, evitando que la lógica central dependa directamente del framework web o del ORM.

### Módulos actuales

| Área | Módulos |
| --- | --- |
| Identidad | `auth`, `users` |
| Comunidad y cultivo | `communities`, `gardens`, `plants`, `activities`, `harvest` |
| Apoyo agrícola | `catalog`, `lunar-calendar` |
| Institucional y transversal | `administration`, `rewards`, `notifications`, `media` |

**Total: 13 módulos** en `src/modules/`. Para ver relaciones, excepciones y decisiones arquitectónicas: [docs/architecture/README.md](../docs/architecture/README.md).

## 🚀 Instalación local

### Requisitos

- Node.js **20.19+** o **22.12+** (o versión posterior compatible) y npm.
- El repositorio clonado y acceso a la terminal.
- SQLite se gestiona como un archivo mediante Prisma; **no es necesario instalar PostgreSQL**.
- Docker es opcional para desarrollo local; la infraestructura con contenedores tiene una [guía independiente](../docs/arquitectura/despliegue-docker-https.md).

Desde la raíz del proyecto:

```bash
cd backend
npm ci
```

### 1. Configurar el entorno

Copia la plantilla local:

```bash
cp .env.example .env
```

En **Windows PowerShell**: `Copy-Item .env.example .env`.

Revisa las variables descritas en [`.env.example`](.env.example):

| Variable | Para qué sirve |
| --- | --- |
| `DATABASE_URL` | Ruta de la base SQLite, declarada con formato `file:`. |
| `PORT` | Puerto HTTP del backend; normalmente `3000`. |
| `JWT_SECRET` | Clave privada de firma de tokens: usar un valor **único, largo y secreto**. |
| `JWT_EXPIRES_IN` | Tiempo de expiración del token. |
| `CORS_ORIGIN` | Origen autorizado del frontend; normalmente `http://localhost:5173`. |
| `UPLOADS_DIR` | Directorio de fotografías, opcional; debe persistirse y respaldarse. |

**No subas `.env`, claves, tokens, bases SQLite ni fotografías privadas al repositorio.** El valor de `JWT_SECRET` del ejemplo es solamente un marcador y debe reemplazarse incluso en entornos compartidos.

Prisma resuelve `file:./kawsapacha.db` **en relación con `backend/prisma/`**; no hay que confundir esa ruta con un archivo ubicado en la raíz de `backend/`.

### 2. Preparar la base de datos

```bash
npx prisma generate
npx prisma migrate deploy
```

Estas migraciones crean o actualizan el esquema siguiendo el historial de `prisma/migrations/`. **Antes de migrar una base existente, respalda SQLite y todo el directorio de fotografías**. No ejecutes `prisma migrate reset` sobre datos que debas conservar.

**Carga inicial opcional, solo para una instalación local de prueba:**

```bash
npm run prisma:seed
```

Este seed sincroniza el catálogo medicinal regional, **pero también crea cuentas administrativas de demostración con credenciales predefinidas** si aún no existen. **No ejecutes el seed sin modificar su comportamiento en un servidor público, de clase compartido o con datos reales.** Primero elimina ese aprovisionamiento inseguro o reemplázalo por un alta administrativa segura.

### 3. Arrancar el backend

```bash
npm run dev
```

La API queda normalmente en **http://localhost:3000**.

Comprobar salud y conexión con SQLite:

```bash
curl http://localhost:3000/api/health
```

Una respuesta saludable incluye `"status": "ok"` y `"db": "connected"`; ante un problema de base de datos devuelve un estado de error.

### 4. Iniciar el frontend

En otra terminal, desde la raíz del repositorio:

```bash
cd frontend
npm ci
npm run dev
```

Abre **http://localhost:5173**. Vite reenvía `/api` y `/uploads` al puerto del backend en desarrollo. Consulta el [README frontend](../frontend/README.md).

## 🔗 Contratos HTTP

El servidor se configura en `src/app.ts` y registra sus rutas bajo el prefijo **`/api`** mediante `src/app/router.ts`.

Rutas existentes de referencia (según permisos):

| Recurso | Ejemplo |
| --- | --- |
| Salud del servicio | `GET /api/health` |
| Autenticación | `POST /api/auth/register`, `POST /api/auth/login` |
| Comunidades | `/api/communities` |
| Huertos reales | `/api/gardens` |
| Plantas | `/api/plants` |
| Catálogo medicinal | `/api/catalog` |
| Actividades del huerto | `/api/gardens/:gardenId/activities` |
| Calendario lunar | `/api/lunar-calendar` |
| Paneles institucionales | `/api/admin` |
| Notificaciones | `/api/notifications` |

La lista muestra **grupos de rutas**, no garantiza que todos los métodos HTTP estén habilitados en cada uno. Para formatos, validación y errores, revisa [los contratos de API documentados](../docs/arquitectura/contratos-api.md) y los controladores actuales.

## 🗂️ Estructura del backend

```text
backend/
├── prisma/
│   ├── schema.prisma       # Modelos y relaciones
│   ├── migrations/         # Migraciones versionadas
│   ├── regional-species.json
│   └── seed.ts             # Datos iniciales para desarrollo
├── src/
│   ├── app.ts              # Configuración e inicio de Express
│   ├── app/                # Composición y montaje de rutas
│   ├── modules/            # 13 módulos de negocio
│   ├── infrastructure/     # Configuración y base de datos
│   └── shared/             # Middlewares y utilidades técnicas
├── tests/                  # Pruebas del backend
├── uploads/                # Archivos de medios, no incluir datos reales en Git
└── package.json
```

La aplicación usa SQLite para los registros estructurados y archivos en el directorio de medios para las fotografías; ambos requieren respaldo coordinado.

## ✅ Comandos de desarrollo y calidad

Desde `backend/`:

```bash
npm run typecheck
npm run build
npm test
npm run test:activities
npm run check:architecture
```

| Comando | Propósito |
| --- | --- |
| `npm run dev` | Iniciar el servidor de desarrollo con recarga. |
| `npm run build` / `npm start` | Compilar e iniciar el JavaScript de `dist/`. |
| `npm run typecheck` | Validación de tipos TypeScript. |
| `npm test` | Compilar y ejecutar las pruebas configuradas con Node Test Runner. |
| `npm run test:activities` | Suite especializada del ciclo agrícola. |
| `npm run check:architecture` | Comprobar reglas de dependencia y ciclos entre módulos. |
| `npm run prisma:studio` | Examinar la base local con Prisma Studio. |
| `npx prisma migrate status` | Consultar el estado de las migraciones. |

La integración continua ejecuta comprobaciones adicionales, pero un CI aprobado **no reemplaza pruebas manuales con un entorno y datos representativos**. Consulta [evidencias de calidad](../docs/quality/README.md).

## 🔐 Seguridad y publicación

**Este repositorio es académico y no debe considerarse listo para admitir datos personales reales en Internet sin revisión adicional.**

- **Autenticación y permisos:** los endpoints protegidos usan JWT y comprobaciones de autorización según el recurso y rol.
- **Fotografías:** actualmente `src/app.ts` publica el directorio de fotos mediante `/uploads` como contenido estático. **No presupongas privacidad por URL**; hay que proteger el acceso a imágenes sensibles antes de abrir la aplicación a usuarios reales.
- **Seed de demostración:** crea cuentas administrativas predefinidas. **No utilizar en producción** sin modificarlo y asegurar las credenciales.
- **CORS:** se permite el origen configurado y ciertos orígenes de desarrollo; antes de producción hay que revisar y restringir estas reglas.
- **HTTPS, respaldos y volúmenes:** en el despliegue deben existir TLS confiable, secretos seguros, almacenamiento persistente de SQLite/fotos, recuperación probada y controles de acceso.

La configuración Docker/Caddy y las tareas pendientes se explican en la [guía de despliegue](../docs/arquitectura/despliegue-docker-https.md). El código desplegable no demuestra por sí solo que exista una URL pública segura.

## 📚 Documentación relacionada

- [README principal — presentación del producto](../README.md)
- [README frontend — React, Phaser y pruebas](../frontend/README.md)
- [Arquitectura y decisiones](../docs/architecture/README.md)
- [Modelo de datos](prisma/schema.prisma)
- [Contratos de la API](../docs/arquitectura/contratos-api.md)
- [Calidad y pruebas](../docs/quality/README.md)
- [Despliegue Docker/HTTPS](../docs/arquitectura/despliegue-docker-https.md)

---

**Equipo OptiCode · Escuela Politécnica Nacional · Proyecto académico Kawsapacha**
