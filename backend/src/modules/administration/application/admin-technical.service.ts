// backend/src/modules/administration/application/admin-technical.service.ts
import bcrypt from 'bcryptjs'
import { prisma } from '../../../infrastructure/database/prisma'
import { logAudit } from '../audit.module'
import type { UserRole } from '../../../shared/types/index'

export async function provisionMspUser(
  input: { name: string; email: string; password: string },
  actorId: string
) {
  const normalizedEmail = input.email.trim().toLowerCase()
  const existing = await prisma.user.findFirst({
    where: { email: normalizedEmail },
  })

  if (existing) {
    throw Object.assign(new Error('Ya existe una cuenta con ese correo electrónico.'), { code: 'EMAIL_IN_USE' })
  }

  const passwordHash = await bcrypt.hash(input.password, 10)
  const user = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'ADMIN_MSP',
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  })

  await logAudit({
    actorId,
    action: 'PROVISION_MSP',
    targetResource: 'user',
    targetId: user.id,
    details: { email: user.email, name: user.name, role: user.role },
  })

  return user
}

export async function toggleUserStatus(
  targetUserId: string,
  isActive: boolean,
  actorId: string,
  reason?: string
) {
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
  })

  if (!targetUser) {
    throw Object.assign(new Error('Usuario objetivo no encontrado.'), { code: 'NOT_FOUND' })
  }

  // Protección estricta: nunca desactivar al último ADMIN_TECNICO activo
  if (targetUser.role === 'ADMIN_TECNICO' && !isActive) {
    const activeAdminsCount = await prisma.user.count({
      where: { role: 'ADMIN_TECNICO', isActive: true },
    })
    if (activeAdminsCount <= 1) {
      throw Object.assign(
        new Error('Operación denegada: no se puede desactivar al único Administrador Técnico activo del sistema.'),
        { code: 'PROTECTED_LAST_ADMIN' }
      )
    }
  }

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: { isActive },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      updatedAt: true,
    },
  })

  await logAudit({
    actorId,
    action: isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
    targetResource: 'user',
    targetId: targetUser.id,
    details: {
      previousState: targetUser.isActive,
      newState: isActive,
      role: targetUser.role,
      reason: reason || 'Acción ejecutada por ADMIN_TECNICO',
    },
  })

  return updated
}

/**
 * Lista TODAS las cuentas del sistema (administrativas y comunitarias) para que el
 * Administrador Técnico pueda supervisar y gestionar el estado de cada usuario.
 */
export async function listAdministrativeUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}
