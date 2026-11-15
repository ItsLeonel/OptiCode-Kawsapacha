import { createActivityVoidService } from './application/activity-void.service'
import { prismaActivityVoidRepository } from './infrastructure/prisma-activity-void.repository'
import { syncUserMissionsAndBadges } from '../rewards/missions.module'

export const voidGardenActivity=createActivityVoidService(prismaActivityVoidRepository,syncUserMissionsAndBadges)
