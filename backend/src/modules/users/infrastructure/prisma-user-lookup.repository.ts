import { prisma } from '../../../infrastructure/database/prisma'
import type { UserLookupRepository } from '../application/ports/user-lookup.repository'

export const prismaUserLookupRepository: UserLookupRepository = {
  findUserByEmail(rawEmail, cleanEmail) {
    return prisma.user.findFirst({
      where: { OR: [{ email: cleanEmail }, { email: rawEmail }] },
      select: { id: true, name: true, email: true },
    })
  },
  findMembership(communityId, userId) {
    return prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId } },
      select: { status: true, roleInCommunity: true },
    })
  },
  findPendingInvitation(communityId, cleanEmail, userEmail) {
    return prisma.communityInvitation.findFirst({
      where: { communityId, OR: [{ email: cleanEmail }, { email: userEmail }], status: 'PENDING' },
      select: { role: true },
    })
  },
}
