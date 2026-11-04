// backend/src/services/resource.service.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function listResources(communityId: string) {
  return prisma.communityResource.findMany({
    where: { communityId },
    orderBy: { createdAt: 'asc' },
  })
}

export async function createResource(
  communityId: string,
  data: {
    name: string
    category: string
    quantity: number
    unit: string
    status: string
    description: string
  }
) {
  return prisma.communityResource.create({
    data: { communityId, ...data },
  })
}

export async function updateResource(
  resourceId: string,
  data: Partial<{
    name: string
    category: string
    quantity: number
    unit: string
    status: string
    description: string
  }>
) {
  return prisma.communityResource.update({
    where: { id: resourceId },
    data,
  })
}

export async function deleteResource(resourceId: string) {
  return prisma.communityResource.delete({
    where: { id: resourceId },
  })
}

