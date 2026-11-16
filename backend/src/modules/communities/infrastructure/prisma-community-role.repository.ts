import { prisma } from '../../../infrastructure/database/prisma'
import type { CommunityRoleRepository } from '../application/ports/community-role.repository'

export const prismaCommunityRoleRepository: CommunityRoleRepository = {
  async findAcceptedRole(communityId, userId) {
    const membership = await prisma.communityMember.findFirst({
      where: { communityId, userId, status: 'ACCEPTED' },
      select: { roleInCommunity: true },
    })
    return membership?.roleInCommunity ?? null
  },
}
