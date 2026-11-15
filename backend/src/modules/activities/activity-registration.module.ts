import { createActivityRegistrationService } from './application/activity-registration.service'
import { prismaActivityRegistrationRepository } from './infrastructure/prisma-activity-registration.repository'
import { assertGardenAccess } from '../gardens/garden-access.module'
import { harvestPlant } from '../harvest/harvest.module'
import { evaluateActivityReward } from '../rewards/application/rewards.service'
import { syncUserMissionsAndBadges } from '../rewards/application/missions.service'

export const createGardenActivity=createActivityRegistrationService(
 prismaActivityRegistrationRepository,
 {assertGardenAccess,harvestPlant,evaluateActivityReward,syncUserMissionsAndBadges}
)
