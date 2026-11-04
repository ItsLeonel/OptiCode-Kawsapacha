// backend/src/services/member.service.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function inviteMember(
  communityId: string,
  email: string,
  role: string,
  invitedById: string
) {
  // Registrar invitación
  const invitation = await prisma.communityInvitation.create({
    data: {
      communityId,
      email,
      role,
      invitedById,
      status: 'PENDING',
    },
  })

  // Si el usuario ya existe, agregarlo como miembro directamente con estado ACCEPTED
  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    const alreadyMember = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId: existingUser.id } },
    })
    if (!alreadyMember) {
      await prisma.communityMember.create({
        data: {
          communityId,
          userId: existingUser.id,
          roleInCommunity: role,
          status: 'ACCEPTED',
        },
      })
    }
    // Marcar invitación como aceptada
    await prisma.communityInvitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED' },
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
  newRole: string
) {
  return prisma.communityMember.update({
    where: { communityId_userId: { communityId, userId } },
    data: { roleInCommunity: newRole },
  })
}

export async function removeMember(communityId: string, userId: string) {
  return prisma.communityMember.delete({
    where: { communityId_userId: { communityId, userId } },
  })
}

