# 📋 PROMPT DE IMPLEMENTACIÓN: VALIDACIÓN ESTRICTA Y BLOQUEO DE INTEGRANTES NO REGISTRADOS EN EL WIZARD DE COMUNIDADES

## 🎯 OBJETIVO
Garantizar que en el formulario y wizard de creación o edición de comunidades (`CommunityForm.tsx` / `CommunityBuilderStep.tsx`):
1. **Bloqueo de Continuación:** No se permita avanzar al paso de confirmación (Paso 3) si hay integrantes agregados con correos vacíos, inválidos, no verificados o que no existan en la base de datos de Kawsapacha.
2. **Requisito de Solicitud o Eliminación:** Para poder presionar *"Continuar →"*, el usuario debe cumplir obligatoriamente una de dos alternativas para cada integrante en la lista:
   - **Opción A (Invitar con cuenta existente):** Ingresar un correo de una cuenta existente en Kawsapacha, verificarlo con *"🔍 Consultar"* y presionar *"📨 Mandar solicitud"*.
   - **Opción B (Descartar integrante):** Quitar al integrante de la lista usando el botón *"Quitar integrante"*.
3. **Eliminación de Falsos Positivos:** Impedir que en la pantalla de confirmación (Paso 3) o en la vista general se muestren integrantes que no existen o a los que no se les haya enviado/preparado la invitación real.
4. **Botón "Quitar" visible en el editor:** Permitir descartar y eliminar el integrante directamente desde su propia ficha de edición sin pasos adicionales.

---

## 🔍 DIAGNÓSTICO DEL COMPORTAMIENTO ACTUAL

1. **Validación permisiva:**
   - En `CommunityForm.tsx`, la función `validate(2)` solo validaba el correo si no estaba vacío (`if (member.email && member.email.trim())`), y solo comprobaba el formato sintáctico por expresión regular (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`).
   - Si el correo se dejaba en blanco, o si se escribía un correo inexistente (o sin presionar *"Consultar"* ni *"Mandar solicitud"*), el sistema permitía avanzar con *"Continuar →"*.
2. **Falsa confirmación en Paso 3:**
   - El wizard mostraba `2 personas · 1 adicional(es)` aunque el integrante fuera ficticio o no existiera en la base de datos.
   - Al guardar, la comunidad se guardaba pero la invitación fallaba silenciosamente o quedaba en un estado inconsistente.
3. **Falta de acción directa de descarte:**
   - Si el usuario abría *"Añadir integrante"* y descubría que la persona no tenía cuenta, tenía que cerrar la edición, buscar la tarjeta en la lista y presionar *"Quitar"*. Si no lo hacía y simplemente daba *"Continuar"*, el sistema intentaba registrar un integrante inválido.

---

## 🛠️ ESPECIFICACIÓN TÉCNICA DE LOS CAMBIOS

### 1. Estados de Invitación en `CommunityMember` (`communities.ts`)
Definir con precisión los estados posibles de un integrante en el borrador:
```typescript
export type MemberInviteStatus =
  | 'idle'           // Recién añadido, sin consultar
  | 'checking'       // Consulta en progreso
  | 'not_found'      // Correo no registrado en Kawsapacha
  | 'verified'       // Cuenta existe en Kawsapacha (lista para invitar)
  | 'ready_to_send'  // Solicitud validada y preparada (se enviará al crear la comunidad)
  | 'sent'           // Solicitud enviada exitosamente en la API (modo edición)
  | 'already_member' // Ya es miembro activo de la comunidad
  | 'pending'        // Ya tiene una invitación previa pendiente
```

---

### 2. Validación Estricta en `CommunityForm.tsx` (Función `validate(2)`)
En el paso 2 del wizard, antes de permitir `navigate(3)` o `submit`:
```typescript
values.members.forEach((member, index) => {
  const memberLabel = member.name.trim() || `Integrante ${index + 1}`
  const email = (member.email || '').trim().toLowerCase()

  // 1. Nombre obligatorio (mínimo 2 caracteres)
  if (member.name.trim().length < 2 || member.name.trim().length > 80) {
    result[`member-${member.id}-name`] = `Escribe el nombre de ${memberLabel} (entre 2 y 80 caracteres).`
  }

  // 2. Correo electrónico obligatorio
  if (!email) {
    result[`member-${member.id}-email`] = `Ingresa el correo electrónico para invitar a ${memberLabel}, o quítalo de la lista con el botón "Quitar".`
    return
  }

  // 3. Formato de correo válido
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    result[`member-${member.id}-email`] = `Escribe un correo electrónico válido para ${memberLabel}.`
    return
  }

  // 4. Bloqueo si el usuario no existe en la base de datos
  if (member.inviteStatus === 'not_found') {
    result[`member-${member.id}-email`] = `No existe una cuenta registrada con "${email}". Ingresa un correo registrado en Kawsapacha o quita al integrante.`
    return
  }

  // 5. Bloqueo si no se ha consultado o no se ha mandado/preparado la solicitud
  const isReady = member.inviteStatus === 'sent' ||
                  member.inviteStatus === 'ready_to_send' ||
                  member.inviteStatus === 'already_member' ||
                  member.inviteStatus === 'pending'

  if (!isReady) {
    result[`member-${member.id}-email`] = `Debes consultar el correo y mandar la solicitud a ${memberLabel} para continuar, o quítalo con el botón "Quitar".`
  }
})
```

---

### 3. Interfaz de Usuario en `CommunityBuilderStep.tsx`

#### 3.1 Manejo de Botón "🔍 Consultar" y "📨 Mandar solicitud"
- Al pulsar **"🔍 Consultar"**:
  - Si la cuenta NO existe (`res.found === false`):
    - Actualizar estado a `inviteStatus = 'not_found'`.
    - Mostrar advertencia clara en rojo:
      `✕ No existe ninguna cuenta registrada con este correo en Kawsapacha. La persona debe crear su cuenta primero, o puedes quitarla de la lista.`
    - Deshabilitar el botón *"Mandar solicitud"*.
  - Si la cuenta SÍ existe (`res.found === true`):
    - Si ya es miembro: `inviteStatus = 'already_member'`. Mensaje: `ℹ Ya es miembro activo de esta comunidad.`
    - Si tiene invitación pendiente: `inviteStatus = 'pending'`. Mensaje: `⏳ Ya tiene una invitación pendiente de aceptar.`
    - Si está disponible: `inviteStatus = 'verified'`. Mensaje: `✓ Cuenta encontrada: ${res.user.name}. Pulsa "Mandar solicitud" para incluirlo.`
    - Autocompletar el nombre si estaba vacío.

- Al pulsar **"📨 Mandar solicitud"**:
  - Solo habilitado si `inviteStatus === 'verified'`.
  - **En modo edición (`values.id` presente):**
    - Llama a `memberApi.invite(values.id, email, role)`.
    - Actualiza a `inviteStatus = 'sent'`.
    - Muestra: `✓ ¡Solicitud enviada a ${email}! El usuario la verá en su campana de notificaciones (🔔).`
  - **En modo creación (nueva comunidad):**
    - Actualiza a `inviteStatus = 'ready_to_send'`.
    - Muestra: `✓ Solicitud preparada. Se despachará automáticamente al guardar la comunidad.`

#### 3.2 Botón "Quitar integrante" directo dentro del editor
Dentro de `<fieldset className="cw-member-editor">`:
Agregar un botón directo para descartar al integrante inmediatamente:
```tsx
<div className="cw-member-editor-footer">
  <button
    type="button"
    className="cw-danger-button"
    onClick={() => onMemberRemove(member.id)}
  >
    🗑️ Quitar este integrante de la lista
  </button>
  <button
    type="button"
    className="cw-text-button"
    onClick={() => onMemberEdit(null)}
  >
    Volver a la lista de integrantes
  </button>
