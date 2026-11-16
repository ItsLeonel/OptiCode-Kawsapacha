import { createMspCommunityService } from './application/admin-msp-community.service'
import { prismaMspCommunityRepository } from './infrastructure/prisma-msp-community.repository'
import { logAudit } from './audit.module'
import { createNotification } from '../notifications/notification.module'

export const { listCommunitiesForMsp, reviewCommunity } =
  createMspCommunityService(prismaMspCommunityRepository,{logAudit,createNotification})
