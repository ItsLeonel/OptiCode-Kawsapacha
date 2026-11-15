import { createMspActivityService } from './application/admin-msp-activity.service'
import { prismaMspActivityRepository } from './infrastructure/prisma-msp-activity.repository'
import { logAudit } from './audit.module'
import { createNotification } from '../notifications/notification.module'
import { evaluateActivityReward,getUserRewardsSummary } from '../rewards/rewards.module'
import { syncUserMissionsAndBadges } from '../rewards/missions.module'
import { calculateGrowth } from '../activities/care.module'
export const {listActivitiesForMsp,reviewActivity}=createMspActivityService(prismaMspActivityRepository,{
 logAudit,createNotification,evaluateActivityReward,getUserRewardsSummary,syncUserMissionsAndBadges,calculateGrowth,
})
