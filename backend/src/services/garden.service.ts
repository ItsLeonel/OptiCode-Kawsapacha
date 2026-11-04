import { prisma } from '../config/prisma'

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
  communityId: string | null
  createdById: string
}

export async function createGarden(input: CreateGardenInput) {
  return prisma.realGarden.create({
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
      communityId: input.communityId,
      createdById: input.createdById,
    },
  })
}

export async function listGardens(communityId?: string) {
  return prisma.realGarden.findMany({
    where: communityId ? { communityId } : undefined,
    include: {
      _count: { select: { plants: true } },
      community: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
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
      community: { select: { id: true, name: true } },
    },
  })
}

export async function updateGarden(id: string, data: Partial<Omit<CreateGardenInput, 'createdById'>>) {
  return prisma.realGarden.update({ where: { id }, data })
}

