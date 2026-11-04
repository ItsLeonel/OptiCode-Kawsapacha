// backend/src/services/harvest.service.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function harvestPlant(
  plantId: string,
  quantity: string,
  notes: string,
  userId: string
) {
  const plant = await prisma.cultivatedPlant.findUnique({
    where: { id: plantId },
    include: { species: true },
  })
  if (!plant) throw new Error('Planta no encontrada')

  // Crear registro de cosecha
  const harvest = await prisma.harvestRecord.create({
    data: {
      realGardenId: plant.realGardenId,
      communityId: (await prisma.realGarden.findUnique({
        where: { id: plant.realGardenId },
        select: { communityId: true },
      }))?.communityId ?? null,
      speciesName: plant.species.name,
      speciesLatinName: plant.species.latinName,
      quantity,
      notes,
      harvestedById: userId,
    },
  })

  // Marcar planta como cosechada (mantiene historial)
  await prisma.cultivatedPlant.update({
    where: { id: plantId },
    data: { lifecycleStatus: 'HARVESTED' },
  })

  return harvest
}

export async function listHarvestsByGarden(gardenId: string) {
  return prisma.harvestRecord.findMany({
    where: { realGardenId: gardenId },
    include: {
      harvestedBy: { select: { id: true, name: true } },
    },
    orderBy: { harvestDate: 'desc' },
  })
}

export async function listHarvestsByCommunity(communityId: string) {
  return prisma.harvestRecord.findMany({
    where: { communityId },
    include: {
      harvestedBy: { select: { id: true, name: true } },
      realGarden: { select: { id: true, name: true } },
    },
    orderBy: { harvestDate: 'desc' },
  })
}

