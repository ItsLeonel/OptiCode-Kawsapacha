import { createPlantReadService } from './application/plant-query.service'
import { createPlantLifecycleService } from './application/plant-lifecycle.service'
import { prismaPlantReadRepository, prismaPlantLifecycleRepository } from './infrastructure/prisma-plant-read.repository'
import { assertGardenAccess } from '../gardens/garden-access.module'
export { registerPlant } from './application/plant-registration.service'
export { updatePlantDetails } from './application/plant-update.service'
export type { RegisterPlantInput, UpdatePlantInput } from './application/plant-input'

export const {listPlantsByGarden,getPlantPassport}=
 createPlantReadService(prismaPlantReadRepository,assertGardenAccess)
export const {removePlant,archivePlant}=
 createPlantLifecycleService(prismaPlantLifecycleRepository)
