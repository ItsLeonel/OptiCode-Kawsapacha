import { createGardenService } from './application/garden.service'
import { prismaGardenRepository, gardenPhotoStorage } from './infrastructure/prisma-garden.repository'
import { isCommunityResponsable } from '../communities/member.module'

export const {createGarden,listGardens,getGardenById,updateGarden}=
 createGardenService(prismaGardenRepository,gardenPhotoStorage,isCommunityResponsable)
