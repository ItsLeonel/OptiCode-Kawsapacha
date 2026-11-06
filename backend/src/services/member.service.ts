// backend/src/services/member.service.ts
import { prisma } from '../config/prisma'

export type CommunityRole = 'RESPONSABLE' | 'PARTICIPANTE'

/**
 * Verifica si un usuario es Responsable de una comunidad (bien sea el creador o con rol RESPONSABLE activo).
 */
export async function isCommunityResponsable(communityId: string, userId: string): Promise<boolean> {
  const community = await prisma.community.findUnique({
    where: { id: communityId },
    select: { creatorId: true },
  })
  if (community?.creatorId === userId) return true

  const member = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId, userId } },
    select: { roleInCommunity: true, status: true },
  })
  return member?.status === 'ACCEPTED' && member.roleInCommunity === 'RESPONSABLE'
}

export async function inviteMember(
  communityId: string,
  email: string,
  role: string,
  invitedById: string
) {
  // 1. Validar que quien invita tenga rol de RESPONSABLE en la comunidad
  const isResponsable = await isCommunityResponsable(communityId, invitedById)
  if (!isResponsable) {
    const error = new Error('Solo el Responsable de la comunidad tiene permisos para enviar invitaciones.')
    ;(error as any).code = 'FORBIDDEN'
    throw error
  }

  // 2. Validar que el rol propuesto sea estrictamente RESPONSABLE o PARTICIPANTE
  const normalizedRole: CommunityRole = role === 'RESPONSABLE' ? 'RESPONSABLE' : 'PARTICIPANTE'

  // 3. Verificar si el usuario existe en la tabla User (búsqueda tolerante a mayúsculas/minúsculas)
  const normalizedEmail = email.trim().toLowerCase()
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: normalizedEmail },
        { email: email.trim() },
      ],
    },
  })
  if (!existingUser) {
    const error = new Error('No existe ningún usuario registrado con el correo ingresado')
    ;(error as any).code = 'USER_NOT_FOUND'
    throw error
  }

  // 4. Verificar si ya es miembro con estado ACCEPTED
  const alreadyMember = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId, userId: existingUser.id } },
  })
  if (alreadyMember && alreadyMember.status === 'ACCEPTED') {
    const error = new Error('El usuario ya es miembro activo de esta comunidad.')
    ;(error as any).code = 'ALREADY_MEMBER'
    throw error
  }

  // 5. Crear o actualizar membresía con status PENDING (NO unir automáticamente)
  if (alreadyMember) {
    await prisma.communityMember.update({
      where: { id: alreadyMember.id },
      data: {
        roleInCommunity: normalizedRole,
        status: 'PENDING',
      },
    })
  } else {
    await prisma.communityMember.create({
      data: {
        communityId,
        userId: existingUser.id,
        roleInCommunity: normalizedRole,
        status: 'PENDING',
      },
    })
  }

  // 6. Crear o actualizar la invitación en CommunityInvitation
  const existingInvitation = await prisma.communityInvitation.findFirst({
    where: {
      communityId,
      OR: [
        { email: normalizedEmail },
        { email: existingUser.email },
      ],
      status: 'PENDING',
    },
  })

  let invitation
  if (existingInvitation) {
    invitation = await prisma.communityInvitation.update({
      where: { id: existingInvitation.id },
      data: {
        role: normalizedRole,
        invitedById,
        email: normalizedEmail,
        status: 'PENDING',
      },
    })
  } else {
    invitation = await prisma.communityInvitation.create({
      data: {
        communityId,
        email: normalizedEmail,
        role: normalizedRole,
        invitedById,
        status: 'PENDING',
      },
    })
  }

  return invitation
}

export async function listMembers(communityId: string) {
  return prisma.communityMember.findMany({
    where: { communityId },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
    orderBy: { joinedAt: 'asc' },
  })
}

export async function updateMemberRole(
  communityId: string,
  userId: string,
  newRole: string,
  requestUserId: string
) {
  // Solo el responsable puede cambiar roles
  const isResponsable = await isCommunityResponsable(communityId, requestUserId)
  if (!isResponsable) {
    const error = new Error('Solo el Responsable de la comunidad puede modificar roles.')
    ;(error as any).code = 'FORBIDDEN'
    throw error
  }

  const normalizedRole: CommunityRole = newRole === 'RESPONSABLE' ? 'RESPONSABLE' : 'PARTICIPANTE'

  const member = await prisma.communityMember.update({
    where: { communityId_userId: { communityId, userId } },
    data: { roleInCommunity: normalizedRole },
  })

  // Sincronizar el rol propuesto en invitaciones pendientes si existen
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
  if (user) {
    await prisma.communityInvitation.updateMany({
      where: { communityId, email: user.email, status: 'PENDING' },
      data: { role: normalizedRole },
    })
  }

  return member
}

export async function removeMember(communityId: string, userId: string, requestUserId: string) {
  // Solo el responsable puede expulsar o cancelar invitaciones
  const isResponsable = await isCommunityResponsable(communityId, requestUserId)
  if (!isResponsable) {
    const error = new Error('Solo el Responsable de la comunidad puede eliminar miembros o cancelar invitaciones.')
    ;(error as any).code = 'FORBIDDEN'
    throw error
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
  if (user) {
    await prisma.communityInvitation.deleteMany({
      where: { communityId, email: user.email },
    })
  }
  return prisma.communityMember.delete({
    where: { communityId_userId: { communityId, userId } },
  })
}
