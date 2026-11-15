import { createGardenAccessService } from './application/garden-access.service'
import { prismaGardenAccessRepository } from './infrastructure/prisma-garden-access.repository'
export const assertGardenAccess = createGardenAccessService(prismaGardenAccessRepository)
