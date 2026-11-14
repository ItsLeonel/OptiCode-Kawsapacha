# Kawsapacha — Despliegue reproducible Docker + HTTPS (preparación de #49)

**Estado:** archivos configurados para pruebas de integración; **no se ha publicado un servidor real ni se ha validado con un teléfono físico**. Responsable de despliegue y evidencias: @TonyTiago (issue #49); integración backend: @Rodni15; aprobación de PM: @ItsLeonel.

## Arquitectura

```text
Android / navegador HTTPS
    → Caddy (80/443; SPA React y proxy mismo origen)
        ├─ /api/*      → api:3000 (Express + Prisma)
        ├─ /uploads/*  → api:3000 (TEMPORAL; pendiente #35 acceso seguro)
        └─ /*          → /srv (frontend compilado; SPA fallback)
    → SQLite `sqlite_data` (volumen persistente)
    → Fotografías `uploads_data` (volumen persistente)
```

## Arranque local con Docker

Requisitos: Docker Engine y Compose v2. En la raíz del repositorio:

```bash
cp deploy/.env.compose.example .env
# EDITA .env: JWT_SECRET único de alta entropía
docker compose config -q
docker compose up --build -d
curl --fail http://localhost/api/health
```

Comprobar `http://localhost` (sin garantía de cámara WebRTC: HTTP local no es acceso HTTPS remoto). El backend **migra la base sin borrarla** al arrancar y la conserva en `sqlite_data`. Solo para una instalación nueva, y después de confirmar el respaldo:

```bash
docker compose exec api node_modules/.bin/ts-node prisma/seed.ts
```

No ejecutar el seed de ejemplo sobre una base real sin revisar su comportamiento. Para visualizar logs: `docker compose logs -f api web`.

## HTTPS con dominio

Configurar DNS A/AAAA y abrir puertos TCP 80, 443 (y opcionalmente UDP 443). En `.env`: `SITE_ADDRESS=huerto.tudominio.ec`, `PUBLIC_ORIGIN=https://huerto.tudominio.ec` y `JWT_SECRET` fuerte. Caddy solicita/renueva certificados confiables automáticamente si existe resolución pública válida; **no garantiza certificado sin DNS ni conectividad**. Probar `https://huerto.tudominio.ec/api/health`, registrar una cuenta de prueba y verificar frontend/API/fotos desde otro equipo.

No exponer el puerto 3000 del backend ni la base SQLite: solo 80/443 se publican al host. El servidor admite el origen público **explícito** configurado, además de los orígenes de desarrollo LAN que conserva para la demo. La instancia pública debe reforzar su CORS, rate limits y políticas de seguridad antes de habilitar usuarios reales.

## Pendientes obligatorios antes de producción real

- **P0 #35/#43:** proteger las fotografías de evidencia (actualmente el backend monta `/uploads` de forma pública), observaciones y Bitácora en SQLite; prueba de permisos/propiedad, idempotencia y recuperación móvil → PC.
- **P0 #45:** RBAC administrativo MSP/técnico, MFA y auditoría del lado del servidor.
- **P0 #49 Santiago:** servidor/domino/DNS efectivos, HTTPS confiable, respaldo/restauración de SQLite + uploads, hardening y prueba de captura móvil. Ninguna acción de infraestructura externa se ha ejecutado aquí.
- **QA #14:** registrar resultados reales (aprobado/fallido/bloqueado) sin suponer que un Dockerfile equivale a una demo exitosa.

**Respaldo:** copiar ambos volúmenes `sqlite_data` y `uploads_data` en una operación coordinada, detener escrituras o usar un procedimiento SQLite consistente, verificar restauración y mantener copia fuera del servidor. No usar `docker compose down -v` en producción (elimina volúmenes y datos).
