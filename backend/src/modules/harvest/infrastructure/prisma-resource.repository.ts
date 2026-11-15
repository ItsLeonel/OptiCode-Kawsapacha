import { prisma } from '../../../infrastructure/database/prisma'
import type { ResourceInput } from '../domain/resource'

/** Adaptador Prisma que conserva orden, filtros y operaciones anteriores. */
export const prismaResourceRepository = {
  findMany(communityId: string) {
    return prisma.communityResource.findMany({
      where: { communityId },
      orderBy: { createdAt: 'asc' },
    })
  },
  create(communityId: string, data: ResourceInput) {
    return prisma.communityResource.create({ data: { communityId, ...data } })
  },
  update(resourceId: string, data: Partial<ResourceInput>) {
    return prisma.communityResource.update({ where: { id: resourceId }, data })
  },
  delete(resourceId: string) {
    return prisma.communityResource.delete({ where: { id: resourceId } })
  },
}
