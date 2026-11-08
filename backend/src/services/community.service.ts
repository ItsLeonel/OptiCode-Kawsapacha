// backend/src/services/community.service.ts
import { prisma } from '../config/prisma'
import { isCommunityResponsable } from './member.service'

export interface CreateCommunityInput {
  name: string
  responsible: string
  location: string
  description: string
  type?: string
  creatorId: string
}

export async function createCommunity(input: CreateCommunityInput) {
  // Regla de negocio: Cada usuario puede crear como máximo UNA comunidad propia
  const existingCreated = await prisma.community.findFirst({
    where: { creatorId: input.creatorId },
  })
  if (existingCreated) {
    const error = new Error('Cada usuario puede crear como máximo una comunidad propia.')
    ;(error as any).code = 'COMMUNITY_LIMIT_REACHED'
    throw error
  }

  const community = await prisma.community.create({
    data: {
      name: input.name,
      responsible: input.responsible,
      location: input.location,
      description: input.description,
      type: input.type || 'personal',
      creatorId: input.creatorId,
      members: {
        create: { userId: input.creatorId, roleInCommunity: 'RESPONSABLE', status: 'ACCEPTED' },
      },
    },
    include: {
      members: true,
      _count: {
        select: {
          members: { where: { status: 'ACCEPTED' } },
          gardens: true,
        },
      },
    },
  })
  return community
}

/**
 * Devuelve únicamente las comunidades donde el usuario es creador
 * O donde es miembro con estado ACCEPTED.
 */
export async function listCommunities(userId: string) {
  return prisma.community.findMany({
    where: {
      OR: [
        { creatorId: userId },
        {
          members: {
            some: {
              userId,
              status: 'ACCEPTED',
            },
          },
        },
      ],
    },
    include: {
      _count: {
        select: {
          members: { where: { status: 'ACCEPTED' } },
          gardens: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getCommunityById(id: string) {
  return prisma.community.findUnique({
    where: { id },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      gardens: true,
    },
  })
}

export async function updateCommunity(id: string, userId: string, data: Partial<Omit<CreateCommunityInput, 'creatorId'>>) {
  const isResponsable = await isCommunityResponsable(id, userId)
  if (!isResponsable) {
    const error = new Error('Solo el Responsable puede modificar los datos de la comunidad.')
    ;(error as any).code = 'FORBIDDEN'
    throw error
  }
  return prisma.community.update({
    where: { id },
    data,
    include: {
      _count: {
        select: {
          members: { where: { status: 'ACCEPTED' } },
          gardens: true,
        },
      },
    },
  })
}
