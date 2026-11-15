import path from 'node:path'
import { prismaPlantWriteRepository } from './infrastructure/prisma-plant-write.repository'
import { createPlantRegistrationService } from './application/plant-registration.service'
import { createPlantUpdateService } from './application/plant-update.service'
import { assertGardenAccess } from '../gardens/garden-access.module'
import { evaluateActivityReward } from '../rewards/rewards.module'
import { syncUserMissionsAndBadges } from '../rewards/application/missions.service'
const services={assertGardenAccess,evaluateActivityReward,syncUserMissionsAndBadges,basename:path.basename}
export const {registerPlant}=createPlantRegistrationService(prismaPlantWriteRepository,services)
export const {updatePlantDetails}=createPlantUpdateService(prismaPlantWriteRepository,services)
