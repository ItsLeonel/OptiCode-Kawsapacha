import { prisma } from '../../../infrastructure/database/prisma'
import type { CatalogRepository } from '../application/catalog.repository'

/** Adaptador Prisma que conserva la búsqueda y el orden de la API existente. */
export const prismaCatalogRepository: CatalogRepository = {
  async findAll(query) {
    return prisma.medicinalCatalog.findMany({
      where: query
        ? { OR: [
            { name: { contains: query } },
            { latinName: { contains: query } },
            { family: { contains: query } },
            { otherNames: { contains: query } },
          ] }
        : undefined,
      orderBy: { name: 'asc' },
    })
  },
  async findById(id) {
    return prisma.medicinalCatalog.findUnique({ where: { id } })
  },
}
