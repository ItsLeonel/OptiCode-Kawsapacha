import { prisma } from '../../../infrastructure/database/prisma'
import { assertGardenAccess } from '../../gardens/garden-access.module'
import { extractGrowthStage } from '../domain/plant-rules'

export async function listPlantsByGarden(gardenId: string, requestingUserId: string) {
  await assertGardenAccess(gardenId, requestingUserId, { requireApproved: false })
  const plants = await prisma.cultivatedPlant.findMany({
    where: { realGardenId: gardenId },
    select: {
      id: true,
      plotIndex: true,
      speciesId: true,
      customName: true,
      photoUrl: true,
      photoPath: true,
      photoMime: true,
      photoSize: true,
      notes: true,
      plantingDate: true,
      lifecycleStatus: true,
      observedState: true,
      lastHarvestDate: true,
      archivedAt: true,
      reviewStatus: true,          // ← Estado de aprobación MSP de la siembra
      registeredById: true,
      realGardenId: true,
      createdAt: true,
      updatedAt: true,
      species: true,
      activities: {
        where: { voidedAt: null },
        orderBy: { createdAt: 'desc' },
        select: { details: true, type: true, reviewStatus: true },
      },
    },
    orderBy: { plotIndex: 'asc' },
  })

  return plants.map(({ activities, ...plant }) => ({
    ...plant,
    growthStage: extractGrowthStage(activities),
  }))
}

export async function getPlantPassport(plantId: string, requestingUserId: string) {
  const owner = await prisma.cultivatedPlant.findUnique({ where: { id: plantId }, select: { realGardenId: true } })
  if (!owner) return null
  await assertGardenAccess(owner.realGardenId, requestingUserId, { requireApproved: false })
  return prisma.cultivatedPlant.findUnique({
    where: { id: plantId },
    include: {
      species: true,
      realGarden: {
        select: {
          id: true, name: true, province: true, canton: true, parish: true,
          latitude: true, longitude: true,
        },
      },
      registeredBy: { select: { id: true, name: true } },
    },
  })
}
