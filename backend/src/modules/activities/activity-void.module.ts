import { createActivityVoidService } from './application/activity-void.service'
import { prismaActivityVoidRepository } from './infrastructure/prisma-activity-void.repository'
import { syncUserMissionsAndBadges } from '../rewards/application/missions.service'

export const voidGardenActivity=createActivityVoidService(prismaActivityVoidRepository,syncUserMissionsAndBadges)
