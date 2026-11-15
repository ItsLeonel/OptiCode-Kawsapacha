import { prisma } from '../../../infrastructure/database/prisma'

/** Autorización para registros y consulta de actividades. */
export async function assertGardenAccess(
  gardenId: string,
  userId: string,
  options?: { requireApproved?: boolean }
): Promise<boolean> {
  const requireApproved = options?.requireApproved ?? true
  const garden = await prisma.realGarden.findUnique({
    where: { id: gardenId },
    select: {
      id: true,
      createdById: true,
      communityId: true,
      community: {
        select: {
          id: true,
          status: true,
          name: true,
          reviewReason: true,
        },
      },
    },
  })

  if (!garden) {
    throw new Error('El huerto especificado no existe.')
  }

  // La supervisión MSP no paraliza comunidades PENDING/NEEDS_CHANGES.
  // Una comunidad rechazada o suspendida sí necesita resolución institucional.
  if (requireApproved && garden.community && ['REJECTED', 'SUSPENDED'].includes(garden.community.status)) {
    throw Object.assign(
      new Error('La comunidad está rechazada o suspendida. Solicita su revisión antes de registrar nuevas actividades.'),
      { code: 'COMMUNITY_NOT_APPROVED' }
    )
  }

  // Creador del huerto
  if (garden.createdById === userId) {
    return true
  }

  // Si pertenece a una comunidad, verificar si el usuario es miembro activo
  if (garden.communityId) {
    const member = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: garden.communityId,
          userId,
        },
      },
    })
    if (member && member.status === 'ACCEPTED') {
      return true
    }
  }

  throw Object.assign(new Error('No tienes permisos para interactuar con este huerto.'), { code: 'FORBIDDEN' })
}
