// backend/src/services/garden.service.ts
import { prisma } from '../config/prisma'
import { isCommunityResponsable } from './member.service'
import { withEntityPhoto } from './entity-photo.service'

export interface CreateGardenInput {
  name: string
  kind: string
  areaM2: number
  province: string
  provinceCode: string
  canton: string
  cantonCode: string | null
  parish: string
  parishCode: string | null
  reference: string
  latitude: number | null
  longitude: number | null
  irrigationAvailability: string
  soilType: string | null
  characteristics?: string | null
  communityId: string | null
  createdById: string
  file?: Express.Multer.File
  removePhoto?: boolean
}

async function requireTargetCommunity(communityId: string | null | undefined, userId: string) {
  if (communityId && !await isCommunityResponsable(communityId, userId)) {
    throw Object.assign(new Error('Solo el Responsable puede registrar o vincular un huerto en esta comunidad.'), { code: 'FORBIDDEN' })
  }
}

async function requireGardenEditor(garden: { createdById: string; communityId: string | null }, userId: string) {
  if (garden.createdById !== userId && !(garden.communityId && await isCommunityResponsable(garden.communityId, userId))) {
    throw Object.assign(new Error('Solo el Responsable o creador del huerto puede modificar su configuración.'), { code: 'FORBIDDEN' })
  }
}

export async function createGarden(input: CreateGardenInput) {
  await requireTargetCommunity(input.communityId, input.createdById)
  // Si se especifica comunidad, buscar primero si la comunidad ya tiene un huerto
  let existingGarden = null
  if (input.communityId) {
    existingGarden = await prisma.realGarden.findFirst({
      where: { communityId: input.communityId },
      orderBy: { updatedAt: 'desc' },
    })
  }

  // Si no se encontró por comunidad, buscar si el usuario ya creó un huerto
  if (!existingGarden) {
    existingGarden = await prisma.realGarden.findFirst({
      where: { createdById: input.createdById },
      orderBy: { updatedAt: 'desc' },
    })
  }

  if (existingGarden) {
    await requireGardenEditor(existingGarden, input.createdById)
    return withEntityPhoto('gardens', input.file, input.removePhoto, existingGarden.photoUrl, photoUrl => prisma.realGarden.update({
      where: { id: existingGarden.id },
      data: {
        name: input.name,
        kind: input.kind,
        areaM2: input.areaM2,
        province: input.province,
        provinceCode: input.provinceCode,
        canton: input.canton,
        cantonCode: input.cantonCode,
        parish: input.parish,
        parishCode: input.parishCode,
        reference: input.reference,
        latitude: input.latitude,
        longitude: input.longitude,
        irrigationAvailability: input.irrigationAvailability,
        soilType: input.soilType,
        characteristics: input.characteristics !== undefined ? input.characteristics : existingGarden.characteristics,
        communityId: input.communityId ?? existingGarden.communityId,
        photoUrl,
      },
    }))
  }

  return withEntityPhoto('gardens', input.file, false, null, photoUrl => prisma.realGarden.create({
    data: {
      name: input.name,
      kind: input.kind,
      areaM2: input.areaM2,
      province: input.province,
      provinceCode: input.provinceCode,
      canton: input.canton,
      cantonCode: input.cantonCode,
      parish: input.parish,
      parishCode: input.parishCode,
      reference: input.reference,
      latitude: input.latitude,
      longitude: input.longitude,
      irrigationAvailability: input.irrigationAvailability,
      soilType: input.soilType,
      characteristics: input.characteristics ?? null,
      communityId: input.communityId,
      createdById: input.createdById,
      photoUrl,
    },
  }))
}

/**
 * Devuelve únicamente los huertos que:
 *   - Fueron creados por el usuario (createdById === userId), O
 *   - Pertenecen a una comunidad donde el usuario es miembro ACCEPTED.
 * Si se pasa communityId filtra adicionalmente por esa comunidad.
 */
export async function listGardens(userId: string, communityId?: string) {
  return prisma.realGarden.findMany({
    where: {
      ...(communityId ? { communityId } : {}),
      OR: [
        { createdById: userId },
        {
          community: {
            members: {
              some: {
                userId,
                status: 'ACCEPTED',
              },
            },
          },
        },
      ],
    },
    include: {
      _count: { select: { plants: true } },
      community: { select: { id: true, name: true, province: true, location: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })
}

export async function getGardenById(id: string) {
  return prisma.realGarden.findUnique({
    where: { id },
    include: {
      plants: {
        include: { species: true },
        orderBy: { plotIndex: 'asc' },
      },
      community: { select: { id: true, name: true, province: true, location: true } },
    },
  })
}

export async function updateGarden(id: string, userId: string, data: Partial<Omit<CreateGardenInput, 'createdById'>>) {
  const garden = await prisma.realGarden.findUnique({ where: { id } })
  if (!garden) throw new Error('Huerto no encontrado')

  await requireGardenEditor(garden, userId)
  if (data.communityId !== garden.communityId) await requireTargetCommunity(data.communityId, userId)
  const { file, removePhoto, ...fields } = data
  return withEntityPhoto('gardens', file, removePhoto, garden.photoUrl, photoUrl =>
    prisma.realGarden.update({ where: { id }, data: { ...fields, photoUrl } }))
}
