# 📋 PROMPT DE IMPLEMENTACIÓN: CORRECCIÓN DE EDICIÓN DE COMUNIDADES, PERSISTENCIA DE TIPO Y CONTEO REAL DE INTEGRANTES ACEPTADOS

## 🎯 OBJETIVO GENERAL
Solucionar los problemas de persistencia y consistencia en el módulo de Comunidades de Kawsapacha:
1. **Persistencia en Edición de Comunidad:** Permitir que al editar una comunidad existente desde el botón *"Editar comunidad"*, los cambios se guarden en SQLite vía `PUT /api/communities/:id` en lugar de intentar recrearla con `POST /api/communities` (lo que provocaba errores de límite de comunidades por usuario).
2. **Sincronización con el Huerto Real:** Al modificar la ubicación o datos de la comunidad en la edición, reflejar y sincronizar dichos cambios en el huerto real vinculado (`RealGarden`) sin pérdida de características.
3. **Persistencia del Tipo de Comunidad:** Guardar en la base de datos el campo `type` de la comunidad (`personal`, `familiar`, `condominio`, `barrial`) para que perdure tras recargar la página.
4. **Conteo Real de Integrantes en Vista General (`CommunityOverview`):** Mostrar el número total de personas que **efectivamente han aceptado** la invitación (`status === 'ACCEPTED'`), diferenciándolos de las invitaciones pendientes y de los borradores locales del formulario.

---

## 🔍 DIAGNÓSTICO Y CAUSAS RAÍZ IDENTIFICADAS

### 1. Falla al guardar la edición de comunidad
- **Causa:** En `App.tsx`, la función `saveCommunity` ejecutaba incondicionalmente `await communityApi.create(next)`. Como el backend restringe a los usuarios a un máximo de 1 comunidad propia (`COMMUNITY_LIMIT_REACHED`), cualquier intento de edición fallaba o intentaba crear un duplicado.
- **Falta en API Frontend:** El objeto `communityApi` en `frontend/src/services/api.ts` carecía del método `update(id, data)`, a pesar de que el backend ya cuenta con la ruta `PUT /api/communities/:id`.

### 2. Pérdida del campo `type` de la comunidad
- **Causa:** En `backend/prisma/schema.prisma`, el modelo `Community` no define el campo `type`. En el frontend, el paso 0 del wizard permite elegir entre *Personal, Familiar, Condominio o Barrial*, pero este dato no se almacena en SQLite, reseteándose a `'personal'` en cada sesión.

### 3. Conteo erróneo de integrantes en la Vista General
- **Causa:** En `CommunityOverview.tsx`, el conteo se calcula como:
  ```tsx
  {(community.members?.length ?? 0) + 1} personas
  ```
  Donde `community.members` era únicamente el arreglo local del formulario. Al agregar personas en el wizard y enviarles solicitud, el contador aumentaba de inmediato como si ya fueran miembros activos. Por el contrario, miembros reales en base de datos que ya habían aceptado no se reflejaban si la comunidad se cargaba desde la API.

---

## 🛠️ PLAN DE IMPLEMENTACIÓN POR FASES

### FASE 1: Base de Datos y Backend (Prisma, SQLite, Express)

#### 1.1 Actualizar Modelo Prisma (`backend/prisma/schema.prisma`)
Agregar el campo `type` al modelo `Community`:
```prisma
model Community {
  id          String   @id @default(cuid())
  name        String
  responsible String
  location    String
  description String
  type        String   @default("personal") // personal | familiar | condominio | barrial

  creatorId   String
  creator     User     @relation("CommunityCreator", fields: [creatorId], references: [id])
  ...
}
```
*Comando de migración:* Ejecutar `npx prisma db push` en `backend/`.

#### 1.2 Actualizar Servicio de Comunidades (`backend/src/services/community.service.ts`)
1. **Interface `CreateCommunityInput`:**
   ```typescript
   export interface CreateCommunityInput {
     name: string
     responsible: string
     location: string
     description: string
     type?: string
     creatorId: string
   }
   ```
2. **`createCommunity`:** Persistir `type: input.type || 'personal'`.
3. **`updateCommunity`:** Aceptar `type?: string` y permitir actualizar `{ name, responsible, location, description, type }`.
4. **`listCommunities`:** Ajustar el conteo para contabilizar únicamente miembros con estado `ACCEPTED`:
   ```typescript
   include: {
     _count: {
       select: {
         members: { where: { status: 'ACCEPTED' } },
         gardens: true,
       },
     },
   }
   ```

#### 1.3 Actualizar Controlador de Comunidades (`backend/src/controllers/community.controller.ts`)
- En `create`: Extraer `type` del cuerpo de la petición y pasarlo al servicio.
- En `update`: Extraer `type` y permitir su actualización.

---

### FASE 2: Servicios Frontend (`frontend/src/services/api.ts`)

