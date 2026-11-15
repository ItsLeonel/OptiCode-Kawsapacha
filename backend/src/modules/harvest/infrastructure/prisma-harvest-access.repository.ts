import { prisma } from '../../../infrastructure/database/prisma'
import type { HarvestAccessRepository } from '../application/ports/harvest-access.repository'

export const prismaHarvestAccessRepository: HarvestAccessRepository = {
  async findPlantGardenId(plantId) {
    const plant = await prisma.cultivatedPlant.findUnique({
      where: { id: plantId }, select: { realGardenId: true },
    })
    return plant?.realGardenId ?? null
  },
  async findCommunityCreator(communityId) {
    const community = await prisma.community.findUnique({
      where: { id: communityId }, select: { creatorId: true },
    })
    return community?.creatorId ?? null
  },
  async findMembershipStatus(communityId, userId) {
    const member = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId } }, select: { status: true },
    })
    return member?.status ?? null
  },
}
