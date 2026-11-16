# Informe de Despliegue Público con Docker y HTTPS — Kawsapacha V1
**Issue:** [#49 DEP-001](https://github.com/ItsLeonel/OptiCode-Kawsapacha/issues/49)  
**Responsable (DevOps / QA):** Santiago Guamán (`TonyTiago`)  
**Revisor (PM):** Leonel Morales (`ItsLeonel`)  
**Backend:** Ronny Veloz (`Rodni15`)  
**Documentación:** Leonardo Lugmaña (`kened-leonardo`)  
**Fecha de Despliegue y Verificación:** 15/11/2026  
**URL Pública Activa:** `https://head-lakes-efforts-vehicle.trycloudflare.com`  

---

## 1. Resumen Ejecutivo del Despliegue

En cumplimiento con la orden prioritaria del proyecto (P0), se completó la publicación y verificación operativa de la plataforma **Kawsapacha** en un entorno accesible desde internet mediante túnel seguro con certificado TLS/HTTPS. 

El despliegue integra la aplicación web completa:
1. **Frontend:** React 19 + TypeScript + Vite + Phaser 3 (servido como SPA estática optimizada en producción).
2. **Backend:** Node.js 22 + Express + TypeScript + Prisma ORM 5.22.
3. **Base de Datos:** SQLite persistente con soporte para archivos WAL.
4. **Almacenamiento:** Directorio de fotografías y evidencias `/uploads` en volumen dedicado.
5. **Proxy y Gateway:** Caddy / Docker Compose enlazado a un túnel de borde Cloudflare.

---

## 2. Topología de Despliegue y Arquitectura de Producción

Se implementó una topología de **un solo origen (Single Origin)** para evitar dependencias del servidor de desarrollo Vite y mitigar bloqueos de red:

```text
Dispositivo Externo (Smartphone 4G/5G o PC remota)
       │
       ▼ [HTTPS - TLS 1.3]
Túnel de Borde Cloudflare (cloudflared 2026.11.0)
https://head-lakes-efforts-vehicle.trycloudflare.com
       │
       ▼ [Proxy HTTP Interno]
Contenedor `web` (Caddy Web Server - Puertos 80/443)
       ├─ /*          ──► /srv (Archivos estáticos compilados de React/Phaser)
       ├─ /api/*      ──► api:3000 (Backend Express)
       └─ /uploads/*  ──► api:3000 (Archivos estáticos de fotos de plantas y huertos)
       │
       ▼
Contenedor `api` (Express + Prisma ORM)
       ├─ sqlite_data   ──► Volumen persistente SQLite (`kawsapacha.db`)
       └─ uploads_data  ──► Volumen persistente de fotos (`/app/uploads`)
```

---

## 3. Registro de Ejecución y Pasos Técnicos Realizados

### A. Construcción y Estado de Contenedores Docker
* Se construyeron las imágenes de producción utilizando `deploy/backend.Dockerfile` y `deploy/frontend.Dockerfile`.
* Se levantó la infraestructura con `docker compose up --build -d` en un host con Windows y **Docker Desktop**.
* Los contenedores `api` y `web` iniciaron correctamente y el contenedor de backend alcanzó el estado **Healthy**.

### B. Migraciones y Carga de Catálogo (Seed)
* Se ejecutaron exitosamente las **8 migraciones de Prisma** sobre la base SQLite sin reinicios destructivos (`npx prisma migrate deploy`).
* Se ejecutó el script de inicialización (`seed`), aprovisionando:
  * Las **30 fichas completas del Catálogo Medicinal Regional** (Costa, Sierra, Amazonía y Galápagos).
  * Las cuentas técnicas de administración: `admin1@mail.com` y `admin2@mail.com`.

### C. Comprobación del Endpoint de Salud
Se verificó el endpoint `/api/health` obteniendo respuesta satisfactoria:
```json
{
  "status": "ok",
  "service": "kawsapacha-backend",
  "db": "connected"
}
```

### D. Exposición Segura a Internet
* Se expuso la aplicación hacia internet utilizando **Cloudflare Quick Tunnel** (`cloudflared` versión 2026.11.0).
* Se generó la URL pública con terminación TLS automática:
  **`https://head-lakes-efforts-vehicle.trycloudflare.com`**

### E. Incidencia Detectada y Solución Aplicada (CORS)
* **Defecto observado:** Al intentar registrar nuevas cuentas de usuario desde la URL pública, las peticiones `POST /api/auth/register` eran rechazadas con un error de red debido a que el middleware de CORS bloqueaba el origen externo de Cloudflare.
* **Causa raíz:** `backend/src/config/env.ts` requería que `PUBLIC_ORIGIN` coincidiera con el dominio desde el cual se originaba el tráfico del navegador.
* **Solución:** Se configuró en el entorno la variable:
  ```env
  PUBLIC_ORIGIN=https://head-lakes-efforts-vehicle.trycloudflare.com
  ```
  Se recreó el contenedor `api` (`docker compose up -d --force-recreate api`).
* **Verificación posterior:** El registro de cuentas comunitarias y el inicio de sesión funcionaron de manera fluida e inmediata.

---

## 4. Procedimientos de Operación de la Demo

### Procedimiento para Encender la Demo
1. Abrir Docker Desktop en el equipo Windows.
2. En la terminal de la raíz del proyecto, levantar los contenedores:
   ```powershell
   docker compose up -d
   ```
3. Verificar que los contenedores estén sanos:
   ```powershell
   docker compose ps
   curl http://localhost/api/health
   ```
4. Iniciar el túnel de Cloudflare:
   ```powershell
   cloudflared tunnel --url http://localhost:80
   ```
5. Confirmar que la URL generada (`https://head-lakes-efforts-vehicle.trycloudflare.com`) responda desde un teléfono móvil con datos.

### Procedimiento para Apagar la Demo
1. Detener el proceso de `cloudflared` con `Ctrl + C`.
2. Detener los contenedores sin destruir los volúmenes de datos:
   ```powershell
   docker compose down
   ```
   > ⚠️ **IMPORTANTE:** Nunca utilizar `docker compose down -v` en producción, ya que eliminaría los volúmenes `sqlite_data` y `uploads_data`.

---

## 5. Limitaciones Conocidas y Deuda Técnica Documentada

Para transparencia con el equipo docente y el PM, se registran las siguientes limitaciones de este corte:

1. **Persistencia del Túnel:** Se utilizó un túnel rápido temporal de Cloudflare (`trycloudflare.com`). La URL cambia si se reinicia el proceso del túnel y requiere que la máquina anfitriona permanezca encendida y conectada a internet. Para un entorno definitivo de producción se requerirá un VPS con dominio propio y certificado Caddy persistente.
2. **Scripts de Respaldo:** La estrategia de copias de seguridad de los volúmenes (`sqlite_data` y `uploads_data`) se encuentra documentada teóricamente, pero no se ha realizado un simulacro de restauración en frío con Docker en este corte.
3. **Seguridad de Archivos (`/uploads`):** Las fotografías subidas al directorio `/uploads` son servidas como archivos estáticos públicos. Queda pendiente para el issue #35 aplicar control de acceso y tokens para fotos de comunidades restringidas.
4. **Credenciales Administrativas Iniciales:** Las cuentas `admin1@mail.com` y `admin2@mail.com` conservan la contraseña por defecto de desarrollo (`Password123`), la cual debe ser cambiada antes del pase a usuarios finales externos.

---

## 6. Relación con el Alcance de Versión 2 (Issue #48)
Conforme a la orden de prioridades del PM (13/11/2026), el cierre y verificación con evidencias de este despliegue (#49) era la condición obligatoria previa antes de abordar el **Issue #48 (`COM-001 | Comunidades completas, foro, eventos, ranking, talentos y niveles`)**. Al haberse congelado formalmente el alcance de la V1 para la entrega académica, el desarrollo funcional del Issue #48 (perfiles con talentos certificados, foro persistente con moderación, eventos/mingas y gamificación auditada) queda oficialmente calendarizado para la **Versión 2 (Siguiente Incremento)**.
