import { createPlantReadService } from './application/plant-query.service'
import { createPlantLifecycleService } from './application/plant-lifecycle.service'
import { prismaPlantReadRepository, prismaPlantLifecycleRepository } from './infrastructure/prisma-plant-read.repository'
import { assertGardenAccess } from '../gardens/garden-access.module'
export { registerPlant } from './plant-write.module'
export { updatePlantDetails } from './plant-write.module'
export type { RegisterPlantInput, UpdatePlantInput } from './application/plant-input'

export const {listPlantsByGarden,getPlantPassport}=
 createPlantReadService(prismaPlantReadRepository,assertGardenAccess)
export const {removePlant,archivePlant}=
 createPlantLifecycleService(prismaPlantLifecycleRepository)