#### 2.1 Ampliar `communityApi`
Agregar el método `update` al cliente API:
```typescript
export const communityApi = {
  async list(): Promise<Community[]> {
    const data = await request<{ communities: Community[] }>('/api/communities')
    return data.communities
  },

  async create(community: Community): Promise<Community & { id: string }> {
    const data = await request<{ community: Community & { id: string } }>('/api/communities', {
      method: 'POST',
      body: JSON.stringify(community),
    })
    return data.community
  },

  async update(id: string, community: Partial<Community>): Promise<Community & { id: string }> {
    const data = await request<{ community: Community & { id: string } }>(`/api/communities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(community),
    })
    return data.community
  },
}
```

---

### FASE 3: Lógica de Guardado y Sincronización en `App.tsx`

#### 3.1 Corrección de `saveCommunity`
Discriminar entre **Creación** y **Edición**:
```typescript
async function saveCommunity(next: Community) {
  if (user) {
    try {
      const targetId = activeCommunityId || (communityRecord as any)?.id || next.id
      let savedCommunity: Community & { id: string }

      if (targetId) {
        // MODO EDICIÓN: Actualizar en base de datos
        savedCommunity = await communityApi.update(targetId, next)
        setBackendCommunity(savedCommunity)
        setNotice('¡Comunidad actualizada con éxito!')
      } else {
        // MODO CREACIÓN: Crear nueva comunidad
        savedCommunity = await communityApi.create(next)
        setActiveCommunityId(savedCommunity.id)
        setBackendCommunity(savedCommunity)
        setNotice('¡Comunidad creada con éxito en la base de datos!')
      }

      // Despachar solicitudes de integrantes que aún no han sido enviadas
      const membersToInvite = (next.members || []).filter(
        m => m.email && m.email.trim() && m.inviteStatus !== 'sent'
      )
      if (membersToInvite.length > 0) {
        await Promise.allSettled(
          membersToInvite.map(m =>
            memberApi.invite(savedCommunity.id, m.email!.trim().toLowerCase(), m.role || 'PARTICIPANTE')
          )
        )
      }

      // Recargar lista de comunidades e integrantes reales de la comunidad activa
      const refreshedList = await communityApi.list()
      setUserCommunities(refreshedList || [])
      await loadCommunityMembers(savedCommunity.id)

      if (communityEntry === 'create') goto('Inicio')
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : 'Error al guardar la comunidad')
    }
  } else {
    // MODO VISITANTE: IndexedDB Journal
    ...
  }
}
```

#### 3.2 Sincronización del Huerto Real al cambiar ubicación
Si se modifica la localidad o provincia de la comunidad en la edición y existe un huerto asociado (`activeGardenId`), sincronizar automáticamente la ubicación derivada en `realGardenDraft` y persistirla con `gardenApi.update`.

---

### FASE 4: Vista General y Conteo Real de Integrantes (`CommunityOverview.tsx`)

#### 4.1 Carga de Miembros Reales Aceptados
En `App.tsx` / `CommunitiesPage.tsx`:
- Consultar los miembros reales con `memberApi.list(communityId)`.
- Calcular:
  ```typescript
  const acceptedMembers = realMembers.filter(m => m.status === 'ACCEPTED')
  const pendingMembers = realMembers.filter(m => m.status === 'PENDING')
  ```

#### 4.2 Actualización de `CommunityOverview.tsx`
- **Props actualizadas:**
  ```typescript
  export default function CommunityOverview({
    community,
    garden,
    acceptedMembersCount,
    pendingInvitationsCount,
    onEdit,
    onGarden,
  }: {
    community: Community
    garden: string
    acceptedMembersCount?: number
    pendingInvitationsCount?: number
    onEdit?: () => void
    onGarden: () => void
  })
  ```
- **Renderizado de Integrantes:**
  - Mostrar la cantidad real de personas aceptadas:
    ```tsx
    <div className="community-overview-members">
      <h3><GardenIcon name="community"/> Integrantes</h3>
      <p>
        {acceptedMembersCount ?? 1} {acceptedMembersCount === 1 ? 'integrante activo' : 'integrantes activos'}
      </p>
      {Boolean(pendingInvitationsCount && pendingInvitationsCount > 0) && (
        <small style={{ color: '#976212', fontWeight: 600 }}>
          {pendingInvitationsCount} solicitud(es) pendiente(s)
        </small>
      )}
    </div>
    ```
- **Renderizado del Tipo de Comunidad:**
  - Mostrar el tipo de comunidad (`Personal`, `Familiar`, `Condominio` o `Barrial`) mediante un badge visible en el encabezado de `CommunityOverview`.

---

## ✅ CRITERIOS DE ACEPTACIÓN Y VERIFICACIÓN

1. **Edición Exitosa:**
   - Ingresar como `ronny@kawsapacha.ec`, abrir *"Editar comunidad"*, modificar el nombre o descripción y guardar.
   - La comunidad debe actualizarse sin error `COMMUNITY_LIMIT_REACHED`.
   - Al recargar el navegador (F5), los cambios deben permanecer intactos en la pantalla.
2. **Persistencia del Tipo de Comunidad:**
   - Cambiar el tipo de comunidad a *Barrial* o *Familiar* y guardar.
   - Al consultar la API (`GET /api/communities`) o recargar la página, el tipo debe ser exactamente el seleccionado.
3. **Conteo Preciso de Integrantes:**
   - Agregar un integrante en el formulario y pulsar *"Mandar solicitud"*.
   - El conteo de integrantes activos en `CommunityOverview` **no debe aumentar** hasta que dicho usuario inicie sesión y acepte la invitación desde su campana de notificaciones.
   - Una vez aceptada la invitación, el contador debe reflejar el nuevo integrante activo (`2 integrantes activos`).
4. **Calidad y Ausencia de Errores:**
   - `npm run typecheck` en `frontend/` y `backend/` = 0 errores.
   - `npm run build` en `frontend/` y `backend/` = 0 errores.
   - `npm run test:unit` en `frontend/` = 17 de 17 pruebas aprobadas.

