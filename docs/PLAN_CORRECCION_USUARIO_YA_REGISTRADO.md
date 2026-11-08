# 📋 Plan de Implementación: Exclusión de Miembros ya Registrados en la Suma de Integrantes

Este documento describe la solución técnica y el prompt de ejecución para evitar que, al consultar un usuario que ya forma parte de la comunidad (`carlos@kawsapacha.ec`), el sistema permita continuar y lo sume erróneamente como un integrante adicional (*"2 personas · 1 adicional(es)"*) en la tarjeta de confirmación del Paso 3 de `CommunityForm.tsx`.

---

## 🔍 Diagnóstico del Problema

1. **Estado `already_member` no bloqueante en validación:**
   En `CommunityForm.validate(2)`, la regla permitía avanzar si el estado era:
   ```ts
   ['sent', 'ready_to_send', 'already_member', 'pending'].includes(member.inviteStatus)
   ```
   Al permitir `already_member`, el formulario dejaba pasar al Paso 3 a personas que **ya pertenecen a la comunidad**.

2. **Cálculo incorrecto en la tarjeta de confirmación (Paso 3):**
   En la tarjeta de confirmación de integrantes se contabilizaba:
   ```ts
   const validMembers = values.members.filter(m =>
     ['sent', 'ready_to_send', 'already_member', 'pending'].includes(m.inviteStatus || '')
   )
   const count = validMembers.length + 1
   // Mostraba: count + " personas · " + validMembers.length + " adicional(es)"
   ```
   Esto provocaba que un usuario ya existente en la base de datos de la comunidad fuera sumado como un nuevo integrante adicional (`+1 adicional(es)`), duplicándolo en el resumen.

3. **Falta de sincronización con el conteo real de miembros de la comunidad:**
   `CommunityForm` no recibía `acceptedMembersCount`, por lo que asumía que la base siempre era `1` (solo el responsable).

---

## 🛠️ Solución Implementada

1. **Bloqueo en Validación del Paso 2 (`CommunityForm.tsx`):**
   - Si `member.inviteStatus === 'already_member'`:
     Bloquea el avance con error: `"${member.name || email}" ya es miembro registrado en esta comunidad. Quítalo de la lista con el botón "Quitar este integrante" para continuar.`
   - Si `member.inviteStatus === 'pending'`:
     Bloquea el avance con error: `"${member.name || email}" ya tiene una invitación pendiente en esta comunidad. Quítalo de la lista con el botón "Quitar este integrante" para continuar.`

2. **Bloqueo de Envío en Interfaz (`CommunityBuilderStep.tsx`):**
   - Deshabilita el botón de enviar invitación cuando el estado es `already_member` o `pending`.
   - Muestra insignias claras indicando: `ℹ Ya es miembro activo (Quítalo de la lista)` o `⏳ Ya tiene invitación pendiente`.

3. **Paso 3 y `acceptedMembersCount` (`CommunityForm.tsx` y `CommunitiesPage.tsx`):**
   - `CommunitiesPage.tsx` pasa `acceptedMembersCount` como prop a `CommunityForm`.
   - En el Paso 3, la tarjeta calcula el total como `(acceptedMembersCount ?? 1) + nuevasInvitaciones.length`.
   - Si no hay nuevas invitaciones, muestra claramente: `${total} personas · Sin nuevas invitaciones`.
   - Las personas con `already_member` nunca se contabilizan como adicionales a sumar.

