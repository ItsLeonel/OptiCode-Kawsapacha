import { createHarvestService } from './application/harvest.service'
import { prismaHarvestRepository } from './infrastructure/prisma-harvest.repository'
import { createHarvestAccessService } from './application/harvest-access.service'
import { prismaHarvestAccessRepository } from './infrastructure/prisma-harvest-access.repository'

export const { harvestPlant, listHarvestsByGarden, listHarvestsByCommunity } =
 createHarvestService(prismaHarvestRepository)

export const { findHarvestPlantGardenId, checkCommunityHarvestAccess } = createHarvestAccessService(prismaHarvestAccessRepository)

import { createHarvestRoleService } from './application/harvest-role.service'
export const checkHarvestPermission = createHarvestRoleService(prismaHarvestAccessRepository)
