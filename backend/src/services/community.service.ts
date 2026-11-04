import { prisma } from '../config/prisma'

export interface CreateCommunityInput {
  name: string
  responsible: string
  location: string
  description: string
  creatorId: string
}

export async function createCommunity(input: CreateCommunityInput) {
  const community = await prisma.community.create({
    data: {
      name: input.name,
      responsible: input.responsible,
      location: input.location,
      description: input.description,
      creatorId: input.creatorId,
      members: {
        create: { userId: input.creatorId, roleInCommunity: 'RESPONSABLE' },
      },
    },
    include: { members: true },
  })
  return community
}

export async function listCommunities() {
  return prisma.community.findMany({
    include: {
      _count: { select: { members: true, gardens: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getCommunityById(id: string) {
  return prisma.community.findUnique({
    where: { id },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      gardens: true,
    },
  })
}

export async function updateCommunity(id: string, data: Partial<Omit<CreateCommunityInput, 'creatorId'>>) {
  return prisma.community.update({ where: { id }, data })
}

