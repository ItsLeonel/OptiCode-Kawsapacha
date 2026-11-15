import { createActivityReadService } from './application/activity-query.service'
import { prismaActivityReadRepository } from './infrastructure/prisma-activity-read.repository'
import { assertGardenAccess } from '../gardens/garden-access.module'

export const {listGardenActivities,getGardenActivityDetail}=
 createActivityReadService(prismaActivityReadRepository,assertGardenAccess)
