import { createGardenService } from './application/garden.service'
import { prismaGardenRepository, gardenPhotoStorage } from './infrastructure/prisma-garden.repository'
import { isCommunityResponsable } from '../communities/application/member.service'

export const {createGarden,listGardens,getGardenById,updateGarden}=
 createGardenService(prismaGardenRepository,gardenPhotoStorage,isCommunityResponsable)
