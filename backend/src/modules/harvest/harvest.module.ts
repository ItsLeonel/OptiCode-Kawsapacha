import { createHarvestService } from './application/harvest.service'
import { prismaHarvestRepository } from './infrastructure/prisma-harvest.repository'

export const { harvestPlant, listHarvestsByGarden, listHarvestsByCommunity } =
 createHarvestService(prismaHarvestRepository)
