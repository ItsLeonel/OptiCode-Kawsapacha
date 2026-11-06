// backend/src/services/invitation.service.ts
import { prisma } from '../config/prisma'

export async function getPendingInvitationsForEmail(email: string) {
  const cleanEmail = email.trim().toLowerCase()
  const invitations = await prisma.communityInvitation.findMany({
    where: {
      OR: [
        { email: cleanEmail },
        { email: email.trim() },
      ],
      status: 'PENDING',
    },
    include: {
      community: {
        select: {
          id: true,
          name: true,
          responsible: true,
          location: true,
          description: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Obtener los nombres de los usuarios que invitaron
  const inviterIds = [...new Set(invitations.map(i => i.invitedById).filter(Boolean))]
  const inviters = await prisma.user.findMany({
    where: { id: { in: inviterIds } },
    select: { id: true, name: true, email: true },
  })
  const inviterMap = new Map(inviters.map(u => [u.id, u.name]))

  return invitations.map(inv => ({
    id: inv.id,
    communityId: inv.communityId,
    communityName: inv.community.name,
    communityLocation: inv.community.location,
    role: inv.role,
    invitedById: inv.invitedById,
    invitedByName: inviterMap.get(inv.invitedById) || inv.community.responsible || 'Responsable de la comunidad',
    createdAt: inv.createdAt.toISOString(),
    status: inv.status,
  }))
}

export async function acceptInvitation(invitationId: string, userId: string, userEmail: string) {
  const invitation = await prisma.communityInvitation.findUnique({
    where: { id: invitationId },
  })
  const cleanUserEmail = userEmail.trim().toLowerCase()
  const cleanInvEmail = invitation?.email?.trim().toLowerCase()
  if (!invitation || cleanInvEmail !== cleanUserEmail) {
    const error = new Error('Invitación no encontrada o no pertenece a tu cuenta.')
    ;(error as any).code = 'NOT_FOUND'
    throw error
  }
  if (invitation.status !== 'PENDING') {
    const error = new Error('Esta invitación ya ha sido procesada previamente.')
    ;(error as any).code = 'ALREADY_PROCESSED'
    throw error
  }

  // Marcar la invitación como aceptada
  const updatedInvitation = await prisma.communityInvitation.update({
    where: { id: invitationId },
    data: { status: 'ACCEPTED' },
  })

  // Actualizar o crear la membresía activa del usuario
  const member = await prisma.communityMember.upsert({
    where: {
      communityId_userId: {
        communityId: invitation.communityId,
        userId,
      },
    },
    update: {
      status: 'ACCEPTED',
      roleInCommunity: invitation.role,
    },
    create: {
      communityId: invitation.communityId,
      userId,
      roleInCommunity: invitation.role,
      status: 'ACCEPTED',
    },
  })

  return { invitation: updatedInvitation, member, communityId: invitation.communityId }
}

export async function rejectInvitation(invitationId: string, userId: string, userEmail: string) {
  const invitation = await prisma.communityInvitation.findUnique({
    where: { id: invitationId },
  })
  const cleanUserEmail = userEmail.trim().toLowerCase()
  const cleanInvEmail = invitation?.email?.trim().toLowerCase()
  if (!invitation || cleanInvEmail !== cleanUserEmail) {
    const error = new Error('Invitación no encontrada o no pertenece a tu cuenta.')
    ;(error as any).code = 'NOT_FOUND'
    throw error
  }

  // Marcar invitación como rechazada
  const updatedInvitation = await prisma.communityInvitation.update({
    where: { id: invitationId },
    data: { status: 'REJECTED' },
  })

  // Eliminar el registro pendiente si existía
  await prisma.communityMember.deleteMany({
    where: {
      communityId: invitation.communityId,
      userId,
      status: 'PENDING',
    },
  })

  return { invitation: updatedInvitation, rejected: true }
}

