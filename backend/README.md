# 🌱 Kawsapacha — Backend API REST (V1)

**Módulo:** Backend, Base de Datos SQLite, Servicios y Persistencia  
**Responsable:** Ronny Veloz (`Rodni15`) — Issues [#4 ARQ-001](https://github.com/ItsLeonel/OptiCode-Kawsapacha/issues/4), [#7 DEV-002](https://github.com/ItsLeonel/OptiCode-Kawsapacha/issues/7)  
**Tecnologías:** Node.js 22 LTS · Express · TypeScript · Prisma ORM · SQLite · JWT · Multer  

---

## 📋 Requisitos Previos

- **Node.js:** Versión 20+ o 22 LTS (comprobado con Node 22 / 24)
- **npm:** Versión 10+ u 11+
- **No se requiere Docker ni PostgreSQL:** Toda la base de datos se almacena en el archivo local embebido `prisma/kawsapacha.db`.

---

## 🚀 Instalación y Puesta en Marcha

### 1. Clonar el repositorio y entrar a la carpeta backend:
```bash
git clone https://github.com/ItsLeonel/OptiCode-Kawsapacha.git
cd OptiCode-Kawsapacha/backend
```

### 2. Configurar variables de entorno:
El proyecto incluye un archivo `.env.example`. Crea tu archivo `.env` local:
```bash
cp .env.example .env
```
*(En Windows PowerShell: `Copy-Item .env.example .env`)*

El archivo `.env` por defecto contiene:
```env
DATABASE_URL="file:./prisma/kawsapacha.db"
PORT=3000
JWT_SECRET=kawsapacha_dev_secret_ronny_v1_2026
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

### 3. Instalar dependencias:
```bash
npm install
```

### 4. Inicializar la base de datos y sembrar el catálogo:
```bash
# Aplica las migraciones de SQLite
npx prisma migrate dev

# Siembra las 8 especies medicinales andinas iniciales
npm run prisma:seed
```

### 5. Iniciar el servidor:

- **Modo Desarrollo (con recarga automática):**
  ```bash
  npm run dev
  ```
- **Modo Producción / Compilado:**
  ```bash
  npm run build
  npm start
  ```

El servidor estará escuchando en `http://localhost:3000`.

---

## 🩺 Verificación de Salud (Healthcheck)

Comprobar que el backend y SQLite están activos:
- **URL:** `http://localhost:3000/api/health`
- **Respuesta esperada:**
  ```json
  {
    "status": "ok",
    "service": "kawsapacha-backend",
    "db": "connected",
    "timestamp": "2026-11-04T00:18:06.841Z"
  }
  ```

---

## 📜 Scripts Disponibles

| Script | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor con recarga en caliente (`ts-node-dev`). |
| `npm run build` | Compila TypeScript a JavaScript nativo en `dist/`. |
| `npm start` | Ejecuta el código compilado desde `dist/app.js`. |
| `npm run typecheck` | Valida los tipos TypeScript sin generar archivos (`tsc --noEmit`). |
| `npm run prisma:migrate`| Ejecuta migraciones de Prisma en SQLite. |
| `npm run prisma:seed` | Puebla el catálogo botánico con las 8 especies medicinales. |
| `npm run prisma:studio`| Abre la interfaz gráfica visual de Prisma Studio para inspeccionar la base de datos. |

---

## 📁 Estructura del Código

```text
backend/
├── prisma/
│   ├── schema.prisma       # Esquema SQLite y modelos
│   ├── seed.ts             # Datos iniciales del catálogo
│   └── kawsapacha.db       # Archivo de base de datos local
├── src/
│   ├── config/             # Configuración de entorno y cliente Prisma
│   ├── controllers/        # Controladores de las rutas REST
│   ├── middlewares/        # JWT auth, subida de fotos (multer) y errores
│   ├── routes/             # Enrutadores Express por módulo
│   ├── services/           # Lógica de negocio del dominio
│   ├── types/              # Definiciones de tipos TypeScript
│   ├── utils/              # Funciones auxiliares (JWT, respuestas)
│   └── app.ts              # Inicialización de Express y middlewares
├── uploads/
│   └── plants/             # Almacenamiento local de fotografías
├── package.json
└── tsconfig.json
```

---

## 🔗 Contratos de API
La especificación detallada de cada endpoint, códigos de respuesta y formatos de solicitud se encuentra documentada en:
👉 [docs/arquitectura/contratos-api.md](../docs/arquitectura/contratos-api.md)
