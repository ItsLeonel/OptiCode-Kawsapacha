import { prisma } from '../../../infrastructure/database/prisma'

/** Adaptador Prisma. Mantiene las mismas consultas, orden y filtros del servicio original. */
export const prismaCatalogRepository = {
  async findMany(query?: string) {
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
  async findById(id: string) {
    return prisma.medicinalCatalog.findUnique({ where: { id } })
  },
}
