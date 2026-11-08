# 📋 PLAN DE IMPLEMENTACIÓN: INTEGRACIÓN FRONTEND V3 (MAIN) CON BACKEND PERSISTENTE (FEATURE/BACKEND-BASE-V1)

## 🎯 OBJETIVO PRINCIPAL
Integrar todas las nuevas características visuales y de experiencia de usuario agregadas recientemente en `origin/main` (PR #27: Wizard V3 de comunidades, Phaser 2D en Mi Jardín Vivo, diario de 9 actividades, editor de plantas y gamificación) dentro de nuestra rama de trabajo `feature/backend-base-v1`, conectándolas directamente con nuestra arquitectura backend REST (Node.js, Express, Prisma, SQLite) y preservando intactos el sistema de 2 roles, invitaciones con notificaciones, almacén comunitario y motor fenológico.

---

## 🔒 REGLAS Y RESTRICCIONES DE SEGURIDAD
1. **Seguridad de `main`:** Ningún cambio se sube a `main`. Todo el trabajo ocurre exclusivamente en la rama local `feature/backend-base-v1`.
2. **Respaldo 100% Local:** Se debe crear una rama de respaldo local (`backup-pre-integracion-nov8`) que NUNCA se sube a GitHub.
3. **Cero pérdida de lógica backend:** No se debe borrar ni deshabilitar:
   - Sistema de 2 roles (`RESPONSABLE` y `PARTICIPANTE`).
   - Panel de notificaciones interactivo (campana 🔔 y modal `NotificationsModal`).
   - Panel de Miembros de la Comunidad (`CommunityMembersPanel`).
   - Almacén Comunitario / Bodega (`CommunityWarehouse`).
   - Motor fenológico y alertas contra sobre-riego y sobre-abono (`careApi`).
   - Cosecha no-destructiva perenne con ciclo de rebrote (`harvestApi`).
4. **Modo Híbrido Obligatorio:**
   - **Usuario con sesión (JWT):** Datos, fotos, comunidades y actividades se sincronizan con SQLite a través de la API REST.
   - **Modo visitante (sin sesión):** Se preserva la simulación local en IndexedDB desarrollada por el equipo de frontend.
5. **Calidad y Cero Errores:** Tanto `frontend/` como `backend/` deben compilar sin advertencias ni errores:
   - `npm run typecheck` = 0 errores.
   - `npm run build` = 0 errores.
6. **Autorización explícita:** No ejecutar `git commit` ni `git push` sin confirmación previa del usuario.

---

## 🛠️ FASES DE IMPLEMENTACIÓN PASO A PASO

### FASE 1: Preparación y Respaldo Local
1. Verificar que el árbol de trabajo esté limpio (`git status`).
2. Crear la rama de respaldo local:
   ```bash
   git branch backup-pre-integracion-nov8
   ```
3. Ejecutar el merge de `origin/main` en la rama local sin commit automático:
   ```bash
   git merge origin/main --no-commit --no-ff
   ```
4. Identificar la lista exacta de archivos con conflictos.

---

### FASE 2: Resolución de Conflictos e Integración Arquitectónica

#### 1. Módulo de Comunidades (`CommunitiesPage.tsx` y componentes asociados)
- **Adoptar de `main`:** El nuevo asistente Wizard V3 (`CommunityBuilderStep`, `CommunityTerritoryStep`, `CommunityTypeStep`) con fondos regionales (Costa, Sierra, Oriente, Galápagos) y tipos de comunidad (Barrial, Familiar, Condominio, Personal).
- **Conservar de nuestra rama:**
  - Pestañas/Accesos a: **Miembros de la Comunidad** (`CommunityMembersPanel`) y **Almacén Comunitario** (`CommunityWarehouse`).
  - Lógica de permisos según rol (`RESPONSABLE` puede invitar miembros; `PARTICIPANTE` solo visualiza).
  - Integración con `communityApi.create`, `communityApi.list` y `memberApi.list`.

#### 2. Notificaciones y Sesión (`App.tsx` y `GardenNavigation.tsx`)
- **Conservar de nuestra rama:**
  - Estado de sesión JWT (`user`, `handleAuth`, `handleLogout`).
  - Campana de notificaciones con conteo de invitaciones pendientes (`pendingInvitations`).
  - Modal interactivo de notificaciones (`NotificationsModal`) para aceptar o rechazar unirse a comunidades.
  - Selector de comunidad activa (`userCommunities`, `selectActiveCommunity`).

#### 3. Mi Jardín Vivo y Phaser 2D (`MyGardenPage.tsx`, `GardenScene.tsx`, `PhaserGardenPoc.tsx`)
- **Adoptar de `main`:** El renderizador 2D interactivo con zoom, navegación y ambientación regional.
- **Conectar con Backend:**
  - Vincular las 6 parcelas con los datos reales de `plantApi.listByGarden(activeGardenId)`.
  - Si el usuario está autenticado pero no tiene huerto creado, mostrar el banner de bienvenida para crear su comunidad/huerto.

#### 4. Registro de Plantas y Cámara (`PlantRegistrationModal.tsx`, `PlantEditor.tsx`)
- **Adoptar de `main`:** Flujo de captura por cámara web/móvil o galería y el nuevo editor de plantas.
- **Conectar con Backend:**
  - Si `user` está autenticado: convertir la captura a archivo y enviarla a `plantApi.register(gardenId, formData)` para subir la foto física y persistir la especie en SQLite.
  - Si es visitante: conservar el Blob en IndexedDB.

#### 5. Diario Agrícola y Cuidados (`ActivityModal.tsx`, `useGardenJournal.ts`, `PlantPassport.tsx`)
- **Adoptar de `main`:** Las 9 actividades agrícolas (riego, abono, poda, siembra, etc.).
- **Conectar con Backend:**
  - Riego (`WATERING`), Abono (`FERTILIZER`) y Poda (`PRUNING`): conectar con `careApi.add()` para aplicar las validaciones agronómicas del backend (evitar pudrición por exceso de agua y quema de raíces).
  - Cosecha (`HARVEST`): conectar con `harvestApi.harvest()` para que los gramos cosechados se sumen automáticamente al stock del Almacén Comunitario (`warehouseApi`).
  - Conservar el Pasaporte Vivo con la barra de crecimiento dinámico y el botón de desarraigo para liberar parcelas.

---

### FASE 3: Verificación Estricta de Calidad
1. **Frontend:**
   ```bash
   cd frontend
   npm run typecheck
   npm run build
   ```
2. **Backend:**
   ```bash
   cd backend
   npm run typecheck
   npm run build
   ```
3. Ambos comandos deben terminar con código de salida `0` (cero errores de TypeScript y de empaquetado Vite).

---

### FASE 4: Cierre, Commit y Push
1. Revisar los archivos en `git status`.
2. Preparar los cambios con `git add .`.
3. Solicitar autorización al usuario para hacer el commit:
   ```bash
   git commit -m "feat(integration): integrar interfaz V3 de main (wizard comunidades, phaser y diario) con arquitectura backend, roles y persistencia"
   ```
4. Solicitar autorización para hacer el push:
   ```bash
   git push origin feature/backend-base-v1
   ```
5. Confirmar que en GitHub el Pull Request se muestre en color verde con:
   `✔ Able to merge. These branches can be automatically merged.`

