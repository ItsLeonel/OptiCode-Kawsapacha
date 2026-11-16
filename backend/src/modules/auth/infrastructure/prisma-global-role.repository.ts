import { prisma } from '../../../infrastructure/database/prisma'
import type { GlobalRoleRepository } from '../application/ports/global-role.repository'

export const prismaGlobalRoleRepository: GlobalRoleRepository = {
  findUserRole(userId) {
    return prisma.user.findUnique({
      where: { id: userId }, select: { role: true, isActive: true },
    })
  },
}
