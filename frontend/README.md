# 🌱 Kawsapacha — Frontend

**Interfaz web y jardín virtual interactivo** de [Kawsapacha: Mi Huerto Vivo](../README.md). Aquí se implementan las pantallas, la navegación, la comunicación con la API y la representación visual de los cultivos.

**Tecnologías principales:** React 19, TypeScript 5.9, Vite 7, Phaser 3.90, Leaflet y React Leaflet. Las versiones exactas de instalación están definidas en `package-lock.json`.

## 🧭 ¿Qué hace el frontend?

- Permite crear una cuenta, iniciar sesión y gestionar comunidades y huertos.
- Presenta el catálogo de plantas medicinales, el calendario y las actividades agrícolas.
- Integra **Mi Jardín Vivo** con seis parcelas, paisajes de las cuatro regiones del Ecuador y modalidades de cultivo en tierra, macetas, vertical y colgante.
- Permite registrar fotografías, observaciones y actividades, y consultar el **Pasaporte Vivo**, la Bitácora y el progreso.
- Ofrece pantallas institucionales de administración, sujetas a la autenticación y permisos del backend.

**React** maneja formularios, paneles, navegación y estado de la interfaz. **Phaser** renderiza el jardín 2D. El intercambio entre ambos utiliza modelos, adaptadores y un puente de comandos/eventos: Phaser no consulta la API directamente.

## ▶️ Ejecutar en desarrollo

### Requisitos

- Node.js **20.19+** o **22.12+** (o una versión posterior compatible).
- npm y acceso al repositorio.
- Para probar autenticación y persistencia compartida, el **backend debe estar ejecutándose**; consulta [su README](../backend/README.md).

Desde la raíz del repositorio, abre **dos terminales**.

**Terminal 1 — backend:**

```bash
cd backend
npm ci
```

Configura `backend/.env` según [las instrucciones del backend](../backend/README.md); aplica las migraciones y arranca:

```bash
npx prisma generate
npx prisma migrate deploy
npm run dev
```

**Terminal 2 — frontend:**

```bash
cd frontend
npm ci
npm run dev
```

Abre **http://localhost:5173** (o la dirección que muestre Vite). El backend normalmente responde en **http://localhost:3000**.

En Windows PowerShell se pueden usar los mismos comandos; si la política de ejecución bloquea `npm`, ejecuta `npm.cmd`.

### Comunicación con la API

El archivo [`vite.config.ts`](vite.config.ts) redirige las rutas `/api` y `/uploads` al backend durante el desarrollo. Por defecto el destino es `http://localhost:3000`.

Para otro destino, configura la variable `KAWSAPACHA_API_TARGET` antes de arrancar Vite. Este **proxy es solo de desarrollo**: en producción, el servidor web debe dirigir esas rutas correctamente.

## 🗂️ Organización del código

```text
frontend/
├── src/
│   ├── app/                # Composición, navegación y coordinación
│   ├── features/
│   │   ├── auth/           # Acceso y registro
│   │   ├── communities/    # Comunidades y miembros
│   │   ├── real-gardens/   # Registro del huerto físico
│   │   ├── medicinal-catalog/
│   │   ├── my-garden/      # Jardín, plantas, actividades y Phaser
│   │   ├── notifications/
│   │   └── admin-portal/   # Vistas institucionales
│   ├── shared/             # API, contratos, UI, geografía y utilidades
│   ├── App.tsx
│   └── main.tsx
├── tests/                   # Pruebas Playwright
├── public/                  # Recursos estáticos
├── vite.config.ts
└── package.json
```

La composición general se concentra en `app/`; los módulos de `features/` representan capacidades del producto. Los contratos y recursos compartidos se ubican en `shared/`, evitando dependencias innecesarias entre funcionalidades.

Para detalles de las reglas de dependencia, consulta la [arquitectura implementada](../docs/architecture/README.md).

## 🌱 ¿Cómo se representa una planta?

1. Una persona registra una planta real, su especie y una fotografía.
2. React recoge los datos y, con sesión iniciada, los envía mediante el cliente HTTP de `src/shared/api/`.
3. El backend aplica permisos y persiste el registro y sus archivos.
4. El adaptador del jardín transforma los datos del cultivo en un modelo visual.
5. Phaser dibuja los elementos del jardín; al registrar nuevas observaciones o cuidados, la interfaz actualiza la representación y el historial.

El **Espejo Digital Evolutivo** parte de la especie y las etapas **declaradas por el usuario**. No identifica ni diagnostica plantas automáticamente mediante IA.

## 💾 Persistencia: sesión y modo visitante

| Uso | Dónde se guardan los registros |
| --- | --- |
| **Con sesión** | API Express y SQLite en el servidor; las fotografías se almacenan en archivos asociados. |
| **Visitante** | IndexedDB en el navegador, restringido a ese origen/perfil. |

Los datos de IndexedDB **no se sincronizan automáticamente** con otra computadora ni sustituyen los datos del servidor. Cambiar de navegador, protocolo, puerto o limpiar datos del sitio puede afectar los registros locales.

La representación gráfica no reemplaza la evidencia fotográfica ni asegura por sí sola que una actividad haya ocurrido físicamente.

## 🧪 Compilación y pruebas

Desde `frontend/`:

```bash
npm run typecheck
npm run build
npm run test:unit
npm run test:e2e
npm run test:garden-poc
npm run test:regional-photos
```

- `typecheck`: comprobaciones de TypeScript.
- `build`: compilación para producción en `dist/`.
- `test:unit`: suite configurada de pruebas unitarias.
- `test:e2e`: pruebas de extremo a extremo con Playwright.
- `test:garden-poc` y `test:regional-photos`: pruebas especializadas del jardín.

Para la suite sobre el build compilado, usa `npm run test:production`. Las pruebas de Playwright pueden levantar servidores locales y utilizar datos de prueba; revisa las configuraciones `playwright*.config.ts`.

**Laboratorio del jardín:** `npm run dev:garden-poc`, normalmente disponible en `http://127.0.0.1:5176/garden-lab.html`. Es una herramienta de desarrollo, no una segunda aplicación de producción.

Las pruebas automatizadas no sustituyen las comprobaciones en teléfonos reales ni la validación del despliegue público. Las mejoras móviles del [PR #74](https://github.com/ItsLeonel/OptiCode-Kawsapacha/pull/74) deben evaluarse según su estado de integración.

## 📦 Publicación y documentación

- El resultado de `npm run build` son archivos web estáticos; **no se publica el servidor de desarrollo Vite**.
- El backend y las rutas `/api` y `/uploads` deben ser accesibles detrás de un servidor web/proxy configurado.
- La preparación con Docker/Caddy se documenta en la [guía de despliegue](../docs/arquitectura/despliegue-docker-https.md). La existencia de esa configuración **no acredita por sí sola una publicación pública segura**.

### Más información

- [README principal — producto y funcionalidades](../README.md)
- [README backend — API, base de datos y seguridad](../backend/README.md)
- [Arquitectura modular y decisiones](../docs/architecture/README.md)
- [Diseño y evidencias visuales](../docs/diseno/entrega-ui-ux-v1.md)
- [Pruebas y resultados](../docs/casos-prueba/README.md)

---

**Equipo OptiCode · Escuela Politécnica Nacional · Proyecto académico Kawsapacha**
