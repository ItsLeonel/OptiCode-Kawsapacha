// backend/src/services/community.service.ts
import { prisma } from '../config/prisma'
import { isCommunityResponsable } from './member.service'
import { withEntityPhoto } from './entity-photo.service'

export interface CreateCommunityInput {
  name: string
  responsible: string
  location: string
  description: string
  type?: string
  province?: string
  cantonCode?: string
  parishCode?: string
  sector?: string
  file?: Express.Multer.File
  removePhoto?: boolean
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

  const community = await withEntityPhoto('communities', input.file, false, null, photoUrl => prisma.community.create({
    data: {
      name: input.name,
      responsible: input.responsible,
      location: input.location,
      description: input.description,
      type: input.type || 'personal',
      province: input.province,
      cantonCode: input.cantonCode,
      parishCode: input.parishCode,
      sector: input.sector,
      photoUrl,
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
  }))
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
  const previous = await prisma.community.findUniqueOrThrow({ where: { id }, select: { photoUrl: true } })
  const { file, removePhoto, ...fields } = data
  return withEntityPhoto('communities', file, removePhoto, previous.photoUrl, photoUrl => prisma.community.update({
    where: { id },
    data: { ...fields, photoUrl },
    include: {
      _count: {
        select: {
          members: { where: { status: 'ACCEPTED' } },
          gardens: true,
        },
      },
    },
  }))
}
