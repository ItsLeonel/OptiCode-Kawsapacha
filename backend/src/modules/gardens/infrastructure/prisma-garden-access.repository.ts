import { prisma } from '../../../infrastructure/database/prisma'
import type { GardenAccessRepository } from '../application/ports/garden-access.repository'
export const prismaGardenAccessRepository: GardenAccessRepository = {
 findGarden(gardenId) {
  return prisma.realGarden.findUnique({
   where: { id: gardenId },
   select: { id: true, createdById: true, communityId: true,
    community: { select: { id: true, status: true, name: true, reviewReason: true } } },
  })
 },
 async findMembershipStatus(communityId, userId) {
  const member = await prisma.communityMember.findUnique({
   where: { communityId_userId: { communityId, userId } },
  })
  return member?.status ?? null
 },
}
