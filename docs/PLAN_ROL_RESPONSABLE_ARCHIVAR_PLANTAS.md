# 📋 Plan de Implementación: Restricción de Archivado de Plantas a Rol "Responsable"

Este documento contiene el plan técnico y el **prompt de ejecución** para asegurar que **únicamente los usuarios con el rol `RESPONSABLE` puedan archivar plantas y liberar parcelas**, mientras que los usuarios con rol `PARTICIPANTE` no tengan permitido realizar esta acción.

---

## 🔍 Reglas de Negocio y Control de Acceso

| Rol de Usuario | Permiso para Archivar Planta | Comportamiento en Frontend (`PlantPassport.tsx`) | Comportamiento en Backend (`plant.service.ts`) |
|---|---|---|---|
| **Responsable** (`RESPONSABLE` o creador de comunidad) | ✅ **Permitido** | Visualiza el botón **`📦 Archivar planta y liberar parcela`** y puede confirmar la acción. | Procesa el archivado (`PATCH /api/plants/:id/archive`), libera la parcela (`plotIndex = null`) y retorna 200 OK. |
| **Participante** (`PARTICIPANTE`) | 🚫 **Bloqueado** | No puede archivar. Se muestra un indicador informativo: *"🔒 El archivado de plantas y liberación de parcelas está reservado para el Responsable de la comunidad"*. | Si intenta invocar el endpoint, el backend responde **403 Forbidden**: *"Solo las personas con rol Responsable pueden archivar plantas y liberar parcelas."* |
| **Modo Local / Demo** (Sin iniciar sesión) | ✅ **Permitido** | Flujo local de simulación para pruebas en navegador. | N/A (IndexedDB local). |

---

## 🛠️ Modificaciones a Realizar

### 1. Backend (`backend/src/services/plant.service.ts`)
- Modificar la función `archivePlant(plantId, requestingUserId)`:
  - Si el huerto pertenece a una comunidad (`realGarden.communityId`):
    - Consultar el registro de `CommunityMember` para `requestingUserId` con estado `ACCEPTED`.
    - Verificar si `member.roleInCommunity === 'RESPONSABLE'` o si el usuario es el creador de la comunidad/huerto.
    - Si el rol es `PARTICIPANTE`, rechazar inmediatamente con error `FORBIDDEN` (403):
      > *"Solo las personas con rol Responsable pueden archivar plantas y liberar parcelas. Los participantes no tienen permisos para archivar."*

### 2. Frontend (`frontend/src/features/my-garden/PlantPassport.tsx`)
- Utilizar la prop `currentCommunityRole?: 'RESPONSABLE' | 'PARTICIPANTE' | null`:
  - Calcular: `const canArchive = !user || currentCommunityRole === 'RESPONSABLE'`
  - Si `canArchive` es `true`:
    - Muestra normalmente el botón y diálogo de confirmación: **`📦 Archivar planta y liberar parcela`**.
  - Si `canArchive` es `false` (usuario con rol `PARTICIPANTE`):
    - Oculta el botón de archivado y en su lugar muestra una tarjeta informativa con estilo sutil y el candado de permisos:
      > *"🔒 **Permiso de Responsable requerido**: La liberación de parcelas y archivado de plantas está reservado para el Responsable de la comunidad."*

### 3. Frontend (`frontend/src/App.tsx`)
- En `archivePlant()`, verificar si el usuario tiene permiso antes de invocar la API para brindar una respuesta inmediata y capturar cualquier error 403 si el backend lo rechaza.

---

## 💬 Prompt para Ejecutar

Para autorizar y ejecutar este plan, responde con:

> **ejecuta el plan de permisos de archivado**
