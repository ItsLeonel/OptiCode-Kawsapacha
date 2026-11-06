import { prisma } from '../config/prisma'

export async function listCatalog(query?: string) {
  return prisma.medicinalCatalog.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query } },
            { latinName: { contains: query } },
          ],
        }
      : undefined,
    orderBy: { name: 'asc' },
  })
}

export async function getCatalogById(id: string) {
  return prisma.medicinalCatalog.findUnique({ where: { id } })
}