</div>
```

---

### 4. Resumen de Confirmación en Paso 3 (`CommunityForm.tsx`)
En la tarjeta de Integrantes del Paso 3:
- Contabilizar únicamente los integrantes que tengan solicitud enviada (`'sent'`), preparada (`'ready_to_send'`) o activa (`'already_member'`).
- Si `values.members.length === 0`:
  `1 persona (Responsable) · Sin integrantes adicionales`
- Si hay integrantes válidos:
  Mostrar el desglose exacto: `Nombre (email) · [Rol] · Solicitud lista/enviada`.

---

## ✅ CRITERIOS DE ACEPTACIÓN Y PRUEBAS

1. **Prueba de bloqueo por correo vacío:**
   - Hacer clic en `+ Añadir integrante`.
   - Escribir un nombre pero dejar el correo vacío.
   - Hacer clic en *"Continuar →"*.
   - **Resultado esperado:** El formulario no avanza al paso 3. Muestra el error: *"Ingresa el correo electrónico para invitar al integrante, o quítalo de la lista con el botón 'Quitar'"*.

2. **Prueba de bloqueo por cuenta inexistente:**
   - Escribir `noexiste999@correo.com` y pulsar *"Consultar"*.
   - Aparece la advertencia de que la cuenta no existe.
   - Intentar pulsar *"Continuar →"*.
   - **Resultado esperado:** El wizard no avanza al paso 3. Muestra el error: *"No existe una cuenta registrada con este correo. Ingresa un correo registrado en Kawsapacha o quita al integrante"*.

3. **Prueba de avance exitoso con cuenta válida:**
   - Escribir `carlos@kawsapacha.ec` y pulsar *"Consultar"*.
   - Aparece: `✓ Cuenta encontrada: Carlos Sanchez`.
   - Pulsar *"📨 Mandar solicitud"*.
   - Aparece: `✓ Solicitud preparada / enviada`.
   - Pulsar *"Continuar →"*.
   - **Resultado esperado:** El wizard avanza correctamente al Paso 3 de confirmación mostrando a Carlos Sanchez con su correo y rol.

4. **Prueba de descarte rápido con el botón "Quitar":**
   - Añadir un integrante con correo inválido.
   - Pulsar *"🗑️ Quitar este integrante de la lista"*.
   - El integrante se elimina de la lista.
   - Pulsar *"Continuar →"*.
   - **Resultado esperado:** Avanza de inmediato al paso 3 sin errores ni integrantes fantasma.

5. **Calidad de Código:**
   - 0 errores en `npm run typecheck`.
   - 0 errores en `npm run build`.
   - 17/17 pruebas unitarias aprobadas.

