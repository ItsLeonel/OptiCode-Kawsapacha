import { createCareService } from './application/care-implementation'
import { prismaCareRepository } from './infrastructure/prisma-care.repository'
import { createCarePlantAccessService } from './application/care-access.service'
import { prismaCareAccessRepository } from './infrastructure/prisma-care-access.repository'
import { assertGardenAccess } from '../gardens/garden-access.module'

export const {addCareLog,getCareLogs,calculateGrowth,getCalendarTips}=createCareService(prismaCareRepository)

export const requireCarePlantAccess = createCarePlantAccessService(prismaCareAccessRepository, assertGardenAccess)
